import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCheers } from '@/hooks/useCheers';
import { Flame } from 'lucide-react';

interface CheerBattleProps {
  gameNo: number | string;
  homeTeam: {
    id: number;
    name: string;
    logo: string;
  };
  awayTeam: {
    id: number;
    name: string;
    logo: string;
  };
  isLive?: boolean; // 경기 진행 중 여부
}

interface Particle {
  id: number;
  team: 'home' | 'away';
  x: number;
  y: number;
}

const CheerBattle = ({ gameNo, homeTeam, awayTeam, isLive = false }: CheerBattleProps) => {
  const { homeCheers, awayCheers, homePercentage, awayPercentage, addCheer } = useCheers(gameNo);
  const [particles, setParticles] = useState<Particle[]>([]);

  // 파티클 생성
  const createParticle = useCallback((team: 'home' | 'away') => {
    const id = Date.now() + Math.random();
    const x = team === 'home' ? 20 + Math.random() * 30 : 50 + Math.random() * 30;
    const y = 80;

    setParticles(prev => [...prev, { id, team, x, y }]);

    // 1초 후 파티클 제거
    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== id));
    }, 1000);
  }, []);

  // 응원 버튼 클릭
  const handleCheer = useCallback((team: 'home' | 'away') => {
    addCheer(team);
    createParticle(team);
  }, [addCheer, createParticle]);

  // 숫자 포맷 (1000 -> 1K)
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Card className="p-4 mb-6 overflow-hidden relative">
      <h3 className="font-semibold mb-4 text-center flex items-center justify-center gap-2">
        <Flame className="h-4 w-4 text-destructive" />
        {isLive ? '실시간 응원' : '응원하기'}
        <Flame className="h-4 w-4 text-destructive" />
      </h3>

      {/* 파티클 컨테이너 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute animate-float-up"
            style={{
              left: `${particle.x}%`,
              bottom: '20%',
            }}
          >
            <img
              src={particle.team === 'home' ? homeTeam.logo : awayTeam.logo}
              alt=""
              className="w-8 h-8 object-contain opacity-80"
            />
          </div>
        ))}
      </div>

      {/* 게이지 바 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <img src={homeTeam.logo} alt={homeTeam.name} className="w-6 h-6 object-contain" />
            <span className="text-sm font-medium">{homePercentage}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{awayPercentage}%</span>
            <img src={awayTeam.logo} alt={awayTeam.name} className="w-6 h-6 object-contain" />
          </div>
        </div>
        
        <div className="h-4 bg-muted rounded-full overflow-hidden flex">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${homePercentage}%` }}
          />
          <div
            className="h-full bg-destructive transition-all duration-300 ease-out"
            style={{ width: `${awayPercentage}%` }}
          />
        </div>
      </div>

      {/* 응원 버튼 */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          className="h-16 flex flex-col gap-1 border-primary/50 hover:bg-primary/10 hover:border-primary active:scale-95 transition-all"
          onClick={() => handleCheer('home')}
        >
          <span className="text-lg">🔥</span>
          <span className="text-xs text-muted-foreground">{formatNumber(homeCheers)}</span>
        </Button>
        
        <Button
          variant="outline"
          className="h-16 flex flex-col gap-1 border-destructive/50 hover:bg-destructive/10 hover:border-destructive active:scale-95 transition-all"
          onClick={() => handleCheer('away')}
        >
          <span className="text-lg">🔥</span>
          <span className="text-xs text-muted-foreground">{formatNumber(awayCheers)}</span>
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-3">
        버튼을 눌러 응원하세요! 실시간으로 반영됩니다.
      </p>
    </Card>
  );
};

export default CheerBattle;
