import { useState, useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { externalSupabase } from "@/lib/supabase-external";
import { useTeams } from "@/hooks/useTeams";
import { getLocalizedTeamName } from "@/hooks/useLocalizedTeamName";
import { Link, useSearchParams } from "react-router-dom";
import SEO from "@/components/SEO";
import { Player } from "@/types/team";

// Player type with joined team data
interface PlayerWithTeam extends Player {
  team: {
    id: number;
    name: string;
    english_name: string;
    logo: string;
  };
}

const Players = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const [searchParams, setSearchParams] = useSearchParams();
  
  const searchQuery = searchParams.get("q") || "";
  const selectedTeam = searchParams.get("team");

  const handleSearchChange = (value: string) => {
    setSearchParams(prev => {
      if (value) prev.set("q", value);
      else prev.delete("q");
      return prev;
    }, { replace: true });
  };

  const handleTeamSelect = (teamName: string | null) => {
    setSearchParams(prev => {
      if (teamName) prev.set("team", teamName);
      else prev.delete("team");
      return prev;
    });
  };

  const { data: teams, isLoading: teamsLoading } = useTeams();

  const { data: players, isLoading: playersLoading } = useQuery({
    queryKey: ['all-players-with-team'],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alih_players')
        .select('*, team:alih_teams(id, name, english_name, logo)')
        .order('name'); // Default sort by name

      if (error) throw error;
      return data as PlayerWithTeam[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const filteredPlayers = useMemo(() => {
    if (!players) return [];

    let filtered = players;

    // Team Filter
    if (selectedTeam) {
      filtered = filtered.filter(p => p.team?.english_name === selectedTeam);
    }

    // Search Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.name_en?.toLowerCase().includes(query) ||
        p.name_ja?.toLowerCase().includes(query) ||
        p.jersey_number.toString().includes(query)
      );
    }

    return filtered;
  }, [players, selectedTeam, searchQuery]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <SEO 
        title={t('nav.players', 'Players')}
        description="Search for Asia League Ice Hockey players"
        path="/players"
      />
      <PageHeader 
        title={t('nav.players', 'Players')} 
        subtitle={t('page.players.subtitle', '2025-26 Season Players')} 
      />

      <div className="container mx-auto px-4">
        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder={t('search.placeholder', 'Search by name or number...')}
            className="pl-10"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        {/* Team Filter */}
        {teamsLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="mb-6">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <Button
                variant={selectedTeam === null ? "default" : "outline"}
                size="sm"
                onClick={() => handleTeamSelect(null)}
                className="whitespace-nowrap"
              >
                {t('filter.allTeams')}
              </Button>
              {teams?.map((team) => (
                <Button
                  key={team.id}
                  variant={selectedTeam === team.english_name ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTeamSelect(team.english_name)}
                  className={`flex items-center gap-2 ${currentLang === 'ko' ? 'whitespace-nowrap' : ''}`}
                >
                  {team.logo && (
                    <img src={team.logo} alt={getLocalizedTeamName(team, currentLang)} className="w-4 h-4 object-contain" />
                  )}
                  {getLocalizedTeamName(team, currentLang)}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Sort Indicator */}
        <div className="flex justify-between items-center mb-4 px-1">
          <span className="text-sm text-muted-foreground">
             {filteredPlayers.length} {t('players.count', 'players')}
          </span>
          <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
             {t('players.sortedByName', 'Sorted by Name')}
          </span>
        </div>

        {/* Players Grid */}
        {playersLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>{t('error.noData', 'No players found')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredPlayers.map((player) => (
              <Link to={`/player/${player.slug || player.id}`} key={player.id}>
                <Card className="overflow-hidden hover:border-primary/50 transition-colors h-full flex flex-col">
                  {/* Player Image */}
                  <div className="aspect-[3/4] bg-secondary relative overflow-hidden group">
                    {player.photo_url ? (
                      <img 
                        src={player.photo_url} 
                        alt={player.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary/50">
                        <User className="h-12 w-12 text-muted-foreground/30" />
                      </div>
                    )}
                    {/* Team Logo Overlay (Optional style) */}
                    {player.team?.logo && (
                      <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm p-1 shadow-sm">
                         <img src={player.team.logo} alt={player.team.name} className="w-full h-full object-contain" />
                      </div>
                    )}
                    {/* Position Badge */}
                    <div className="absolute top-2 right-2">
                         <Badge variant="secondary" className="bg-black/50 hover:bg-black/70 text-white backdrop-blur-md border-none text-xs">
                           {player.position}
                         </Badge>
                    </div>
                  </div>
                  
                  {/* Player Info */}
                  <div className="p-3 flex flex-col flex-grow">
                     <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-sm line-clamp-2 leading-tight">
                          {player.name}
                        </h3>
                        <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                          #{player.jersey_number}
                        </span>
                     </div>
                     <p className="text-xs text-muted-foreground mt-auto truncate">
                        {getLocalizedTeamName({ 
                          name: player.team?.name, 
                          english_name: player.team?.english_name 
                        }, currentLang)}
                     </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Players;
