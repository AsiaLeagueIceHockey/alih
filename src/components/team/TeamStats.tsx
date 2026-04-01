import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Home, Car, TrendingUp, TrendingDown, Zap, Target } from "lucide-react";
import { useTranslation } from "react-i18next";

interface AdvancedStats {
  ppGoals: number;
  shGoals?: number;
  totalGoals: number;
  ppRate: number;
  periodGoals: { p1: number; p2: number; p3: number; ot: number };
}

interface TeamStatsProps {
  homeRecord: { wins: number; losses: number };
  awayRecord: { wins: number; losses: number };
  recentForm: ('W' | 'L')[];
  avgGoalsFor: number;
  avgGoalsAgainst: number;
  gamesPlayed: number;
  advancedStats?: AdvancedStats;
}

const TeamStats = ({
  homeRecord,
  awayRecord,
  recentForm,
  avgGoalsFor,
  avgGoalsAgainst,
  gamesPlayed,
  advancedStats,
}: TeamStatsProps) => {
  const { t } = useTranslation();
  const homeTotal = homeRecord.wins + homeRecord.losses;
  const awayTotal = awayRecord.wins + awayRecord.losses;
  const homeWinRate = homeTotal > 0 ? Math.round((homeRecord.wins / homeTotal) * 100) : 0;
  const awayWinRate = awayTotal > 0 ? Math.round((awayRecord.wins / awayTotal) * 100) : 0;
  const goalDiff = avgGoalsFor - avgGoalsAgainst;

  // 피리어드별 득점 분포 계산
  const periodMax = advancedStats 
    ? Math.max(advancedStats.periodGoals.p1, advancedStats.periodGoals.p2, advancedStats.periodGoals.p3, advancedStats.periodGoals.ot, 1)
    : 1;

  // 피리어드 데이터 (시맨틱 색상 사용)
  const periodData = advancedStats ? [
    { label: '1P', value: advancedStats.periodGoals.p1, colorClass: 'bg-period-1' },
    { label: '2P', value: advancedStats.periodGoals.p2, colorClass: 'bg-period-2' },
    { label: '3P', value: advancedStats.periodGoals.p3, colorClass: 'bg-period-3' },
    ...(advancedStats.periodGoals.ot > 0 
      ? [{ label: 'OT', value: advancedStats.periodGoals.ot, colorClass: 'bg-period-ot' }]
      : []
    ),
  ] : [];

  return (
    <section className="mb-6">
      <h2 className="text-lg font-bold mb-4 px-1 flex items-center gap-2">
        {t('section.seasonStats')}
      </h2>
      
      <Card className="p-4 space-y-6">
        {/* 홈/원정 성적 */}
        <div className="grid grid-cols-2 gap-4">
          {/* 홈 성적 */}
          <div className="bg-secondary/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Home className="h-4 w-4 text-success" />
              <span className="text-sm text-muted-foreground">{t('stats.homeRecord')}</span>
            </div>
            <div className="text-2xl font-bold">
              {homeRecord.wins}{t('stats.win')} {homeRecord.losses}{t('stats.loss')}
            </div>
            <div className="text-sm text-muted-foreground">
              {t('stats.winRate')} {homeWinRate}%
            </div>
          </div>

          {/* 원정 성적 */}
          <div className="bg-secondary/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Car className="h-4 w-4 text-info" />
              <span className="text-sm text-muted-foreground">{t('stats.awayRecord')}</span>
            </div>
            <div className="text-2xl font-bold">
              {awayRecord.wins}{t('stats.win')} {awayRecord.losses}{t('stats.loss')}
            </div>
            <div className="text-sm text-muted-foreground">
              {t('stats.winRate')} {awayWinRate}%
            </div>
          </div>
        </div>

        {/* 최근 5경기 폼 */}
        {recentForm.length > 0 && (
          <div>
            <div className="text-sm text-muted-foreground mb-3">{t('stats.recentGames', { count: recentForm.length })}</div>
            <div className="flex gap-2 justify-center">
              {recentForm.map((result, index) => (
                <div
                  key={index}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    result === 'W'
                      ? 'bg-success'
                      : 'bg-destructive'
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
            <div className="text-sm text-muted-foreground mb-1">{t('stats.avgGoalsFor')}</div>
            <div className="text-xl font-bold text-success flex items-center justify-center gap-1">
              <TrendingUp className="h-4 w-4" />
              {avgGoalsFor.toFixed(1)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">{t('stats.avgGoalsAgainst')}</div>
            <div className="text-xl font-bold text-destructive flex items-center justify-center gap-1">
              <TrendingDown className="h-4 w-4" />
              {avgGoalsAgainst.toFixed(1)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">{t('stats.avgGoalDiff')}</div>
            <div className={`text-xl font-bold ${goalDiff >= 0 ? 'text-success' : 'text-destructive'}`}>
              {goalDiff >= 0 ? '+' : ''}{goalDiff.toFixed(1)}
            </div>
          </div>
        </div>

        {/* 고급 통계 - 파워플레이/숏핸디드 & 피리어드별 득점 */}
        {advancedStats && advancedStats.totalGoals > 0 && (
          <>
            {/* 특수 상황 득점 */}
            <div className="pt-4 border-t border-border">
              <div className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-powerplay" />
                {t('stats.specialSituation')}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-powerplay/10 rounded-lg p-3 text-center">
                  <div className="text-xs text-muted-foreground mb-1">{t('stats.powerPlayGoal')}</div>
                  <div className="text-2xl font-bold text-powerplay">{advancedStats.ppGoals}</div>
                  <div className="text-xs text-muted-foreground">
                    {t('stats.powerPlayRate', { totalGoals: advancedStats.totalGoals, ppRate: advancedStats.ppRate.toFixed(1) })}
                  </div>
                </div>
                <div className="bg-shorthanded/10 rounded-lg p-3 text-center">
                  <div className="text-xs text-muted-foreground mb-1">{t('stats.shortHandedGoal')}</div>
                  <div className="text-2xl font-bold text-shorthanded">{advancedStats.shGoals || 0}</div>
                  <div className="text-xs text-muted-foreground">
                    {t('stats.shortHandedDesc')}
                  </div>
                </div>
              </div>
            </div>

            {/* 피리어드별 득점 분포 */}
            <div className="pt-4 border-t border-border">
              <div className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                {t('stats.periodGoals')}
              </div>
              <div className="space-y-3">
                {periodData.map((period) => (
                  <div key={period.label} className="flex items-center gap-3">
                    <span className="w-8 text-sm font-medium text-muted-foreground">{period.label}</span>
                    <div className="flex-1 h-6 bg-secondary/50 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${period.colorClass} rounded-full transition-all duration-500`}
                        style={{ width: `${(period.value / periodMax) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 text-sm font-bold text-right">{period.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* 총 경기 수 */}
        <div className="text-center text-xs text-muted-foreground">
          {t('stats.totalGames', { count: gamesPlayed })}
        </div>
      </Card>
    </section>
  );
};

export default TeamStats;
