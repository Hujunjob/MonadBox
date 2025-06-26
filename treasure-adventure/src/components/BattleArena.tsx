import React, { useState, useEffect, useRef } from 'react';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES, FIGHT_SYSTEM_ABI } from '../contracts';
import { useHybridGameStore } from '../store/web3GameStore';
import BattleResultModal from './BattleResultModal';
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
  const [showResultModal, setShowResultModal] = useState(false);
  
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
      // 从战斗日志中找到初始血量（第一回合前的血量）
      let fighter1InitialHP = 100;
      let fighter2InitialHP = 100;
      
      // 查找每个战斗者的第一个动作来获取初始血量
      const fighter1FirstAction = result.battleLog.find(action => action.actorId === fighter1Id);
      const fighter2FirstAction = result.battleLog.find(action => action.actorId === fighter2Id);
      
      if (fighter1FirstAction) {
        // 如果第一个动作有治疗，说明这是初始血量；如果有伤害，需要加回去
        fighter1InitialHP = fighter1FirstAction.remainingHealth + (fighter1FirstAction.damage || 0);
      }
      
      if (fighter2FirstAction) {
        fighter2InitialHP = fighter2FirstAction.remainingHealth + (fighter2FirstAction.damage || 0);
      }
      
      console.log('Setting initial HP:', { fighter1InitialHP, fighter2InitialHP });
      
      setFighter1HP(fighter1InitialHP);
      setFighter1MaxHP(fighter1InitialHP);
      setFighter2HP(fighter2InitialHP);
      setFighter2MaxHP(fighter2InitialHP);
      
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
        // 显示结果弹框而不是立即调用回调
        setTimeout(() => {
          setShowResultModal(true);
        }, 1000);
      }
      return;
    }

    console.log('Starting action', currentActionIndex);
    
    // 重置倒计时
    setCountdown(3);
    
    // 倒计时逻辑
    let currentCount = 3;
    const countdownInterval = setInterval(() => {
      currentCount--;
      setCountdown(currentCount);
      
      if (currentCount <= 0) {
        clearInterval(countdownInterval);
      }
    }, 1000);

    const timer = setTimeout(() => {
      const action = result.battleLog[currentActionIndex];
      console.log('Executing action:', action);
      
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
    }, 3000); // 3秒间隔

    return () => {
      clearTimeout(timer);
      clearInterval(countdownInterval);
    };
  }, [isPlaying, currentActionIndex, result, fighter1Id, fighter2Id, onBattleComplete]);

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
        
        {battleComplete && !showResultModal && (
          <div className="battle-complete-waiting">
            <div className="completion-text">战斗结束，正在计算结果...</div>
          </div>
        )}
      </div>
      
      <BattleResultModal
        isOpen={showResultModal}
        onClose={() => {
          setShowResultModal(false);
          onBattleComplete?.();
          // // 立即调用回调关闭战斗页面
          // setTimeout(() => {
           
          // }, 100);
        }}
        isVictory={result ? result.winnerId === fighter1Id && !result.escaped : false}
        escaped={result ? result.escaped : false}
        battleStats={{
          totalRounds: result ? Number(result.totalRounds) : 0,
          totalActions: result ? result.battleLog.length : 0,
          fighter1Name,
          fighter2Name,
          fighter1FinalHP: fighter1HP,
          fighter1MaxHP,
          fighter2FinalHP: fighter2HP,
          fighter2MaxHP
        }}
        rewards={result && result.winnerId === fighter1Id && !result.escaped ? {
          experience: Math.floor(Math.random() * 50) + 20,
          hasBox: true,
          hasRareItem: Math.random() > 0.7,
          rareItemName: Math.random() > 0.7 ? '传说武器' : undefined
        } : undefined}
      />
    </div>
  );
};

export default BattleArena;