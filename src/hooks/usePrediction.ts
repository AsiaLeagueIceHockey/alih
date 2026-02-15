import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { externalSupabase } from '@/lib/supabase-external';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect, useCallback } from 'react';

export type PredictionType = 'home_reg' | 'home_ot' | 'away_ot' | 'away_reg';

interface PredictionCounts {
  home_reg: number;
  home_ot: number;
  away_ot: number;
  away_reg: number;
  total: number;
}

interface UserPrediction {
  prediction: PredictionType;
}

const STORAGE_KEY = 'alih_pending_predictions';

// localStorage 헬퍼
const getPendingPrediction = (scheduleId: number): PredictionType | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const data = JSON.parse(stored);
    return data[scheduleId] || null;
  } catch {
    return null;
  }
};

const setPendingPrediction = (scheduleId: number, prediction: PredictionType) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const data = stored ? JSON.parse(stored) : {};
    data[scheduleId] = prediction;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // silently fail
  }
};

const removePendingPrediction = (scheduleId: number) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    const data = JSON.parse(stored);
    delete data[scheduleId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // silently fail
  }
};

export const usePrediction = (scheduleId: number) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingPrediction, setPendingPredictionState] = useState<PredictionType | null>(null);

  // 예측 집계 데이터 조회
  const { data: counts, isLoading: countsLoading } = useQuery({
    queryKey: ['prediction-counts', scheduleId],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_predictions')
        .select('prediction')
        .eq('schedule_id', scheduleId);

      if (error) throw error;

      const result: PredictionCounts = {
        home_reg: 0,
        home_ot: 0,
        away_ot: 0,
        away_reg: 0,
        total: 0,
      };

      (data || []).forEach((row: { prediction: string }) => {
        const key = row.prediction as PredictionType;
        if (key in result) {
          result[key]++;
          result.total++;
        }
      });

      return result;
    },
    enabled: !!scheduleId,
  });

  // 현재 사용자의 예측 조회
  const { data: userPrediction, isLoading: userPredictionLoading } = useQuery({
    queryKey: ['user-prediction', scheduleId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await externalSupabase
        .from('alih_predictions')
        .select('prediction')
        .eq('schedule_id', scheduleId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as UserPrediction | null;
    },
    enabled: !!scheduleId && !!user,
  });

  // 비로그인 시 localStorage 예측 확인
  useEffect(() => {
    if (!user) {
      setPendingPredictionState(getPendingPrediction(scheduleId));
    }
  }, [scheduleId, user]);

  // 로그인 후 pending prediction 자동 저장
  useEffect(() => {
    if (user && scheduleId) {
      const pending = getPendingPrediction(scheduleId);
      if (pending && !userPrediction) {
        submitMutation.mutate(pending);
        removePendingPrediction(scheduleId);
        setPendingPredictionState(null);
      }
    }
  }, [user, scheduleId, userPrediction]);

  // 예측 제출 mutation
  const submitMutation = useMutation({
    mutationFn: async (prediction: PredictionType) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await externalSupabase
        .from('alih_predictions')
        .upsert(
          {
            user_id: user.id,
            schedule_id: scheduleId,
            prediction,
          },
          { onConflict: 'user_id,schedule_id' }
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prediction-counts', scheduleId] });
      queryClient.invalidateQueries({ queryKey: ['user-prediction', scheduleId, user?.id] });
    },
  });

  // 예측 제출 (Lazy Registration 핸들링)
  const submitPrediction = useCallback(
    (prediction: PredictionType) => {
      if (user) {
        submitMutation.mutate(prediction);
      } else {
        // 비로그인: localStorage에 저장 + 로그인 모달 표시
        setPendingPrediction(scheduleId, prediction);
        setPendingPredictionState(prediction);
        setShowLoginModal(true);
      }
    },
    [user, scheduleId, submitMutation]
  );

  // 현재 선택된 예측 (DB 또는 localStorage)
  const currentPrediction: PredictionType | null =
    userPrediction?.prediction || pendingPrediction || null;

  return {
    counts: counts || { home_reg: 0, home_ot: 0, away_ot: 0, away_reg: 0, total: 0 },
    currentPrediction,
    isLoading: countsLoading || userPredictionLoading,
    submitPrediction,
    isSubmitting: submitMutation.isPending,
    showLoginModal,
    setShowLoginModal,
  };
};
