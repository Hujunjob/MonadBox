import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import { useRank } from '../hooks/useRank';
import './Rank.css';
import { useHybridGameStore } from '../store/web3GameStore';
import { useToast } from '../components/ToastManager';
import { getJobLevelDisplay } from '../utils/gameUtils';

interface RankData {
  rankIndex: number;
  playerId: number;
  playerName: string;
  level?: number;
  experience?: number;
  jobTitle?: string;
}

const Rank: React.FC = () => {
  const { showToast } = useToast();
  const { address } = useAccount();
  const navigate = useNavigate();
  const hybridStore = useHybridGameStore();
  const player = hybridStore.player;
  const currentPlayerId = player.id;
  const playerGold = player.gold;

  const { 
    getTopRanks, 
    getPlayerRank, 
    fight,
    getPlayerData,
    isPending 
  } = useRank();
  
  const [topRanks, setTopRanks] = useState<RankData[]>([]);
  const [playerRank, setPlayerRank] = useState<number>(0);
  const [challengeTarget, setChallengeTarget] = useState<number | null>(null);
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
        const playerId = Number(playerIds[i]);
        let jobTitle = '';
        let level = 0;
        let experience = 0;
        
        // 如果有有效的玩家ID，获取玩家数据计算职位
        if (playerId > 0) {
          try {
            const playerData = await getPlayerData(playerId);
            level = Number(playerData.level);
            experience = Number(playerData.experience);
            jobTitle = getJobLevelDisplay(level, experience);
          } catch (error) {
            console.error(`Error fetching player ${playerId} data:`, error);
            jobTitle = '未知职位';
          }
        }
        
        rankData.push({
          rankIndex: Number(rankIndexes[i]),
          playerId: playerId,
          playerName: playerNames[i] || 'Empty',
          level: level,
          experience: experience,
          jobTitle: jobTitle
        });
      }
      
      setTopRanks(rankData);
      
      // 获取当前玩家排名
      if (currentPlayerId) {
        const rank = await getPlayerRank(currentPlayerId);
        setPlayerRank(Number(rank));
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

  // 处理挑战
  const handleChallenge = async (targetRank: number) => {
    if (playerGold < challengeCost) {
      showToast('金币不足！挑战需要200Gold', 'error');
      return;
    }
    
    // 检查不能挑战比自己排名低的玩家
    if (playerRank > 0 && targetRank > playerRank) {
      showToast('不能挑战比自己排名低的玩家！', 'error');
      return;
    }
    
    try {
      setChallengeTarget(targetRank);
      const battleId = await fight(currentPlayerId, targetRank);
      
      if (battleId) {
        // 获取目标玩家信息
        const targetPlayer = topRanks.find(rank => rank.rankIndex === targetRank);
        const targetPlayerName = targetPlayer?.playerName || `排名${targetRank}`;
        
        // 导航到战斗页面
        navigate(`/battle/${battleId}?type=rank&fighter1Name=${encodeURIComponent(player.name)}&fighter2Name=${encodeURIComponent(targetPlayerName)}&fighter1Id=${player.id}&fighter2Id=${targetPlayer?.playerId || 0}`);
      }
      
      setChallengeTarget(null);
    } catch (error) {
      console.error('Challenge failed:', error);
      setChallengeTarget(null);
    }
  };

  // 获取挑战按钮状态
  const getChallengeButtonState = (rankIndex: number, playerId: number) => {
    if (playerId === currentPlayerId) return { disabled: true, text: '我的位置' };
    if (challengeTarget === rankIndex || isPending) return { disabled: true, text: '挑战中...' };
    if (playerGold < 200) return { disabled: true, text: '金币不足' };
    
    // 检查不能挑战比自己排名低的玩家
    if (playerRank > 0 && rankIndex > playerRank && playerId > 0) {
      return { disabled: true, text: '不可挑战' };
    }
    
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
                    className={`challenge-btn ${isPending ? 'disabled' : ''}`}
                    onClick={() => handleChallenge(1)}
                    disabled={isPending}
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
                                <span className="job-separator">|</span>
                                <span className="player-job">{rank.jobTitle || '未知职位'}</span>
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
                        className={`challenge-btn ${isPending ? 'disabled' : ''}`}
                        onClick={() => handleChallenge(topRanks.length + 1)}
                        disabled={isPending}
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
            <div>📍 空位必须按顺序占据</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rank;