import React, { useState } from 'react';
import { GameState, StatusEffect } from '../types/game';
import '../styles/stats.css';

export const GameStats: React.FC<{ state: GameState | null }> = ({ state }) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!state) return null;

  const hpPercent = (state.health / state.maxHealth) * 100;
  const expPercent = (state.experience % 100) * 1;
  const nextLevelExp = 100 - (state.experience % 100);

  // 상태 이상 표시
  const getStatusEffectEmoji = (type: StatusEffect['type']): string => {
    const emojis: { [key: string]: string } = {
      poison: '☠️',
      curse: '🔮',
      burn: '🔥',
      freeze: '❄️',
      stun: '⭐',
      bleed: '🩸',
    };
    return emojis[type] || '❓';
  };

  // HP 바 색상
  const getHpColor = (): string => {
    if (hpPercent > 50) return '#22c55e'; // 초록색
    if (hpPercent > 25) return '#eab308'; // 노랑색
    return '#ef4444'; // 빨강색
  };

  return (
    <div className="game-stats">
      {/* 기본 스탯 */}
      <div className="stat-row">
        <div className="stat-item">
          <span className="stat-label">Lv.</span>
          <span className="stat-value">{state.level}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Floor</span>
          <span className="stat-value">{state.floor}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">EXP</span>
          <span className="stat-value">{state.experience % 100}/100</span>
        </div>
      </div>

      {/* HP 바 */}
      <div className="stat-row">
        <div className="hp-info">
          <span>HP: {state.health}/{state.maxHealth}</span>
        </div>
        <div className="hp-bar">
          <div
            className="hp-fill"
            style={{
              width: `${hpPercent}%`,
              backgroundColor: getHpColor(),
            }}
          ></div>
        </div>
      </div>

      {/* EXP 바 */}
      <div className="stat-row">
        <div className="exp-info">
          <span>EXP: {nextLevelExp} 남음</span>
        </div>
        <div className="exp-bar">
          <div
            className="exp-fill"
            style={{
              width: `${expPercent}%`,
              backgroundColor: '#3b82f6',
            }}
          ></div>
        </div>
      </div>

      {/* 상태 이상 표시 */}
      {state.statusEffects && state.statusEffects.length > 0 && (
        <div className="status-effects">
          <span className="status-label">Status:</span>
          <div className="status-list">
            {state.statusEffects.map((effect, idx) => (
              <div key={idx} className="status-item" title={`${effect.type} (${effect.duration}턴)`}>
                <span>{getStatusEffectEmoji(effect.type)}</span>
                <span className="duration">{effect.duration}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 인벤토리 정보 */}
      {state.inventory && (
        <div className="inventory-info">
          <span className="inventory-label">
            Inventory: {state.inventory.items.length}/{state.inventory.maxSlots}
          </span>
        </div>
      )}

      {/* 상세 정보 토글 */}
      <button className="details-toggle" onClick={() => setShowDetails(!showDetails)}>
        {showDetails ? '접기 ▲' : '상세정보 ▼'}
      </button>

      {/* 상세 정보 */}
      {showDetails && (
        <div className="stats-details">
          {/* 인벤토리 상세 */}
          {state.inventory && state.inventory.items.length > 0 && (
            <div className="detail-section">
              <h4>📦 인벤토리 ({state.inventory.items.length}개)</h4>
              <div className="items-list">
                {state.inventory.items.map(item => (
                  <div key={item.id} className={`item-row rarity-${item.rarity}`}>
                    <span className="item-name">{item.name}</span>
                    {item.quantity > 1 && <span className="item-qty">x{item.quantity}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 통계 정보 */}
          {state.stats && (
            <div className="detail-section">
              <h4>📊 통계</h4>
              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-name">받은 피해</span>
                  <span className="stat-number">{state.stats.totalDamageTaken || 0}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-name">획득 아이템</span>
                  <span className="stat-number">{state.stats.itemsCollected || 0}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
