import { useState } from 'react';
import { useGameStore } from './store/gameStore';
import PlayerStats from './components/PlayerStats';
import TreasureBox from './components/TreasureBox';
import MonsterForest from './components/MonsterForest';
import Battle from './components/Battle';
import Inventory from './components/Inventory';
import { ToastProvider } from './components/ToastManager';
import OfflineRewardsModal from './components/OfflineRewardsModal';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('stats');
  const { currentBattle } = useGameStore();
  
  if (currentBattle) {
    return (
      <ToastProvider>
        <div className="app-wrapper">
          <div className="game-container">
            <Battle />
            <OfflineRewardsModal />
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
            <h1>宝物冒险</h1>
          </header>
          
          <main className="game-content">
            {activeTab === 'stats' && <PlayerStats />}
            {activeTab === 'inventory' && <Inventory />}
            {activeTab === 'treasure' && <TreasureBox />}
            {activeTab === 'forest' && <MonsterForest />}
          </main>
          
          <nav className="game-nav">
            <button 
              className={activeTab === 'stats' ? 'active' : ''}
              onClick={() => setActiveTab('stats')}
            >
              <img src="/assets/icons/profile.png" alt="角色" />
            </button>
            <button 
              className={activeTab === 'inventory' ? 'active' : ''}
              onClick={() => setActiveTab('inventory')}
            >
              <img src="/assets/icons/bag.png" alt="背包" />
            </button>
            <button 
              className={activeTab === 'treasure' ? 'active' : ''}
              onClick={() => setActiveTab('treasure')}
            >
              <img src="/assets/icons/box.png" alt="宝箱" />
            </button>
            <button 
              className={activeTab === 'forest' ? 'active' : ''}
              onClick={() => setActiveTab('forest')}
            >
              <img src="/assets/icons/hunt.png" alt="冒险" />
            </button>
          </nav>
          <OfflineRewardsModal />
        </div>
      </div>
    </ToastProvider>
  );
}

export default App;
