import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getLocalizedTeamName } from '@/hooks/useLocalizedTeamName';
import { usePrediction, PredictionType } from '@/hooks/usePrediction';
import LoginDialog from '@/components/auth/LoginDialog';

interface MatchPredictionProps {
  scheduleId: number;
  homeTeam: {
    id: number;
    name: string;
    english_name?: string;
    japanese_name?: string;
    logo: string;
  };
  awayTeam: {
    id: number;
    name: string;
    english_name?: string;
    japanese_name?: string;
    logo: string;
  };
  disabled?: boolean; // 게임 전 외 비활성화
}

const MatchPrediction = ({ scheduleId, homeTeam, awayTeam, disabled = false }: MatchPredictionProps) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const {
    counts,
    currentPrediction,
    isLoading,
    submitPrediction,
    isSubmitting,
    showLoginModal,
    setShowLoginModal,
  } = usePrediction(scheduleId);

  const [hoveredOption, setHoveredOption] = useState<PredictionType | null>(null);

  const hasVoted = !!currentPrediction;

  const options: { key: PredictionType; label: string; team: typeof homeTeam }[] = [
    { key: 'home_reg', label: t('prediction.regWin'), team: homeTeam },
    { key: 'home_ot', label: t('prediction.otWin'), team: homeTeam },
    { key: 'away_ot', label: t('prediction.otWin'), team: awayTeam },
    { key: 'away_reg', label: t('prediction.regWin'), team: awayTeam },
  ];

  const getPercentage = (key: PredictionType) => {
    if (counts.total === 0) return 0;
    return Math.round((counts[key] / counts.total) * 100);
  };

  const handleClick = (key: PredictionType) => {
    if (disabled || isSubmitting) return;
    submitPrediction(key);
  };

  return (
    <>
      <Card className="p-4 mb-6">
        <h3 className="font-semibold mb-4 text-center flex items-center justify-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          {t('prediction.title')}
          <Target className="h-4 w-4 text-primary" />
        </h3>

        {/* 팀 로고 + 이름 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <img src={homeTeam.logo} alt={getLocalizedTeamName(homeTeam, currentLang)} className="w-6 h-6 object-contain" />
            <span className="text-xs font-medium">{getLocalizedTeamName(homeTeam, currentLang)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">{getLocalizedTeamName(awayTeam, currentLang)}</span>
            <img src={awayTeam.logo} alt={getLocalizedTeamName(awayTeam, currentLang)} className="w-6 h-6 object-contain" />
          </div>
        </div>

        {/* 4개 예측 버튼 */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {options.map((option) => {
            const isSelected = currentPrediction === option.key;
            const percentage = getPercentage(option.key);
            const isHomeOption = option.key.startsWith('home');

            return (
              <button
                key={option.key}
                disabled={disabled || isSubmitting || isLoading}
                onClick={() => handleClick(option.key)}
                onMouseEnter={() => setHoveredOption(option.key)}
                onMouseLeave={() => setHoveredOption(null)}
                className={`
                  relative overflow-hidden rounded-lg border-2 transition-all duration-200
                  ${disabled ? 'cursor-default' : 'cursor-pointer active:scale-95'}
                  ${isSelected
                    ? isHomeOption
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                      : 'border-destructive bg-destructive/10 ring-2 ring-destructive/30'
                    : 'border-border hover:border-primary/50'
                  }
                  ${!disabled && !hasVoted && hoveredOption === option.key
                    ? isHomeOption
                      ? 'bg-primary/5 border-primary/40'
                      : 'bg-destructive/5 border-destructive/40'
                    : ''
                  }
                  p-3 flex flex-col items-center gap-1
                `}
              >
                {/* 투표 결과 배경 바 */}
                {hasVoted && counts.total > 0 && (
                  <div
                    className={`absolute bottom-0 left-0 right-0 transition-all duration-500 ease-out ${
                      isHomeOption ? 'bg-primary/15' : 'bg-destructive/15'
                    }`}
                    style={{ height: `${percentage}%` }}
                  />
                )}

                <span className="relative text-xs font-medium text-muted-foreground z-10">
                  {option.label}
                </span>

                {hasVoted && (
                  <span className={`relative text-sm font-bold z-10 ${
                    isSelected
                      ? isHomeOption ? 'text-primary' : 'text-destructive'
                      : 'text-muted-foreground'
                  }`}>
                    {percentage}%
                  </span>
                )}

                {isSelected && (
                  <span className="relative text-xs z-10">✓</span>
                )}
              </button>
            );
          })}
        </div>

        {/* 하단 설명 */}
        <p className="text-xs text-muted-foreground text-center">
          {disabled
            ? t('prediction.closed')
            : hasVoted
              ? `${t('prediction.voted')} · ${t('prediction.totalVotes', { count: counts.total })}`
              : t('prediction.description')
          }
        </p>
      </Card>

      {/* 로그인 모달 (Lazy Registration) */}
      <LoginDialog
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
      />
    </>
  );
};

export default MatchPrediction;
