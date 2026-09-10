import { createContext, useContext, useState, ReactNode } from 'react';
import { CURRENT_SEASON, AVAILABLE_SEASONS } from '@/constants/season';
import { resolveSupportedSeason } from '@/lib/season-url';

export type Season = (typeof AVAILABLE_SEASONS)[number];

interface SeasonContextType {
  selectedSeason: Season;
  setSelectedSeason: (season: Season) => void;
  availableSeasons: readonly Season[];
}

const SeasonContext = createContext<SeasonContextType>({
  selectedSeason: CURRENT_SEASON,
  setSelectedSeason: () => {},
  availableSeasons: AVAILABLE_SEASONS,
});

export const SeasonProvider = ({ children }: { children: ReactNode }) => {
  const [selectedSeason, setSelectedSeasonState] = useState<Season>(() => {
    const linkedSeason = new URLSearchParams(window.location.search).get('season');
    if (linkedSeason) {
      return resolveSupportedSeason(linkedSeason);
    }

    // Restore from localStorage, but always default to CURRENT_SEASON.
    const stored = localStorage.getItem('selectedSeason');
    return stored && AVAILABLE_SEASONS.includes(stored as Season) ? stored as Season : CURRENT_SEASON;
  });

  const setSelectedSeason = (season: Season) => {
    localStorage.setItem('selectedSeason', season);
    setSelectedSeasonState(season);
  };

  return (
    <SeasonContext.Provider value={{ selectedSeason, setSelectedSeason, availableSeasons: AVAILABLE_SEASONS }}>
      {children}
    </SeasonContext.Provider>
  );
};

export const useSeason = () => useContext(SeasonContext);
