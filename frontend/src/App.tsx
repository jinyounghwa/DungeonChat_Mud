import React, { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { ChatScreen } from './pages/ChatScreen';
import './App.css';

export const App: React.FC = () => {
  const { character, setCharacter } = useGameStore();

  useEffect(() => {
    // 기본 캐릭터 생성
    if (!character) {
      setCharacter({
        id: 'hero-1',
        name: '용사',
        level: 1,
        floor: 1,
        health: 100,
        maxHealth: 100,
        experience: 0,
      });
    }
  }, []);

  return (
    <div className="app">
      {character ? <ChatScreen /> : <div>로딩 중...</div>}
    </div>
  );
};
