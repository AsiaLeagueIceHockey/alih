import { useQuery } from "@tanstack/react-query";
import { externalSupabase } from "@/lib/supabase-external";

export interface ScheduleGame {
  id: number;
  game_no: number;
  home_alih_team_id: number;
  away_alih_team_id: number;
  home_alih_team_score: number | null;
  away_alih_team_score: number | null;
  match_at: string;
  match_place: string;
  highlight_url: string | null;
  highlight_title: string | null;
  game_status: string | null;
  live_url: string | null;
  live_data: {
    shots: {
      '1p': { home: number; away: number };
      '2p': { home: number; away: number };
      '3p': { home: number; away: number };
      ovt: { home: number; away: number };
      pss: { home: number; away: number };
      total: { home: number; away: number };
    };
    events: Array<{
      time: string;
      scorer: { name: string; number: number };
      assist1: { name: string; number: number } | null;
      assist2: { name: string; number: number } | null;
      team_id: number;
      goal_type: string;
    }>;
    scores_by_period: {
      '1p': { home: number | null; away: number | null };
      '2p': { home: number | null; away: number | null };
      '3p': { home: number | null; away: number | null };
      ovt: { home: number | null; away: number | null };
      pss: { home: number | null; away: number | null };
    };
    polled_at: string;
    updated_at_source: string;
  } | null;
}

/**
 * 전체 일정 데이터를 가져오는 공통 훅
 * - 모든 페이지에서 동일한 캐시 사용 (queryKey: 'alih-schedules')
 * - 진행 중인 경기가 있을 때만 1분마다 polling
 */
export const useSchedules = () => {
  return useQuery({
    queryKey: ['alih-schedules'],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_schedule')
        .select('*')
        .order('match_at', { ascending: true });
      
      if (error) throw error;
      return data as ScheduleGame[];
    },
    staleTime: 1000 * 60 * 5, // 5분 동안 캐시
    gcTime: 1000 * 60 * 60 * 24, // 24시간 동안 메모리에 유지
    // 진행 중인 경기가 있을 때만 1분마다 polling
    refetchInterval: (query) => {
      const data = query.state.data as ScheduleGame[] | undefined;
      if (!data) return false;
      const now = new Date();
      const hasInProgress = data.some(game => {
        const matchDate = new Date(game.match_at);
        return matchDate <= now && game.game_status !== 'Game Finished';
      });
      return hasInProgress ? 30000 : false;
    },
    refetchIntervalInBackground: false,
  });
};

/**
 * 특정 game_no의 일정 데이터를 가져오는 훅
 * - 전체 일정 캐시를 사용하여 데이터 일관성 보장
 */
export const useScheduleByGameNo = (gameNo: string | number | null | undefined) => {
  const { data: schedules, isLoading, error } = useSchedules();
  
  const scheduleData = gameNo 
    ? schedules?.find(game => game.game_no === Number(gameNo))
    : undefined;
  
  return {
    data: scheduleData,
    isLoading,
    error,
  };
};
