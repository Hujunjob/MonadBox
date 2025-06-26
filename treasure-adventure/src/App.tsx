import { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import PlayerStats from './pages/PlayerStats';
import TreasureBox from './pages/TreasureBox';
import MonsterForest from './pages/MonsterForest';
import Inventory from './pages/Inventory';
import Market from './pages/Market';
import Rank from './pages/Rank';
import WalletConnect from './components/WalletConnect';
import Web3BattleHandler from './components/Web3BattleHandler';
import { ToastProvider } from './components/ToastManager';
import './styles/App.css';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('stats');
  const [userNameInput, setUserNameInput] = useState('');

  // 根据路由设置活动标签
  useEffect(() => {
    const path = location.pathname;
    if (path === '/' || path === '/stats') setActiveTab('stats');
    else if (path === '/inventory') setActiveTab('inventory');
    else if (path === '/treasure') setActiveTab('treasure');
    else if (path === '/monster-forest') setActiveTab('forest');
    else if (path === '/market') setActiveTab('market');
    else if (path === '/rank') setActiveTab('rank');
  }, [location.pathname]);

  // 处理页面切换，在切换到特定页面时检查体力
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    // 导航到对应路由
    switch (tab) {
      case 'stats': navigate('/'); break;
      case 'inventory': navigate('/inventory'); break;
      case 'treasure': navigate('/treasure'); break;
      case 'forest': navigate('/monster-forest'); break;
      case 'market': navigate('/market'); break;
      case 'rank': navigate('/rank'); break;
    }
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
  
  };

  // if (currentBattle) {
  //   return (
  //     <ToastProvider>
  //       <Web3BattleHandler />
  //       <div className="app-wrapper">
  //         <div className="game-container">
  //           <Battle />
  //         </div>
  //       </div>
  //     </ToastProvider>
  //   );
  // }
  
  return (
    <>
      <Web3BattleHandler />
      <div className="app-wrapper">
        <div className="game-container">
          <header className="game-header">
            <h1>宝物冒险 
            </h1>
            <WalletConnect />
          </header>
          
          <main className={`game-content ${activeTab === 'stats' ? 'character-bg' : 'other-bg'}`}>
            <Routes>
              <Route path="/" element={<PlayerStats />} />
              <Route path="/stats" element={<PlayerStats />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/treasure" element={<TreasureBox />} />
              <Route path="/monster-forest" element={<MonsterForest />} />
              <Route path="/market" element={<Market />} />
              <Route path="/rank" element={<Rank />} />
            </Routes>
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
        {false && userNameInput && (
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
      {/* {process.env.NODE_ENV === 'development' && <WalletDebugInfo />} */}
    </>
  );
}

export default App;
