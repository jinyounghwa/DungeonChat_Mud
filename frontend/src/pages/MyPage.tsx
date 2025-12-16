import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import '../styles/MyPage.css';

export const MyPage = () => {
  const { character } = useGameStore();
  const [activeTab, setActiveTab] = useState<'stats' | 'inventory' | 'battles'>('stats');

  if (!character) {
    return (
      <div className="mypage error">
        <div className="error-message">캐릭터를 선택해주세요.</div>
      </div>
    );
  }

  const getClassIcon = () => {
    switch (character.class) {
      case 'warrior':
        return '🛡️';
      case 'mage':
        return '🔮';
      case 'thief':
        return '🗡️';
      default:
        return '👤';
    }
  };

  const getClassKorean = () => {
    switch (character.class) {
      case 'warrior':
        return '용사';
      case 'mage':
        return '마법사';
      case 'thief':
        return '도둑';
      default:
        return character.class;
    }
  };

  return (
    <div className="mypage">
      <header className="mypage-header">
        <button className="back-button">← 돌아가기</button>
        <h1>마이페이지</h1>
        <div style={{ width: '100px' }}></div>
      </header>

      <div className="character-card">
        <div className="character-header">
          <span className="class-icon">{getClassIcon()}</span>
          <div>
            <h2>{character.name}</h2>
            <p>
              {getClassKorean()} | Lv.{character.level}
            </p>
          </div>
        </div>

        <div className="character-meta">
          <div className="meta-item">
            <span className="label">생성일</span>
            <span className="value">2024-12-16</span>
          </div>
          <div className="meta-item">
            <span className="label">현재 층</span>
            <span className="value">{character.currentFloor}층</span>
          </div>
        </div>

        <div className="exp-bar">
          <div className="exp-fill" style={{ width: `${(character.exp % 100)}%` }}></div>
          <span className="exp-text">EXP {character.exp} / {((Math.floor(character.exp / 100) + 1) * 100)}</span>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 스탯
        </button>
        <button
          className={`tab ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          🎒 인벤토리
        </button>
        <button
          className={`tab ${activeTab === 'battles' ? 'active' : ''}`}
          onClick={() => setActiveTab('battles')}
        >
          ⚔️ 전투기록
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'stats' && (
          <div className="stats-panel">
            <div className="stat-row">
              <span className="stat-label">체력</span>
              <div className="stat-bar">
                <div
                  className="stat-fill"
                  style={{
                    width: `${(character.hp / character.maxHp) * 100}%`,
                  }}
                ></div>
              </div>
              <span className="stat-value">
                {character.hp}/{character.maxHp}
              </span>
            </div>

            <div className="stat-item">
              <span className="stat-label">공격력</span>
              <span className="stat-value">{character.atk}</span>
            </div>

            <div className="stat-item">
              <span className="stat-label">방어력</span>
              <span className="stat-value">{character.def}</span>
            </div>

            <div className="stat-item">
              <span className="stat-label">골드</span>
              <span className="stat-value">💰 {character.gold}</span>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="inventory-panel">
            <div className="inventory-section">
              <h3>소비 아이템</h3>
              <div className="empty-state">아이템이 없습니다</div>
            </div>

            <div className="inventory-section">
              <h3>장비</h3>
              <div className="empty-state">장비가 없습니다</div>
            </div>
          </div>
        )}

        {activeTab === 'battles' && (
          <div className="battles-panel">
            <div className="empty-state">아직 전투 기록이 없습니다</div>
          </div>
        )}
      </div>

      <div className="action-buttons">
        <button className="btn btn-primary">게임 저장</button>
        <button className="btn btn-secondary">게임 불러오기</button>
        <button className="btn btn-danger">로그아웃</button>
      </div>
    </div>
  );
};
