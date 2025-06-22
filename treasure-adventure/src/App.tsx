import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useGameStore } from './store/gameStore';
import PlayerStats from './components/PlayerStats';
import TreasureBox from './components/TreasureBox';
import MonsterForest from './components/MonsterForest';
import Battle from './components/Battle';
import Inventory from './components/Inventory';
import Market from './components/Market';
import Rank from './components/Rank';
import WalletConnect from './components/WalletConnect';
import { ToastProvider } from './components/ToastManager';
import './App.css';
import { useConnectedUsers, useNicknames } from 'react-together'

function App() {
  const [activeTab, setActiveTab] = useState('stats');
  const { currentBattle, updatePlayer, player, updateStamina } = useGameStore();
  const { address, isConnected } = useAccount();
  const connectedUsers = useConnectedUsers()
  const [nickname, setNickname] = useNicknames()
  const [showNamingModal, setShowNamingModal] = useState(false);
  const [userNameInput, setUserNameInput] = useState('');
  const [hasCheckedNickname, setHasCheckedNickname] = useState(false);

  // 处理页面切换，在切换到特定页面时检查体力
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // 切换到角色页面或森林页面时检查体力
    if (tab === 'stats' || tab === 'forest') {
      updateStamina();
    }
  };

  // 从nickname中提取真实用户名
  const extractUsernameFromNickname = (nickname: string): string | null => {
    if (!nickname || !address) return null;
    const expectedPrefix = `${address}&&name=`;
    if (nickname.startsWith(expectedPrefix)) {
      return nickname.substring(expectedPrefix.length);
    }
    return null;
  };

  // 用户名验证规则
  const isValidUsername = (username: string): boolean => {
    // 用户名长度2-20字符，只允许中文、英文、数字、下划线
    return /^[\u4e00-\u9fa5a-zA-Z0-9_]{2,20}$/.test(username);
  };

  // 处理用户名提交
  const handleNicknameSubmit = () => {
    if (!isValidUsername(userNameInput)) {
      alert('用户名格式不正确！用户名长度应为2-20字符，只允许中文、英文、数字、下划线');
      return;
    }
    
    if (address) {
      const formattedNickname = `${address}&&name=${userNameInput}`;
      setNickname(formattedNickname);
      // 立即更新玩家姓名
      updatePlayer({ name: userNameInput });
      setShowNamingModal(false);
      setUserNameInput('');
      setHasCheckedNickname(true);
    }
  };

  useEffect(()=>{
    // 如果正在显示命名弹窗，跳过检查避免频繁触发
    if (showNamingModal) return;
    
    connectedUsers.forEach((value)=>{
      // console.log(value);
      
      if(value.isYou && isConnected && address && value.nickname){
        //nickname格式：evm钱包地址+"&&name="+用户昵称
        const expectedPrefix = `${address}&&name=`;
        if(!value.nickname.startsWith(expectedPrefix)){
          // 未设置用户名或格式不正确，弹出命名框
          if (!hasCheckedNickname) {
            setShowNamingModal(true);
            setHasCheckedNickname(true);
          }
        } else {
          // 有有效的nickname，提取用户名并更新玩家姓名
          const realUsername = extractUsernameFromNickname(value.nickname);
          if (realUsername && realUsername !== player.name) {
            updatePlayer({ name: realUsername });
          }
          setHasCheckedNickname(true);
        }
      }
    })
  },[connectedUsers, isConnected, address, updatePlayer, player.name, showNamingModal, hasCheckedNickname])

  if (currentBattle) {
    return (
      <ToastProvider>
        <div className="app-wrapper">
          <div className="game-container">
            <Battle />
          </div>
        </div>
      </ToastProvider>
    );
  }
  
  return (
    <ToastProvider>
      <div className="app-wrapper">
        <div className="game-container">
          <header className="game-header">
            <h1>宝物冒险 <small style={{fontSize: '12px', fontWeight: 'normal', color: 'white'}}>在线人数：{connectedUsers.length}</small></h1>
            <WalletConnect />
          </header>
          
          <main className="game-content">
            {activeTab === 'stats' && <PlayerStats />}
            {activeTab === 'inventory' && <Inventory />}
            {activeTab === 'treasure' && <TreasureBox />}
            {activeTab === 'forest' && <MonsterForest />}
            {activeTab === 'market' && <Market />}
            {activeTab === 'rank' && <Rank />}
          </main>
          
          <nav className="game-nav">
            <button 
              className={activeTab === 'stats' ? 'active' : ''}
              onClick={() => handleTabChange('stats')}
            >
              <img src="/assets/icons/profile.png" alt="角色" />
            </button>
            <button 
              className={activeTab === 'inventory' ? 'active' : ''}
              onClick={() => handleTabChange('inventory')}
            >
              <img src="/assets/icons/bag.png" alt="背包" />
            </button>
            <button 
              className={activeTab === 'treasure' ? 'active' : ''}
              onClick={() => handleTabChange('treasure')}
            >
              <img src="/assets/icons/box.png" alt="宝箱" />
            </button>
            <button 
              className={activeTab === 'forest' ? 'active' : ''}
              onClick={() => handleTabChange('forest')}
            >
              <img src="/assets/icons/hunt.png" alt="冒险" />
            </button>
            <button 
              className={activeTab === 'market' ? 'active' : ''}
              onClick={() => handleTabChange('market')}
            >
              <img src="/assets/icons/market.png" alt="市场" />
            </button>
            <button 
              className={activeTab === 'rank' ? 'active' : ''}
              onClick={() => handleTabChange('rank')}
            >
              <img src="/assets/icons/rank.png" alt="天梯榜" />
            </button>
          </nav>
        </div>
        
        {/* 命名弹窗 */}
        {showNamingModal && (
          <div className="naming-modal-overlay">
            <div className="naming-modal">
              <h3>设置用户名</h3>
              <p>请设置您的游戏用户名</p>
              <input
                type="text"
                value={userNameInput}
                onChange={(e) => setUserNameInput(e.target.value)}
                placeholder="输入用户名 (2-20字符)"
                maxLength={20}
                className="naming-input"
              />
              <p className="naming-rules">
                用户名规则：2-20字符，只允许中文、英文、数字、下划线
              </p>
              <div className="naming-buttons">
                <button onClick={handleNicknameSubmit} className="naming-confirm">
                  确定
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToastProvider>
  );
}

export default App;
