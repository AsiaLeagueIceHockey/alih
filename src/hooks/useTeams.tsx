import { useQuery } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';

const externalSupabase = createClient(
  'https://nvlpbdyqfzmlrjauvhxx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52bHBiZHlxZnptbHJqYXV2aHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYwMTYsImV4cCI6MjA3ODI3MjAxNn0._-QXs8CF8p6mkJYQYouC7oQWR-WHdpH8Iy4TqJKut68'
);

export interface AlihTeam {
  id: number;
  name: string;
  english_name: string;
  logo: string;
}

export const useTeams = () => {
  return useQuery({
    queryKey: ['alih-teams'],
    queryFn: async () => {
      console.log('🔵 Supabase 연결 시도: alih_teams 테이블 조회');
      
      const { data, error } = await externalSupabase
        .from('alih_teams')
        .select('*')
        .order('id', { ascending: true });
      
      if (error) {
        console.error('❌ Supabase 에러 (alih_teams):', error);
        throw error;
      }
      
      console.log('✅ alih_teams 연결 성공! 조회된 팀 수:', data?.length || 0);
      console.log('📊 팀 데이터:', data);
      
      return data as AlihTeam[];
    },
    staleTime: 1000 * 60 * 60, // 1시간 동안 캐시
    gcTime: 1000 * 60 * 60 * 24, // 24시간 동안 메모리에 유지
  });
};
