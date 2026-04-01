import { format, type Locale } from "date-fns";

const PLAYOFF_START_DATE = new Date("2026-03-19T00:00:00+09:00");
const PLAYOFF_END_DATE = new Date("2026-04-05T23:59:59+09:00");
const FINAL_START_DATE = new Date("2026-03-28T00:00:00+09:00");
const FINAL_END_DATE = new Date("2026-04-05T23:59:59+09:00");

const getOrdinalSuffix = (day: number) => {
  if (day % 100 >= 11 && day % 100 <= 13) return "th";

  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
};

export const isPlayoffGame = (matchAt: string, seasonPhase?: string | null): boolean => {
  if (seasonPhase === "playoff") {
    return true;
  }

  const matchDate = new Date(matchAt);
  return matchDate >= PLAYOFF_START_DATE && matchDate <= PLAYOFF_END_DATE;
};

export const isFinalSeriesGame = (
  matchAt: string,
  seasonPhase?: string | null,
  sourceGameNo?: number | null,
  homeTeamId?: number | null,
  awayTeamId?: number | null
): boolean => {
  if (!isPlayoffGame(matchAt, seasonPhase)) {
    return false;
  }

  if (sourceGameNo !== null && sourceGameNo !== undefined) {
    return sourceGameNo >= 7 && sourceGameNo <= 11;
  }

  const matchDate = new Date(matchAt);
  const isChampionshipMatchup =
    (homeTeamId === 1 && awayTeamId === 2) || (homeTeamId === 2 && awayTeamId === 1);

  return isChampionshipMatchup && matchDate >= FINAL_START_DATE && matchDate <= FINAL_END_DATE;
};

export const formatMatchDateLabel = (date: Date, language: string, locale: Locale) => {
  const normalizedLanguage = language.toLowerCase();

  if (normalizedLanguage.startsWith("en")) {
    const monthLabel = format(date, "MMM", { locale });
    const day = date.getDate();
    return `${monthLabel} ${day}${getOrdinalSuffix(day)}`;
  }

  if (normalizedLanguage.startsWith("ja")) {
    return `${format(date, "MMM d", { locale })}日`;
  }

  return `${format(date, "MMM d", { locale })}일`;
};

export const formatMatchDateTimeLabel = (date: Date, language: string, locale: Locale) => {
  const timeLabel = format(date, "HH:mm", { locale });
  return `${formatMatchDateLabel(date, language, locale)}, ${timeLabel}`;
};
