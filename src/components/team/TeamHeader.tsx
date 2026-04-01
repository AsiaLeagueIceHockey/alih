import { Instagram, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Team } from "@/types/team";
import { useTranslation } from "react-i18next";

interface TeamHeaderProps {
  team: Team;
  rank?: number;
}

const TeamHeader = ({ team, rank }: TeamHeaderProps) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-4 py-4 px-4">
      {/* 팀 로고 */}
      <img
        src={team.logo}
        alt={team.name}
        className="w-20 h-20 md:w-24 md:h-24 object-contain flex-shrink-0"
        loading="lazy"
      />

      {/* 팀 정보 */}
      <div className="flex-1 min-w-0">
        <h1 className="text-xl md:text-2xl font-bold">{team.name}</h1>
        <p className="text-sm text-muted-foreground mb-2">{team.english_name}</p>
        
        {/* 순위 뱃지 */}
        {rank && (
          <Badge variant="secondary" className="text-xs px-3 py-0.5">
            {t('team.currentRank', { rank })}
          </Badge>
        )}
      </div>

      {/* 소셜 링크 */}
      <div className="flex gap-2 flex-shrink-0">
        {team.instagram_url && (
          <a
            href={team.instagram_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full bg-secondary/50 hover:bg-secondary transition-colors"
            aria-label="Instagram"
          >
            <Instagram className="h-5 w-5 text-pink-500" />
          </a>
        )}
        {team.website && (
          <a
            href={team.website}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full bg-secondary/50 hover:bg-secondary transition-colors"
            aria-label={t('team.officialWebsite')}
          >
            <Globe className="h-5 w-5 text-primary" />
          </a>
        )}
      </div>
    </div>
  );
};

export default TeamHeader;
