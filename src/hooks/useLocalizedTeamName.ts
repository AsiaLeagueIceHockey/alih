import { AlihTeam } from "./useTeams";

/**
 * Get the localized team name based on the current language
 * @param team - The team object from Supabase
 * @param language - Current language code ('ko', 'ja', 'en')
 * @returns The team name in the appropriate language
 */
export const getLocalizedTeamName = (
  team: AlihTeam | { name: string; english_name?: string; japanese_name?: string } | null | undefined,
  language: string
): string => {
  if (!team) return "";
  
  switch (language) {
    case "ja":
      // Use Japanese name if available, fallback to English, then Korean
      return (team as { japanese_name?: string }).japanese_name || team.english_name || team.name;
    case "en":
      // Use English name if available, fallback to Korean
      return team.english_name || team.name;
    default:
      // Default to Korean name
      return team.name;
  }
};

/**
 * Get the localized team name with fallback chain
 * Falls back: requested language -> English -> Korean
 */
export const getLocalizedTeamNameWithFallback = (
  team: AlihTeam | { name: string; english_name?: string; japanese_name?: string } | null | undefined,
  language: string
): string => {
  if (!team) return "";
  
  const teamWithJa = team as { japanese_name?: string; english_name?: string; name: string };
  
  switch (language) {
    case "ja":
      return teamWithJa.japanese_name || teamWithJa.english_name || team.name;
    case "en":
      return teamWithJa.english_name || team.name;
    default:
      return team.name;
  }
};
