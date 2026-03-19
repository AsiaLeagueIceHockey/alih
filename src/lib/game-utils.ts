export const isPlayoffGame = (matchAt: string, seasonPhase?: string | null): boolean => {
  if (seasonPhase === 'playoff') {
    return true;
  }

  const matchDate = new Date(matchAt);
  const playoffStartDate = new Date('2026-03-19T00:00:00+09:00');
  const playoffEndDate = new Date('2026-04-05T23:59:59+09:00');
  
  return matchDate >= playoffStartDate && matchDate <= playoffEndDate;
};
