import React, { useState, useEffect, useRef } from 'react';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES, FIGHT_SYSTEM_ABI } from '../contracts';
import { useHybridGameStore } from '../store/web3GameStore';
import '../styles/BattleArena.css';

interface BattleAction {
  actorId: bigint;
  actorType: number;
  action: number; // 0: ATTACK, 1: USE_POTION, 2: ESCAPE
  damage: number;
  healing: number;
  remainingHealth: number;
  isCritical: boolean;
  usedPotionId: bigint;
}

interface BattleResult {
  winnerId: bigint;
  winnerType: number;
  escaped: boolean;
  totalRounds: bigint;
  battleLog: BattleAction[];
}

interface BattleArenaProps {
  battleId: string;
  onBattleComplete?: () => void;
  fighter1Name: string;
  fighter2Name: string;
  fighter1Id: bigint;
  fighter2Id: bigint;
}

const BattleArena: React.FC<BattleArenaProps> = ({
  battleId,
  onBattleComplete,
  fighter1Name,
  fighter2Name,
  fighter1Id,
  fighter2Id
}) => {
  const hybridStore = useHybridGameStore();
  const [currentActionIndex, setCurrentActionIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [battleComplete, setBattleComplete] = useState(false);
  const [fighter1HP, setFighter1HP] = useState(100);
  const [fighter2HP, setFighter2HP] = useState(100);
  const [fighter1MaxHP, setFighter1MaxHP] = useState(100);
  const [fighter2MaxHP, setFighter2MaxHP] = useState(100);
  const [countdown, setCountdown] = useState(3);
  const [showDamage, setShowDamage] = useState<{fighter1?: number, fighter2?: number}>({});
  const [showHealing, setShowHealing] = useState<{fighter1?: number, fighter2?: number}>({});
  
  const actionLogRef = useRef<HTMLDivElement>(null);

  // 获取战斗结果
  const { data: battleResult, isError, isLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.FIGHT_SYSTEM,
    abi: FIGHT_SYSTEM_ABI,
    functionName: 'getBattleResult',
    args: [battleId as `0x${string}`],
  });

  const result = battleResult as BattleResult | undefined;

  // 初始化战斗状态并自动开始
  useEffect(() => {
    if (result?.battleLog && result.battleLog.length > 0 && !isPlaying && !battleComplete) {
      // 从第一个行动中获取初始血量
      const firstActions = result.battleLog.filter((_, index) => index < 2);
      firstActions.forEach((action) => {
        if (action.actorId === fighter1Id) {
          setFighter1HP(action.remainingHealth);
          setFighter1MaxHP(action.remainingHealth);
        } else if (action.actorId === fighter2Id) {
          setFighter2HP(action.remainingHealth);
          setFighter2MaxHP(action.remainingHealth);
        }
      });
      
      // 自动开始战斗
      setTimeout(() => {
        startBattle();
      }, 1000);
    }
  }, [result, fighter1Id, fighter2Id]);

  // 开始播放战斗
  const startBattle = () => {
    if (!result?.battleLog || result.battleLog.length === 0) return;
    
    setIsPlaying(true);
    setCurrentActionIndex(0);
    setBattleComplete(false);
    
    // 重置血量到初始状态
    const firstActions = result.battleLog.filter((_, index) => index < 2);
    firstActions.forEach((action) => {
      if (action.actorId === fighter1Id) {
        setFighter1HP(action.remainingHealth);
        setFighter1MaxHP(action.remainingHealth);
      } else if (action.actorId === fighter2Id) {
        setFighter2HP(action.remainingHealth);
        setFighter2MaxHP(action.remainingHealth);
      }
    });
  };

  // 自动滚动到最新动作
  useEffect(() => {
    if (actionLogRef.current) {
      actionLogRef.current.scrollTop = actionLogRef.current.scrollHeight;
    }
  }, [currentActionIndex]);

  // 播放战斗动作
  useEffect(() => {
    if (!isPlaying || !result?.battleLog || currentActionIndex >= result.battleLog.length) {
      if (isPlaying && currentActionIndex >= (result?.battleLog?.length || 0)) {
        setIsPlaying(false);
        setBattleComplete(true);
        onBattleComplete?.();
      }
      return;
    }

    // 倒计时逻辑
    setCountdown(3);
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const timer = setTimeout(() => {
      const action = result.battleLog[currentActionIndex];
      const prevFighter1HP = fighter1HP;
      const prevFighter2HP = fighter2HP;
      
      // 更新血量并显示动画
      if (action.actorId === fighter1Id) {
        setFighter1HP(action.remainingHealth);
        if (action.healing > 0) {
          setShowHealing({fighter1: action.healing});
          setTimeout(() => setShowHealing({}), 2000);
        }
      } else if (action.actorId === fighter2Id) {
        setFighter2HP(action.remainingHealth);
        if (action.healing > 0) {
          setShowHealing({fighter2: action.healing});
          setTimeout(() => setShowHealing({}), 2000);
        }
      }

      // 显示伤害动画
      if (action.damage > 0) {
        if (action.actorId === fighter1Id) {
          // 玩家攻击怪物
          setShowDamage({fighter2: action.damage});
        } else {
          // 怪物攻击玩家
          setShowDamage({fighter1: action.damage});
        }
        setTimeout(() => setShowDamage({}), 2000);
      }

      setCurrentActionIndex(prev => prev + 1);
      clearInterval(countdownInterval);
    }, 3000); // 3秒间隔

    return () => {
      clearTimeout(timer);
      clearInterval(countdownInterval);
    };
  }, [isPlaying, currentActionIndex, result, fighter1Id, fighter2Id, onBattleComplete, fighter1HP, fighter2HP]);

  const getActionText = (action: BattleAction): string => {
    const actorName = action.actorId === fighter1Id ? fighter1Name : fighter2Name;
    
    switch (action.action) {
      case 0: // ATTACK
        return action.isCritical 
          ? `${actorName} 发动暴击攻击，造成 ${action.damage} 点伤害！`
          : `${actorName} 攻击，造成 ${action.damage} 点伤害`;
      case 1: // USE_POTION
        return `${actorName} 使用血瓶，恢复 ${action.healing} 点血量`;
      case 2: // ESCAPE
        return `${actorName} 逃跑了！`;
      default:
        return `${actorName} 执行了未知动作`;
    }
  };

  const getBattleResultText = (): string => {
    if (!result) return '';
    
    if (result.escaped) {
      return '战斗以逃跑结束';
    }
    
    const winnerName = result.winnerId === fighter1Id ? fighter1Name : fighter2Name;
    return `${winnerName} 获得胜利！`;
  };

  if (isLoading) {
    return (
      <div className="battle-arena loading">
        <div className="loading-text">加载战斗数据中...</div>
      </div>
    );
  }

  if (isError || !result) {
    return (
      <div className="battle-arena error">
        <div className="error-text">战斗数据加载失败</div>
      </div>
    );
  }

  return (
    <div className="battle-arena">
      <div className="battle-header">
        <h2>战斗竞技场</h2>
        <div className="battle-id">战斗ID: {battleId.slice(0, 10)}...</div>
      </div>

      <div className="fighters-container">
        <div className="fighter fighter-1">
          <div className="fighter-name">{fighter1Name}</div>
          <div className="fighter-avatar">
            <div className="hp-indicator">
              <div className="health-bar">
                <div 
                  className="health-fill" 
                  style={{ width: `${(fighter1HP / fighter1MaxHP) * 100}%` }}
                />
                <div className="health-text">{fighter1HP}/{fighter1MaxHP}</div>
              </div>
            </div>
            {showDamage.fighter1 && (
              <div className="damage-animation">-{showDamage.fighter1}</div>
            )}
            {showHealing.fighter1 && (
              <div className="healing-animation">+{showHealing.fighter1}</div>
            )}
          </div>
        </div>

        <div className="battle-center">
          <div className="vs-indicator">VS</div>
          {isPlaying && (
            <div className="countdown-container">
              <div className="countdown-text">下回合倒计时</div>
              <div className="countdown-progress">
                <div 
                  className="countdown-fill" 
                  style={{ width: `${((3 - countdown) / 3) * 100}%` }}
                />
              </div>
              <div className="countdown-number">{countdown}</div>
            </div>
          )}
        </div>

        <div className="fighter fighter-2">
          <div className="fighter-name">{fighter2Name}</div>
          <div className="fighter-avatar">
            <div className="hp-indicator">
              <div className="health-bar">
                <div 
                  className="health-fill" 
                  style={{ width: `${(fighter2HP / fighter2MaxHP) * 100}%` }}
                />
                <div className="health-text">{fighter2HP}/{fighter2MaxHP}</div>
              </div>
            </div>
            {showDamage.fighter2 && (
              <div className="damage-animation">-{showDamage.fighter2}</div>
            )}
            {showHealing.fighter2 && (
              <div className="healing-animation">+{showHealing.fighter2}</div>
            )}
          </div>
        </div>
      </div>

      <div className="battle-actions">
        <div className="action-log" ref={actionLogRef}>
          {result.battleLog.slice(0, currentActionIndex).map((action, index) => (
            <div 
              key={index} 
              className={`action-item ${action.isCritical ? 'critical' : ''} ${
                action.action === 2 ? 'escape' : ''
              } ${index === currentActionIndex - 1 ? 'latest' : ''}`}
            >
              <span className="round-number">第{index + 1}回合: </span>
              {getActionText(action)}
            </div>
          ))}
        </div>
      </div>

      <div className="battle-controls">
        {isPlaying && (
          <div className="battle-playing">
            <div className="playing-indicator">战斗进行中...</div>
            <div className="progress-text">
              第 {currentActionIndex} / {result.battleLog.length} 回合
            </div>
          </div>
        )}
        
        {battleComplete && (
          <div className="battle-result">
            <div className="result-header">
              <h3 className={`result-text ${result.winnerId === fighter1Id ? 'victory' : 'defeat'}`}>
                {getBattleResultText()}
              </h3>
            </div>
            
            <div className="battle-stats">
              <div className="stat-item">
                <span className="stat-label">总回合数:</span>
                <span className="stat-value">{Number(result.totalRounds)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">战斗动作:</span>
                <span className="stat-value">{result.battleLog.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">最终血量:</span>
                <span className="stat-value">{fighter1Name}: {fighter1HP}/{fighter1MaxHP}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label"></span>
                <span className="stat-value">{fighter2Name}: {fighter2HP}/{fighter2MaxHP}</span>
              </div>
            </div>

            {result.winnerId === fighter1Id && !result.escaped && (
              <div className="battle-rewards">
                <h4>战斗奖励</h4>
                <div className="rewards-list">
                  <div className="reward-item">
                    <span className="reward-icon">⭐</span>
                    <span className="reward-text">经验值 +{Math.floor(Math.random() * 50) + 20}</span>
                  </div>
                  <div className="reward-item">
                    <span className="reward-icon">📦</span>
                    <span className="reward-text">获得战斗宝箱</span>
                  </div>
                  {Math.random() > 0.7 && (
                    <div className="reward-item rare">
                      <span className="reward-icon">⚔️</span>
                      <span className="reward-text">发现稀有装备！</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="battle-actions-summary">
              <button 
                className="continue-btn"
                onClick={onBattleComplete}
              >
                继续冒险
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BattleArena;