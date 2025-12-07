import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import SEO from "@/components/SEO";
import TeamHeader from "@/components/team/TeamHeader";
import RecentVideos from "@/components/team/RecentVideos";
import TeamInfoCard from "@/components/team/TeamInfoCard";
import RecentGames from "@/components/team/RecentGames";
import LeagueStandingsSection from "@/components/team/LeagueStandingsSection";
import StarPlayers from "@/components/team/StarPlayers";
import { Team, Player, TeamStanding } from "@/types/team";
import { useTeams } from "@/hooks/useTeams";

const externalSupabase = createClient(
  'https://nvlpbdyqfzmlrjauvhxx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52bHBiZHlxZnptbHJqYXV2aHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYwMTYsImV4cCI6MjA3ODI3MjAxNn0._-QXs8CF8p6mkJYQYouC7oQWR-WHdpH8Iy4TqJKut68'
);

const TeamDetail = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const { data: teams = [] } = useTeams();

  // 팀 정보 조회
  const { data: team, isLoading: isLoadingTeam } = useQuery({
    queryKey: ['team-detail', teamId],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_teams')
        .select('*')
        .eq('id', teamId)
        .single();

      if (error) throw error;
      return data as Team;
    },
    enabled: !!teamId,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
  });

  // 순위 정보 조회
  const { data: standings } = useQuery({
    queryKey: ['team-standings'],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_standings')
        .select('*, team:alih_teams(name, logo)')
        .order('rank', { ascending: true });

      if (error) throw error;
      return (data || []).map(standing => ({
        ...standing,
        team: standing.team as unknown as { name: string; logo: string }
      })) as TeamStanding[];
    },
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
  });

  // 해당 팀의 현재 순위
  const currentRank = standings?.find(s => s.team_id === Number(teamId))?.rank;

  // 선수 정보 조회
  const { data: players } = useQuery({
    queryKey: ['team-players', teamId],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_players')
        .select('*')
        .eq('team_id', teamId)
        .order('points', { ascending: false });

      if (error) throw error;
      return data as Player[];
    },
    enabled: !!teamId,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
  });

  // 최근 경기 조회 (완료된 경기 5개)
  const { data: recentGames } = useQuery({
    queryKey: ['team-recent-games', teamId],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_schedule')
        .select('*')
        .or(`home_alih_team_id.eq.${teamId},away_alih_team_id.eq.${teamId}`)
        .eq('game_status', 'Game Finished')
        .order('match_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: !!teamId,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
  });

  if (isLoadingTeam) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">팀 정보를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={`${team.name} - 팀 상세 정보`}
        description={`${team.name}의 팀 정보, 최신 영상, 최근 경기 결과, 주요 선수를 확인하세요.`}
        keywords={`${team.name}, ${team.english_name}, 아시아리그, 아이스하키`}
        path={`/team/${teamId}`}
      />

      <div className="min-h-screen pb-20">
        {/* 헤더 & 팀 아이덴티티 */}
        <div className="relative bg-gradient-to-b from-secondary/50 to-background">
          <TeamHeader team={team} rank={currentRank} />
        </div>

        <div className="container mx-auto px-4 py-6">
          {/* 최신 영상 */}
          {team.recent_videos && team.recent_videos.length > 0 && (
            <RecentVideos videos={team.recent_videos} />
          )}

          {/* 팀 정보 */}
          {team.team_info && <TeamInfoCard teamInfo={team.team_info} />}

          {/* 최근 경기 */}
          <RecentGames games={recentGames || []} teams={teams} teamId={Number(teamId)} />

          {/* 리그 순위 */}
          {standings && standings.length > 0 && (
            <LeagueStandingsSection standings={standings} currentTeamId={Number(teamId)} />
          )}

          {/* 주요 선수 */}
          {players && players.length > 0 && (
            <StarPlayers players={players} teamId={Number(teamId)} />
          )}
        </div>
      </div>
    </>
  );
};

export default TeamDetail;
