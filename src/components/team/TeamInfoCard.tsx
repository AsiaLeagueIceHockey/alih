import { useState } from "react";
import { MapPin, Home, Calendar, Trophy, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TeamInfo } from "@/types/team";
import { useTranslation } from "react-i18next";

interface TeamInfoCardProps {
  teamInfo: TeamInfo;
}

const TeamInfoCard = ({ teamInfo }: TeamInfoCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useTranslation();

  return (
    <section className="mb-6">
      <h2 className="text-lg font-bold mb-4 px-1">{t('team.teamInfo')}</h2>
      
      <Card className="p-4 space-y-4">
        {/* 연고지 */}
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-muted-foreground">{t('team.info.hometown')}</p>
            <p className="font-medium">{teamInfo.hometown}</p>
          </div>
        </div>

        {/* 홈구장 */}
        <div className="flex items-start gap-3">
          <Home className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-muted-foreground">{t('team.info.homeStadium')}</p>
            <a
              href={teamInfo.home_stadium.link}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium inline-flex items-center gap-1 hover:text-primary transition-colors"
            >
              {teamInfo.home_stadium.name}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* 창단 */}
        <div className="flex items-start gap-3">
          <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-muted-foreground">{t('team.info.founded')}</p>
            <p className="font-medium">{teamInfo.founding_year}{t('team.info.year')}</p>
          </div>
        </div>

        {/* 우승 기록 */}
        {teamInfo.championship_history?.alih_wins?.length > 0 && (
          <div className="flex items-start gap-3">
            <Trophy className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">{t('team.info.alihChampionship')}</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {teamInfo.championship_history.alih_wins.map((year) => (
                  <Badge key={year} variant="secondary" className="text-xs">
                    {year}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 소개 */}
        {teamInfo.history_summary && (
          <div className="pt-2 border-t border-border">
            <p className="text-sm text-muted-foreground mb-2">{t('team.info.intro')}</p>
            <p 
              className={`text-sm leading-relaxed whitespace-pre-line ${!isExpanded ? "line-clamp-3" : ""}`}
            >
              {teamInfo.history_summary}
            </p>
            {teamInfo.history_summary.length > 150 && (
              <Button
                variant="link"
                size="sm"
                className="mt-2 p-0 h-auto"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? t('button.collapse') : t('button.expand')}
              </Button>
            )}
          </div>
        )}
      </Card>
    </section>
  );
};

export default TeamInfoCard;
