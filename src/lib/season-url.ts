import { AVAILABLE_SEASONS, CURRENT_SEASON } from '@/constants/season';

export type Season = (typeof AVAILABLE_SEASONS)[number];

export const resolveSupportedSeason = (value: string | null | undefined): Season =>
  value && AVAILABLE_SEASONS.includes(value as Season) ? value as Season : CURRENT_SEASON;

export const schedulePath = (gameNo: number | string, season: string, language?: string) => {
  const params = new URLSearchParams({ season: resolveSupportedSeason(season) });
  if (language) params.set('lang', language);
  return `/schedule/${gameNo}?${params.toString()}`;
};
