import React from 'react';
import { GameState } from '../types/game';
import '../styles/stats.css';

export const GameStats: React.FC<{ state: GameState | null }> = ({ state }) => {
  if (!state) return null;

  const hpPercent = (state.health / state.maxHealth) * 100;
  
  return (
    <div className="game-stats">
      <div className="stat-row">
        <span>Level: {state.level}</span>
        <span>Floor: {state.floor}</span>
        <span>EXP: {state.experience}</span>
      </div>
      <div className="stat-row">
        <span>HP: {state.health}/{state.maxHealth}</span>
        <div className="hp-bar">
          <div className="hp-fill" style={{ width: `${hpPercent}%` }}></div>
        </div>
      </div>
    </div>
  );
};
