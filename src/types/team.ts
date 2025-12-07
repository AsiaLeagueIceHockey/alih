// Team data types based on alih_teams table structure

export interface HomeStadium {
  name: string;
  link: string;
}

export interface ChampionshipHistory {
  alih_wins: number[];
}

export interface TeamInfo {
  hometown: string;
  home_stadium: HomeStadium;
  founding_year: number;
  history_summary: string;
  championship_history: ChampionshipHistory;
}

export interface RecentVideo {
  id: string;
  title: string;
  thumbnail: string;
  embedUrl: string;
  publishedAt: string;
}

export interface Team {
  id: number;
  name: string;
  english_name: string;
  logo: string;
  team_code: string;
  website: string;
  instagram_url: string;
  team_info: TeamInfo | null;
  recent_videos: RecentVideo[] | null;
}

export interface Player {
  id: number;
  name: string;
  jersey_number: string;
  position: string;
  games_played: number;
  goals: number;
  assists: number;
  points: number;
  pim: number;
  plus_minus: number;
  team_id: number;
}

export interface TeamStanding {
  rank: number;
  team_id: number;
  games_played: number;
  points: number;
  win_60min: number;
  win_ot: number;
  win_pss: number;
  lose_pss: number;
  lose_ot: number;
  lose_60min: number;
  goals_for: number;
  goals_against: number;
  team?: {
    name: string;
    logo: string;
  };
}

export interface ScheduleGame {
  id: number;
  game_no: number;
  match_at: string;
  home_team_id: number;
  away_team_id: number;
  home_score: number | null;
  away_score: number | null;
  game_status: string;
  highlight_url: string | null;
  venue: string;
  home_team?: { name: string; logo: string };
  away_team?: { name: string; logo: string };
}
