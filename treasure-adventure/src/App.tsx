import React, { useState, useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import PlayerStats from './components/PlayerStats';
import Equipment from './components/Equipment';
import TreasureBox from './components/TreasureBox';
import MonsterForest from './components/MonsterForest';
import Battle from './components/Battle';
import TreasureBoxTimer from './components/TreasureBoxTimer';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('stats');
  const { currentBattle, initializeGame } = useGameStore();
  
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);
  
  if (currentBattle) {
    return <Battle />;
  }
  
  return (
    <div className="game-container">
      <header className="game-header">
        <h1>宝物冒险</h1>
        <TreasureBoxTimer />
      </header>
      
      <nav className="game-nav">
        <button 
          className={activeTab === 'stats' ? 'active' : ''}
          onClick={() => setActiveTab('stats')}
        >
          角色
        </button>
        <button 
          className={activeTab === 'equipment' ? 'active' : ''}
          onClick={() => setActiveTab('equipment')}
        >
          装备
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
          森林
        </button>
      </nav>
      
      <main className="game-content">
        {activeTab === 'stats' && <PlayerStats />}
        {activeTab === 'equipment' && <Equipment />}
        {activeTab === 'treasure' && <TreasureBox />}
        {activeTab === 'forest' && <MonsterForest />}
      </main>
    </div>
  );
}

export default App;
