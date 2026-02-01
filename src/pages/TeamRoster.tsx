import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { externalSupabase } from "@/lib/supabase-external";
import { Loader2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import SEO from "@/components/SEO";
import TeamHeader from "@/components/team/TeamHeader";
import { Team, Player, TeamStanding } from "@/types/team";
import { useTranslation } from "react-i18next";
import { getLocalizedTeamName } from "@/hooks/useLocalizedTeamName";

const TeamRoster = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;

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

  const { data: players, isLoading: isLoadingPlayers } = useQuery({
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

  // 로스터 페이지용 구조화 데이터
  const rosterStructuredData = {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    "name": team.name,
    "alternateName": team.english_name,
    "sport": "Ice Hockey",
    "logo": team.logo,
    "url": `https://alhockey.fans/roster/${teamId}`,
    "athlete": players?.slice(0, 10).map(player => ({
      "@type": "Person",
      "name": player.name,
      "jobTitle": player.position,
      "memberOf": {
        "@type": "SportsTeam", 
        "name": team.name
      }
    })) || []
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": t('nav.home'), "item": "https://alhockey.fans" },
      { "@type": "ListItem", "position": 2, "name": getLocalizedTeamName(team, currentLang), "item": `https://alhockey.fans/team/${teamId}` },
      { "@type": "ListItem", "position": 3, "name": t('team.roster'), "item": `https://alhockey.fans/roster/${teamId}` }
    ]
  };

  return (
    <>
      <SEO
        title={`${getLocalizedTeamName(team, currentLang)} ${t('team.roster')} | ${t('seo.leagueName')}`}
        description={`${getLocalizedTeamName(team, currentLang)} (${team.english_name})`}
        keywords={`${getLocalizedTeamName(team, currentLang)}, ${team.english_name}, ${t('seo.leagueName')}`}
        path={`/roster/${teamId}`}
        structuredData={[rosterStructuredData, breadcrumbData]}
      />

      <div className="min-h-screen pb-20">
        {/* 헤더 & 팀 아이덴티티 */}
        <div className="relative bg-gradient-to-b from-secondary/50 to-background pt-[calc(1rem+env(safe-area-inset-top))]">
          <TeamHeader team={team} rank={currentRank} />
        </div>

        <div className="container mx-auto px-4 py-6">
          {/* 선수 명단 (포지션별 그룹화) */}
          <div className="space-y-8">
            {isLoadingPlayers ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : players && players.length > 0 ? (
              <>
                {/* Forwards */}
                <Card className="p-4 md:p-6">
                  <h2 className="text-xl font-bold mb-4">
                    {t('gameDetail.position.forward', 'Forwards')}
                  </h2>
                  {renderRosterSection(players.filter(p => p.position === 'F'))}
                </Card>

                {/* Defenders */}
                <Card className="p-4 md:p-6">
                  <h2 className="text-xl font-bold mb-4">
                    {t('gameDetail.position.defense', 'Defenders')}
                  </h2>
                  {renderRosterSection(players.filter(p => p.position === 'D'))}
                </Card>

                {/* Goalies */}
                <Card className="p-4 md:p-6">
                  <h2 className="text-xl font-bold mb-4">
                    {t('gameDetail.position.goalie', 'Goalies')}
                  </h2>
                  {renderRosterSection(players.filter(p => p.position === 'G'))}
                </Card>

                {/* 통계 용어 설명 */}
                <div className="p-4 bg-secondary/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">+/−</span> : {t('roster.plusMinusDesc')}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {t('roster.noPlayers')}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

const renderRosterSection = (players: Player[]) => {
  if (players.length === 0) return <p className="text-muted-foreground text-sm py-4">No players listed.</p>;
  
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center w-14">No.</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="text-center w-16">GP</TableHead>
            <TableHead className="text-center w-16">G</TableHead>
            <TableHead className="text-center w-16">A</TableHead>
            <TableHead className="text-center w-16 font-semibold">PTS</TableHead>
            <TableHead className="text-center w-16">PIM</TableHead>
            <TableHead className="text-center w-16">+/-</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((player) => (
            <TableRow key={player.id} className="hover:bg-secondary/30">
              <TableCell className="text-center font-medium">
                {player.jersey_number}
              </TableCell>
              <TableCell className="font-medium">
                <Link to={`/player/${player.slug || player.id}`} className="hover:underline hover:text-primary text-foreground transition-colors">
                  {player.name}
                </Link>
              </TableCell>
              <TableCell className="text-center text-muted-foreground">{player.games_played}</TableCell>
              <TableCell className="text-center text-primary font-medium">
                {player.goals}
              </TableCell>
              <TableCell className="text-center text-muted-foreground">{player.assists}</TableCell>
              <TableCell className="text-center font-bold text-foreground">
                {player.points}
              </TableCell>
              <TableCell className="text-center text-muted-foreground hidden md:table-cell">
                {player.pim}
              </TableCell>
              <TableCell className="text-center text-muted-foreground hidden md:table-cell">
                {player.plus_minus > 0 ? '+' : ''}{player.plus_minus}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};


export default TeamRoster;
