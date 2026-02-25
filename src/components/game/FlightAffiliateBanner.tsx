import { Plane, ExternalLink } from "lucide-react";
import { getAffiliateDestination } from "@/constants/affiliate";
import { useTranslation } from "react-i18next";
import { AlihTeam } from "@/hooks/useTeams";

interface FlightAffiliateBannerProps {
  homeTeam: AlihTeam;
}

export const FlightAffiliateBanner = ({ homeTeam }: FlightAffiliateBannerProps) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  const destination = getAffiliateDestination(homeTeam.english_name);

  if (!destination) return null;

  // HL Anyang is Korean team
  const isKoreanHomeTeam = homeTeam.english_name.toUpperCase().includes('HL ANYANG');
  const isJapaneseHomeTeam = !isKoreanHomeTeam;

  // Rules:
  // 1. If language is 'ko' or 'en', only show for Japanese home teams (KR -> JP flights)
  // 2. If language is 'ja', only show for Korean home team (JP -> KR flights)
  const isKoOrEn = currentLang === 'ko' || currentLang === 'en' || currentLang === 'en-US';
  
  let shouldShow = false;
  
  if (isKoOrEn && isJapaneseHomeTeam) {
    shouldShow = true;
  } else if (currentLang === 'ja' && isKoreanHomeTeam) {
    shouldShow = true;
  }

  if (!shouldShow) return null;

  // Localized City Name
  const cityName = currentLang === 'ja' ? destination.cityJa 
                 : currentLang === 'en' || currentLang === 'en-US' ? destination.cityEn 
                 : destination.cityKo;

  // Localized Text
  const title = currentLang === 'ja' ? `直に観に行く！${cityName}行き航空券セール`
              : currentLang === 'en' || currentLang === 'en-US' ? `Watch Live! ${cityName} Flights Deals`
              : `직관하러 가기! ${cityName} 항공권 특가`;
              
  const buttonText = currentLang === 'ja' ? '予約する'
                   : currentLang === 'en' || currentLang === 'en-US' ? 'Book Now'
                   : '예약하기';

  return (
    <a
      href={destination.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-slate-900 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-6 hover:shadow-md transition-shadow cursor-pointer group"
    >
      <div className="flex items-center gap-3 w-full">
        <div className="bg-blue-500 text-white p-2 rounded-full shadow-sm group-hover:scale-110 transition-transform">
          <Plane className="h-4 w-4" />
        </div>
        <div className="flex flex-col flex-1">
          <span className="text-sm font-bold text-blue-900 dark:text-blue-100 flex items-center justify-between gap-1.5 w-full">
            {title}
            <ExternalLink className="h-3.5 w-3.5 text-blue-500/50" />
          </span>
        </div>
      </div>
    </a>
  );
};
