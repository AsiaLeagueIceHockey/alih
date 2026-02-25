export interface AffiliateDestination {
  cityKo: string;
  cityEn: string;
  cityJa: string;
  url: string;
}

export const AFFILIATE_LINKS: Record<string, AffiliateDestination> = {
  // 삿포로
  'EAGLES': {
    cityKo: '삿포로',
    cityEn: 'Sapporo',
    cityJa: '札幌',
    url: 'https://www.trip.com/t/ZzuYNcmseT2'
  },
  // 도쿄
  'FREEBLADES': {
    cityKo: '도쿄',
    cityEn: 'Tokyo',
    cityJa: '東京',
    url: 'https://www.trip.com/t/fUGEnOmseT2'
  },
  'GRITS': {
    cityKo: '도쿄',
    cityEn: 'Tokyo',
    cityJa: '東京',
    url: 'https://www.trip.com/t/fUGEnOmseT2'
  },
  'ICEBUCKS': {
    cityKo: '도쿄',
    cityEn: 'Tokyo',
    cityJa: '東京',
    url: 'https://www.trip.com/t/fUGEnOmseT2'
  },
  // 고베
  'STARS': {
    cityKo: '고베',
    cityEn: 'Kobe',
    cityJa: '神戸',
    url: 'https://www.trip.com/t/AFVzkWmseT2'
  },
  // 서울
  'HL ANYANG': {
    cityKo: '서울',
    cityEn: 'Seoul',
    cityJa: 'ソウル',
    url: 'https://www.trip.com/t/LmVrgzlseT2'
  }
};

export const getAffiliateDestination = (teamEnglishName: string): AffiliateDestination | null => {
  // Normalize team name to uppercase for mapping
  const normalizedKey = Object.keys(AFFILIATE_LINKS).find(k => 
    teamEnglishName.toUpperCase().includes(k)
  );

  if (normalizedKey) {
    return AFFILIATE_LINKS[normalizedKey];
  }
  return null;
};
