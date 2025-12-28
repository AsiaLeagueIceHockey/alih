import { Card } from "@/components/ui/card";
import { Home, Car, TrendingUp, TrendingDown } from "lucide-react";

interface TeamStatsProps {
  homeRecord: { wins: number; losses: number };
  awayRecord: { wins: number; losses: number };
  recentForm: ('W' | 'L')[];
  avgGoalsFor: number;
  avgGoalsAgainst: number;
  gamesPlayed: number;
}

const TeamStats = ({
  homeRecord,
  awayRecord,
  recentForm,
  avgGoalsFor,
  avgGoalsAgainst,
  gamesPlayed,
}: TeamStatsProps) => {
  const homeTotal = homeRecord.wins + homeRecord.losses;
  const awayTotal = awayRecord.wins + awayRecord.losses;
  const homeWinRate = homeTotal > 0 ? Math.round((homeRecord.wins / homeTotal) * 100) : 0;
  const awayWinRate = awayTotal > 0 ? Math.round((awayRecord.wins / awayTotal) * 100) : 0;
  const goalDiff = avgGoalsFor - avgGoalsAgainst;

  return (
    <section className="mb-6">
      <h2 className="text-lg font-bold mb-4 px-1 flex items-center gap-2">
        시즌 통계
      </h2>
      
      <Card className="p-4 space-y-6">
        {/* 홈/원정 성적 */}
        <div className="grid grid-cols-2 gap-4">
          {/* 홈 성적 */}
          <div className="bg-secondary/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Home className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">홈 성적</span>
            </div>
            <div className="text-2xl font-bold">
              {homeRecord.wins}승 {homeRecord.losses}패
            </div>
            <div className="text-sm text-muted-foreground">
              승률 {homeWinRate}%
            </div>
          </div>

          {/* 원정 성적 */}
          <div className="bg-secondary/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Car className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">원정 성적</span>
            </div>
            <div className="text-2xl font-bold">
              {awayRecord.wins}승 {awayRecord.losses}패
            </div>
            <div className="text-sm text-muted-foreground">
              승률 {awayWinRate}%
            </div>
          </div>
        </div>

        {/* 최근 5경기 폼 */}
        {recentForm.length > 0 && (
          <div>
            <div className="text-sm text-muted-foreground mb-3">최근 {recentForm.length}경기</div>
            <div className="flex gap-2 justify-center">
              {recentForm.map((result, index) => (
                <div
                  key={index}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    result === 'W'
                      ? 'bg-green-500'
                      : 'bg-red-500'
                  }`}
                >
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 경기당 평균 */}
        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">평균 득점</div>
            <div className="text-xl font-bold text-green-500 flex items-center justify-center gap-1">
              <TrendingUp className="h-4 w-4" />
              {avgGoalsFor.toFixed(1)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">평균 실점</div>
            <div className="text-xl font-bold text-red-500 flex items-center justify-center gap-1">
              <TrendingDown className="h-4 w-4" />
              {avgGoalsAgainst.toFixed(1)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">득실차</div>
            <div className={`text-xl font-bold ${goalDiff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {goalDiff >= 0 ? '+' : ''}{goalDiff.toFixed(1)}
            </div>
          </div>
        </div>

        {/* 총 경기 수 */}
        <div className="text-center text-xs text-muted-foreground">
          총 {gamesPlayed}경기 기준
        </div>
      </Card>
    </section>
  );
};

export default TeamStats;

