import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { externalSupabase } from "@/lib/supabase-external";
import { Loader2 } from "lucide-react";
import SEO from "@/components/SEO";
import TeamHeader from "@/components/team/TeamHeader";
import RecentVideos from "@/components/team/RecentVideos";
import TeamInfoCard from "@/components/team/TeamInfoCard";
import RecentGames from "@/components/team/RecentGames";
import LeagueStandingsSection from "@/components/team/LeagueStandingsSection";
import StarPlayers from "@/components/team/StarPlayers";
import TeamStats from "@/components/team/TeamStats";
import { Team, Player, TeamStanding } from "@/types/team";
import { useTeams } from "@/hooks/useTeams";
import { useTranslation } from "react-i18next";
import { getLocalizedTeamName } from "@/hooks/useLocalizedTeamName";
import { CommentSection } from "@/components/comments";

const TeamDetail = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const { data: teams = [] } = useTeams();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;

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

  // 홈/원정 전체 경기 조회 (통계용)
  const { data: allFinishedGames } = useQuery({
    queryKey: ['team-all-games', teamId],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_schedule')
        .select('*')
        .or(`home_alih_team_id.eq.${teamId},away_alih_team_id.eq.${teamId}`)
        .eq('game_status', 'Game Finished')
        .order('match_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!teamId,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
  });

  // 팀의 경기 상세 데이터 조회 (골 통계용)
  const { data: gameDetails } = useQuery({
    queryKey: ['team-game-details', teamId],
    queryFn: async () => {
      // 팀의 완료된 경기 game_no 목록
      const gameNos = allFinishedGames?.map(g => g.game_no) || [];
      if (gameNos.length === 0) return [];

      const { data, error } = await externalSupabase
        .from('alih_game_details')
        .select('game_no, goals')
        .in('game_no', gameNos);

      if (error) throw error;
      return data || [];
    },
    enabled: !!allFinishedGames && allFinishedGames.length > 0,
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
        <p className="text-muted-foreground">{t('error.teamNotFound')}</p>
      </div>
    );
  }

  // 홈/원정 성적 계산
  const teamIdNum = Number(teamId);
  const homeGames = allFinishedGames?.filter(g => g.home_alih_team_id === teamIdNum) || [];
  const awayGames = allFinishedGames?.filter(g => g.away_alih_team_id === teamIdNum) || [];

  const homeRecord = {
    wins: homeGames.filter(g => (g.home_alih_team_score ?? 0) > (g.away_alih_team_score ?? 0)).length,
    losses: homeGames.filter(g => (g.home_alih_team_score ?? 0) < (g.away_alih_team_score ?? 0)).length,
  };

  const awayRecord = {
    wins: awayGames.filter(g => (g.away_alih_team_score ?? 0) > (g.home_alih_team_score ?? 0)).length,
    losses: awayGames.filter(g => (g.away_alih_team_score ?? 0) < (g.home_alih_team_score ?? 0)).length,
  };

  // 최근 5경기 폼 (W/L)
  const recentForm: ('W' | 'L')[] = (recentGames || []).slice(0, 5).map(game => {
    const isHome = game.home_alih_team_id === teamIdNum;
    const teamScore = isHome ? game.home_alih_team_score : game.away_alih_team_score;
    const opponentScore = isHome ? game.away_alih_team_score : game.home_alih_team_score;
    return (teamScore ?? 0) > (opponentScore ?? 0) ? 'W' : 'L';
  });

  // 평균 득점/실점 (standings에서 가져오기)
  const currentStanding = standings?.find(s => s.team_id === teamIdNum);
  const gamesPlayed = currentStanding?.games_played || (homeGames.length + awayGames.length);
  const avgGoalsFor = gamesPlayed > 0 ? (currentStanding?.goals_for || 0) / gamesPlayed : 0;
  const avgGoalsAgainst = gamesPlayed > 0 ? (currentStanding?.goals_against || 0) / gamesPlayed : 0;

  // 고급 통계 계산 (골 상세 데이터 기반)
  interface Goal {
    goal_no: number;
    period: number;
    time: string;
    team_id: number;
    situation: string;
    assist1_no: number | null;
    assist2_no: number | null;
  }

  const advancedStats = (() => {
    if (!gameDetails || !allFinishedGames) {
      return { ppGoals: 0, totalGoals: 0, ppRate: 0, periodGoals: { p1: 0, p2: 0, p3: 0, ot: 0 } };
    }

    let ppGoals = 0;
    let shGoals = 0;
    let totalGoals = 0;
    const periodGoals = { p1: 0, p2: 0, p3: 0, ot: 0 };

    gameDetails.forEach((detail) => {
      const game = allFinishedGames.find(g => g.game_no === detail.game_no);
      if (!game || !detail.goals) return;

      const goals = detail.goals as Goal[];
      goals.forEach((goal) => {
        // 이 팀의 골만 카운트
        if (goal.team_id === teamIdNum) {
          totalGoals++;

          // 파워플레이/숏핸디드 골
          if (goal.situation === '+1') ppGoals++;
          else if (goal.situation === '-1') shGoals++;

          // 피리어드별 득점
          if (goal.period === 1) periodGoals.p1++;
          else if (goal.period === 2) periodGoals.p2++;
          else if (goal.period === 3) periodGoals.p3++;
          else periodGoals.ot++; // 연장/슛아웃
        }
      });
    });

    const ppRate = totalGoals > 0 ? (ppGoals / totalGoals) * 100 : 0;

    return { ppGoals, shGoals, totalGoals, ppRate, periodGoals };
  })();

  // 팀 상세 페이지용 구조화 데이터
  const teamStructuredData = {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    "name": team.name,
    "alternateName": team.english_name,
    "sport": "Ice Hockey",
    "logo": team.logo,
    "url": `https://alhockey.fans/team/${teamId}`,
    "memberOf": {
      "@type": "SportsLeague",
      "name": "Asia League Ice Hockey",
      "url": "https://alhockey.fans"
    },
    ...(team.team_info && {
      "location": {
        "@type": "Place",
        "name": team.team_info.hometown,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": team.team_info.hometown
        }
      },
      "foundingDate": team.team_info.founding_year?.toString()
    }),
    ...(team.instagram_url && {
      "sameAs": [team.instagram_url].filter(Boolean)
    })
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": t('nav.home'), "item": "https://alhockey.fans" },
      { "@type": "ListItem", "position": 2, "name": team.name, "item": `https://alhockey.fans/team/${teamId}` }
    ]
  };

  // home_stadium이 객체인 경우 name 속성 사용
  const homeStadiumName = team.team_info?.home_stadium 
    ? (typeof team.team_info.home_stadium === 'string' 
        ? team.team_info.home_stadium 
        : team.team_info.home_stadium.name)
    : '';

  return (
    <>
      <SEO
        title={`${getLocalizedTeamName(team, currentLang)} | ${t('seo.leagueName')}`}
        description={`${getLocalizedTeamName(team, currentLang)} (${team.english_name}) ${team.team_info ? `@ ${homeStadiumName}` : ''}`}
        keywords={`${getLocalizedTeamName(team, currentLang)}, ${team.english_name}, ${t('seo.leagueName')}, ${team.team_info?.hometown || ''}`}
        path={`/team/${teamId}`}
        structuredData={[teamStructuredData, breadcrumbData]}
      />

      <div className="min-h-screen pb-20">
        {/* 헤더 & 팀 아이덴티티 */}
        <div className="relative bg-gradient-to-b from-secondary/50 to-background pt-[calc(1rem+env(safe-area-inset-top))]">
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

          {/* 시즌 통계 */}
          {allFinishedGames && allFinishedGames.length > 0 && (
            <TeamStats
              homeRecord={homeRecord}
              awayRecord={awayRecord}
              recentForm={recentForm}
              avgGoalsFor={avgGoalsFor}
              avgGoalsAgainst={avgGoalsAgainst}
              gamesPlayed={gamesPlayed}
              advancedStats={advancedStats}
            />
          )}

          {/* 리그 순위 */}
          {standings && standings.length > 0 && (
            <LeagueStandingsSection standings={standings} currentTeamId={Number(teamId)} />
          )}

          {/* 주요 선수 */}
          {players && players.length > 0 && (
            <StarPlayers players={players} teamId={Number(teamId)} />
          )}

          {/* 댓글 섹션 */}
          <CommentSection entityType="team" entityId={Number(teamId)} />
        </div>
      </div>
    </>
  );
};

export default TeamDetail;
