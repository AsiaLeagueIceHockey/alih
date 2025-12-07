import { useState } from "react";
import { MapPin, Home, Calendar, Trophy, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TeamInfo } from "@/types/team";

interface TeamInfoCardProps {
  teamInfo: TeamInfo;
}

const TeamInfoCard = ({ teamInfo }: TeamInfoCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="mb-6">
      <h2 className="text-lg font-bold mb-4 px-1">팀 정보</h2>
      
      <Card className="p-4 space-y-4">
        {/* 연고지 */}
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-muted-foreground">연고지</p>
            <p className="font-medium">{teamInfo.hometown}</p>
          </div>
        </div>

        {/* 홈구장 */}
        <div className="flex items-start gap-3">
          <Home className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-muted-foreground">홈구장</p>
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
            <p className="text-sm text-muted-foreground">창단</p>
            <p className="font-medium">{teamInfo.founding_year}년</p>
          </div>
        </div>

        {/* 우승 기록 */}
        {teamInfo.championship_history?.alih_wins?.length > 0 && (
          <div className="flex items-start gap-3">
            <Trophy className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">아시아리그 우승</p>
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
            <p className="text-sm text-muted-foreground mb-2">팀 소개</p>
            <p className={`text-sm leading-relaxed ${!isExpanded ? "line-clamp-3" : ""}`}>
              {teamInfo.history_summary}
            </p>
            {teamInfo.history_summary.length > 150 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 px-0 h-auto text-primary"
              >
                {isExpanded ? (
                  <>
                    접기 <ChevronUp className="h-4 w-4 ml-1" />
                  </>
                ) : (
                  <>
                    더보기 <ChevronDown className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </Card>
    </section>
  );
};

export default TeamInfoCard;
