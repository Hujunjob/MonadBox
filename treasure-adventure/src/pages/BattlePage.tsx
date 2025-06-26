import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BattleArena from '../components/BattleArena';
import '../styles/BattlePage.css';

interface FighterStats {
  id: bigint;
  type: number;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  agility: number;
  criticalRate: number;
  criticalDamage: number;
}

interface BattleParams {
  battleId: string;
  type: 'adventure' | 'rank';
  fighter1Name?: string;
  fighter2Name?: string;
  fighter1Id?: string;
  fighter2Id?: string;
  fighter1Stats?: FighterStats;
  fighter2Stats?: FighterStats;
}

const BattlePage: React.FC = () => {
  const { battleId } = useParams<{ battleId: string }>();
  const navigate = useNavigate();
  const [battleParams, setBattleParams] = useState<BattleParams | null>(null);

  useEffect(() => {
    // 从URL参数或localStorage获取战斗参数
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type') as 'adventure' | 'rank';
    const fighter1Name = urlParams.get('fighter1Name') || '';
    const fighter2Name = urlParams.get('fighter2Name') || '';
    const fighter1Id = urlParams.get('fighter1Id') || '';
    const fighter2Id = urlParams.get('fighter2Id') || '';
    
    // 解析fighter stats
    let fighter1Stats: FighterStats | undefined;
    let fighter2Stats: FighterStats | undefined;
    
    try {
      const fighter1StatsStr = urlParams.get('fighter1Stats');
      if (fighter1StatsStr) {
        fighter1Stats = JSON.parse(fighter1StatsStr);
      }
    } catch (error) {
      console.error('解析fighter1Stats失败:', error);
    }
    
    try {
      const fighter2StatsStr = urlParams.get('fighter2Stats');
      if (fighter2StatsStr) {
        fighter2Stats = JSON.parse(fighter2StatsStr);
      }
    } catch (error) {
      console.error('解析fighter2Stats失败:', error);
    }

    if (battleId && type) {
      setBattleParams({
        battleId,
        type,
        fighter1Name,
        fighter2Name,
        fighter1Id,
        fighter2Id,
        fighter1Stats,
        fighter2Stats
      });
    } else {
      // 如果没有必要参数，重定向回首页
      navigate('/');
    }
  }, [battleId, navigate]);

  const handleBattleComplete = () => {
    // 战斗完成后的处理
    setTimeout(() => {
      if (battleParams?.type === 'adventure') {
        navigate('/monster-forest');
      } else if (battleParams?.type === 'rank') {
        navigate('/rank');
      } else {
        navigate('/');
      }
    }, 300); // 3秒后自动返回
  };

  const handleBackClick = () => {
    if (battleParams?.type === 'adventure') {
      navigate('/monster-forest');
    } else if (battleParams?.type === 'rank') {
      navigate('/rank');
    } else {
      navigate('/');
    }
  };

  if (!battleParams || !battleId) {
    return (
      <div className="battle-page loading">
        <div className="loading-content">
          <div className="spinner"></div>
          <div>加载战斗数据中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="battle-page">
      <div className="battle-header">
        {/* <button className="back-button" onClick={handleBackClick}>
          ← 返回
        </button> */}
        <h1>
          {battleParams.type === 'adventure' ? '冒险战斗' : '排行榜挑战'}
        </h1>
      </div>

      <div className="battle-content">
        <BattleArena
          battleId={battleId}
          onBattleComplete={handleBattleComplete}
          fighter1Name={battleParams.fighter1Name || '玩家'}
          fighter2Name={battleParams.fighter2Name || '对手'}
          fighter1Id={BigInt(battleParams.fighter1Id || '0')}
          fighter2Id={BigInt(battleParams.fighter2Id || '0')}
          fighter1Stats={battleParams.fighter1Stats}
          fighter2Stats={battleParams.fighter2Stats}
        />
      </div>

      <div className="battle-tips">
        <div className="tip-item">
          <strong>战斗规则：</strong>
          <ul>
            <li>每回合间隔3秒</li>
            <li>血量低于30%时自动使用血瓶</li>
            <li>没有血瓶且血量低于30%时可能逃跑</li>
            <li>敏捷度高的战斗者优先行动</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BattlePage;