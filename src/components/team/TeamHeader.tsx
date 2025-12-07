import { Instagram, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Team } from "@/types/team";

interface TeamHeaderProps {
  team: Team;
  rank?: number;
}

const TeamHeader = ({ team, rank }: TeamHeaderProps) => {
  return (
    <div className="flex flex-col items-center text-center py-8 px-4">
      {/* 소셜 링크 - 우측 상단 */}
      <div className="absolute right-4 top-4 flex gap-3">
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
            aria-label="공식 홈페이지"
          >
            <Globe className="h-5 w-5 text-primary" />
          </a>
        )}
      </div>

      {/* 팀 로고 */}
      <img
        src={team.logo}
        alt={team.name}
        className="w-28 h-28 md:w-36 md:h-36 object-contain mb-4"
        loading="lazy"
      />

      {/* 팀명 */}
      <h1 className="text-2xl md:text-3xl font-bold mb-2">{team.name}</h1>
      <p className="text-muted-foreground mb-3">{team.english_name}</p>

      {/* 순위 뱃지 */}
      {rank && (
        <Badge variant="secondary" className="text-sm px-4 py-1">
          현재 순위: {rank}위
        </Badge>
      )}
    </div>
  );
};

export default TeamHeader;
