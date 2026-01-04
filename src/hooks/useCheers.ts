import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';

const supabase = createClient(
  'https://nvlpbdyqfzmlrjauvhxx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52bHBiZHlxZnptbHJqYXV2aHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYwMTYsImV4cCI6MjA3ODI3MjAxNn0._-QXs8CF8p6mkJYQYouC7oQWR-WHdpH8Iy4TqJKut68'
);

interface CheerData {
  id: number;
  game_no: number;
  home_cheers: number;
  away_cheers: number;
}

interface UseCheersReturn {
  homeCheers: number;
  awayCheers: number;
  homePercentage: number;
  awayPercentage: number;
  isLoading: boolean;
  addCheer: (team: 'home' | 'away') => void;
}

export function useCheers(gameNo: number | string): UseCheersReturn {
  const queryClient = useQueryClient();
  const gameNoNum = typeof gameNo === 'string' ? parseInt(gameNo, 10) : gameNo;
  
  // 로컬 상태 (Optimistic UI용) - 기본값 100
  const [localHomeCheers, setLocalHomeCheers] = useState<number>(100);
  const [localAwayCheers, setLocalAwayCheers] = useState<number>(100);
  
  // 서버로 전송 대기 중인 클릭 카운트
  const pendingHomeRef = useRef<number>(0);
  const pendingAwayRef = useRef<number>(0);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // 초기 데이터 로드
  const { data, isLoading } = useQuery({
    queryKey: ['cheers', gameNoNum],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alih_cheers')
        .select('*')
        .eq('game_no', gameNoNum)
        .maybeSingle();

      if (error) throw error;
      return data as CheerData | null;
    },
    staleTime: 0, // 항상 최신 데이터
  });

  // 초기 데이터로 로컬 상태 설정 (기본값 100 유지)
  useEffect(() => {
    if (data) {
      setLocalHomeCheers(data.home_cheers + 100);
      setLocalAwayCheers(data.away_cheers + 100);
    }
  }, [data]);

  // 서버로 배치 전송
  const flushToServer = useCallback(async () => {
    const homeCount = pendingHomeRef.current;
    const awayCount = pendingAwayRef.current;
    
    if (homeCount === 0 && awayCount === 0) return;
    
    // 대기열 초기화
    pendingHomeRef.current = 0;
    pendingAwayRef.current = 0;

    try {
      // 홈팀 클릭이 있으면 전송
      if (homeCount > 0) {
        await supabase.rpc('increment_cheers', {
          p_game_no: gameNoNum,
          p_team: 'home',
          p_count: homeCount,
        });
      }
      
      // 어웨이팀 클릭이 있으면 전송
      if (awayCount > 0) {
        await supabase.rpc('increment_cheers', {
          p_game_no: gameNoNum,
          p_team: 'away',
          p_count: awayCount,
        });
      }
    } catch (error) {
      console.error('Failed to sync cheers:', error);
      // 실패 시 롤백 (Optimistic UI 복구)
      setLocalHomeCheers(prev => prev - homeCount);
      setLocalAwayCheers(prev => prev - awayCount);
    }
  }, [gameNoNum]);

  // 응원 추가 (Optimistic + Debounced)
  const addCheer = useCallback((team: 'home' | 'away') => {
    // 1. 즉시 로컬 상태 업데이트 (Optimistic UI)
    if (team === 'home') {
      setLocalHomeCheers(prev => prev + 1);
      pendingHomeRef.current += 1;
    } else {
      setLocalAwayCheers(prev => prev + 1);
      pendingAwayRef.current += 1;
    }

    // 2. 햅틱 피드백 (모바일)
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }

    // 3. Debounce: 1초 후 서버로 전송
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      flushToServer();
    }, 1000);
  }, [flushToServer]);

  // Realtime 구독
  useEffect(() => {
    const channel = supabase
      .channel(`cheers:${gameNoNum}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alih_cheers',
          filter: `game_no=eq.${gameNoNum}`,
        },
        (payload) => {
          const newData = payload.new as CheerData;
          if (newData) {
            // 서버 값으로 동기화 (다른 유저의 응원 반영)
            setLocalHomeCheers(newData.home_cheers);
            setLocalAwayCheers(newData.away_cheers);
            // 캐시도 업데이트
            queryClient.setQueryData(['cheers', gameNoNum], newData);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      // 정리: 대기 중인 클릭 전송 후 채널 해제
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        flushToServer();
      }
      channel.unsubscribe();
    };
  }, [gameNoNum, queryClient, flushToServer]);

  // 퍼센티지 계산
  const total = localHomeCheers + localAwayCheers;
  const homePercentage = total > 0 ? Math.round((localHomeCheers / total) * 100) : 50;
  const awayPercentage = total > 0 ? 100 - homePercentage : 50;

  return {
    homeCheers: localHomeCheers,
    awayCheers: localAwayCheers,
    homePercentage,
    awayPercentage,
    isLoading,
    addCheer,
  };
}
