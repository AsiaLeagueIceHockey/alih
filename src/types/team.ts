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
  team_color?: string;
}

export interface DraftInfo {
  year: number;
  round: number;
  pick: number;
  team: string;
}

export interface CareerHistory {
  team: string;
  league: string;
  season: string;
  gp?: number;
  g?: number;
  a?: number;
  pts?: number;
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
  // Goalie specific stats
  save_pct?: number;
  goals_against_average?: number;
  saves?: number;
  shots_against?: number;
  goals_against?: number;
  gkc?: number;
  play_time?: string;
  // URL slug for name-based routing
  slug?: string;
  // Extended profile fields
  photo_url?: string;
  instagram_url?: string;
  birth_date?: string;
  nationality?: string;
  nationality_flag?: string;
  height_cm?: number;
  weight_kg?: number;
  draft_info?: DraftInfo;
  career_history?: CareerHistory[];
  bio_markdown?: string;
  name_ko?: string;
  name_en?: string;
  name_ja?: string;
}

export interface PlayerCard {
  id: number;
  user_id: string;
  player_id: number;
  serial_number: number;
  card_image_url?: string;
  created_at: string;
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
  home_alih_team_id: number;
  away_alih_team_id: number;
  home_alih_team_score: number | null;
  away_alih_team_score: number | null;
  game_status: string;
  highlight_url: string | null;
  match_place: string;
  home_team?: { name: string; logo: string };
  away_team?: { name: string; logo: string };
}
