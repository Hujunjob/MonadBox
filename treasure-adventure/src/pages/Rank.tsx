import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRank } from '../hooks/useRank';
import './Rank.css';
import { useHybridGameStore } from '../store/web3GameStore';
import { useToast } from '../components/ToastManager';

interface RankData {
  rankIndex: number;
  playerId: number;
  playerName: string;
}

const Rank: React.FC = () => {
  const { showToast } = useToast();
  const { address } = useAccount();
  const hybridStore = useHybridGameStore();
  const player = hybridStore.player;
  const currentPlayerId = player.id;
  const playerGold = player.gold;
  const { 
    getTopRanks, 
    getPlayerRank, 
    canChallenge, 
    getNextChallengeTime, 
    fight,
    isPending 
  } = useRank();
  
  const [topRanks, setTopRanks] = useState<RankData[]>([]);
  const [playerRank, setPlayerRank] = useState<number>(0);
  const [challengeTarget, setChallengeTarget] = useState<number | null>(null);
  const [canChallengeNow, setCanChallengeNow] = useState<boolean>(true);
  const [nextChallengeTime, setNextChallengeTime] = useState<number>(0);
  const [countdown, setCountdown] = useState<number>(0);
  const [loading, setLoading] = useState(true);
    // 检查金币余额
  const challengeCost = 20; // 200 金币
  // 加载排行榜数据
  const loadRankData = async () => {
    try {
      setLoading(true);
      
      // 获取前20名排行榜
      const ranks = await getTopRanks(20);
      const [rankIndexes, playerIds, playerNames] = ranks;
      const rankData: RankData[] = [];
      
      for (let i = 0; i < rankIndexes.length; i++) {
        rankData.push({
          rankIndex: Number(rankIndexes[i]),
          playerId: Number(playerIds[i]),
          playerName: playerNames[i] || 'Empty'
        });
      }
      
      setTopRanks(rankData);
      
      // 获取当前玩家排名
      if (currentPlayerId) {
        const rank = await getPlayerRank(currentPlayerId);
        setPlayerRank(Number(rank));
        
        // 检查挑战冷却
        const canChal = await canChallenge(currentPlayerId);
        setCanChallengeNow(canChal);
        
        if (!canChal) {
          const nextTime = await getNextChallengeTime(currentPlayerId);
          setNextChallengeTime(Number(nextTime));
        }
      }
    } catch (error) {
      console.error('Error loading rank data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentPlayerId) {
      loadRankData();
    }
  }, [currentPlayerId]);

  // 倒计时更新
  useEffect(() => {
    if (!canChallengeNow && nextChallengeTime > 0) {
      const interval = setInterval(() => {
        const now = Math.floor(Date.now() / 1000);
        const timeLeft = nextChallengeTime - now;
        
        if (timeLeft <= 0) {
          setCanChallengeNow(true);
          setCountdown(0);
          clearInterval(interval);
        } else {
          setCountdown(timeLeft);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [canChallengeNow, nextChallengeTime]);

  // 处理挑战
  const handleChallenge = async (targetRank: number) => {
    if (!canChallengeNow) return;
    

    if (playerGold < challengeCost) {
      showToast('金币不足！挑战需要200Gold', 'error');
      // alert(`金币不足！挑战需要 ${challengeCost} 金币，你当前只有 ${playerGold} 金币。`);
      return;
    }
    
    try {
      setChallengeTarget(targetRank);
      await fight(currentPlayerId, targetRank);
      
      // 挑战完成后重新加载数据
      setTimeout(() => {
        loadRankData();
        setChallengeTarget(null);
      }, 2000);
    } catch (error) {
      console.error('Challenge failed:', error);
      setChallengeTarget(null);
    }
  };

  // 格式化倒计时
  const formatCountdown = (seconds: number): string => {
    if (seconds <= 0) return '';
    return `${seconds}s`;
  };

  // 获取挑战按钮状态
  const getChallengeButtonState = (rankIndex: number, playerId: number) => {
    if (playerId === currentPlayerId) return { disabled: true, text: '我的位置' };
    if (!canChallengeNow) return { disabled: true, text: `冷却中 ${formatCountdown(countdown)}s` };
    if (challengeTarget === rankIndex || isPending) return { disabled: true, text: '挑战中...' };
    if (playerGold < 200) return { disabled: false, text: '金币不足' };
    
    return { disabled: false, text: playerId > 0 ? '挑战' : '占据' };
  };

  if (!address) {
    return (
      <div className="rank-container">
        <div className="rank-header">
          <h1>🏆 Player Rankings</h1>
          <p>Connect your wallet to view rankings</p>
        </div>
      </div>
    );
  }


  return (
    <div className="rank-container">
      <div className="rank-header">
        <h1>🏆 排行榜</h1>
        <div className="rank-info">
          <div className="my-rank">
            我的排名: <span className="rank-number">{playerRank > 0 ? `#${playerRank}` : '未上榜'}</span>
          </div>
          {/* <div className="challenge-cost">
            挑战费用: 200 金币 | 我的金币: {playerGold}
            {!canChallengeNow && <span className="cooldown"> ({formatCountdown(countdown)}s)</span>}
          </div> */}
        </div>
      </div>

      <div className="rank-content">
        <div className="rank-list">
          {loading ? (
            <div className="loading">加载中...</div>
          ) : (
            <div className="rank-table">
              {topRanks.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-text">暂无排名</div>
                  <button
                    className={`challenge-btn ${!canChallengeNow || isPending ? 'disabled' : ''}`}
                    onClick={() => handleChallenge(1)}
                    disabled={!canChallengeNow || isPending}
                  >
                    占据第1名
                  </button>
                </div>
              ) : (
                <>
                  {topRanks.map((rank, index) => (
                    <div key={rank.rankIndex} className={`rank-item ${rank.playerId === currentPlayerId ? 'my-rank' : ''}`}>
                      <div className="rank-left">
                        <div className={`rank-badge ${index < 3 ? `top-${index + 1}` : ''}`}>
                          {index === 0 && '👑'}
                          {index === 1 && '🥈'}
                          {index === 2 && '🥉'}
                          {index >= 3 && `#${rank.rankIndex}`}
                        </div>
                        <div className="player-info">
                          {rank.playerId > 0 ? (
                            <>
                              <div className="player-name">
                                {rank.playerName}
                                {rank.playerId === currentPlayerId && <span className="you-tag">我</span>}
                              </div>
                            </>
                          ) : (
                            <div className="empty-slot">空位</div>
                          )}
                        </div>
                      </div>
                      <button
                        className={`challenge-btn ${getChallengeButtonState(rank.rankIndex, rank.playerId).disabled ? 'disabled' : ''}`}
                        onClick={() => handleChallenge(rank.rankIndex)}
                        disabled={getChallengeButtonState(rank.rankIndex, rank.playerId).disabled}
                      >
                        {getChallengeButtonState(rank.rankIndex, rank.playerId).text}
                      </button>
                    </div>
                  ))}
                  
                  {/* Next available rank */}
                  {topRanks.length > 0 && topRanks[topRanks.length - 1].playerId > 0 && (
                    <div className="rank-item next-rank">
                      <div className="rank-left">
                        <div className="rank-badge">#{topRanks.length + 1}</div>
                        <div className="player-info">
                          <div className="empty-slot">空位</div>
                        </div>
                      </div>
                      <button
                        className={`challenge-btn ${!canChallengeNow || isPending ? 'disabled' : ''}`}
                        onClick={() => handleChallenge(topRanks.length + 1)}
                        disabled={!canChallengeNow || isPending}
                      >
                        占据
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="rank-rules" hidden={true}>
          <div className="rules-simple">
            <div>💰 挑战费用: 200金币 (20%手续费)</div>
            <div>🔄 胜利后与对手交换排名</div>
            <div>⏱️ 挑战冷却: 20秒</div>
            <div>📍 空位必须按顺序占据</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rank;