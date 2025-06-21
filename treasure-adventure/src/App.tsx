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
          
          <nav className="game-nav">
            <button 
              className={activeTab === 'stats' ? 'active' : ''}
              onClick={() => setActiveTab('stats')}
            >
              角色
            </button>
            <button 
              className={activeTab === 'inventory' ? 'active' : ''}
              onClick={() => setActiveTab('inventory')}
            >
              背包
            </button>
            <button 
              className={activeTab === 'treasure' ? 'active' : ''}
              onClick={() => setActiveTab('treasure')}
            >
              宝箱
            </button>
            <button 
              className={activeTab === 'forest' ? 'active' : ''}
              onClick={() => setActiveTab('forest')}
            >
              冒险
            </button>
          </nav>
          
          <main className="game-content">
            {activeTab === 'stats' && <PlayerStats />}
            {activeTab === 'inventory' && <Inventory />}
            {activeTab === 'treasure' && <TreasureBox />}
            {activeTab === 'forest' && <MonsterForest />}
          </main>
          <OfflineRewardsModal />
        </div>
      </div>
    </ToastProvider>
  );
}

export default App;
