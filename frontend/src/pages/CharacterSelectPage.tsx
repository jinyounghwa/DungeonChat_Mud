import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { createCharacter } from '../api/client';
import '../styles/CharacterSelectPage.css';

interface CharacterSelectPageProps {
  onCharacterSelect: () => void;
}

type CharacterClass = 'warrior' | 'mage' | 'thief';

interface CharacterClassInfo {
  name: string;
  description: string;
  stats: string;
  icon: string;
}

const CHARACTER_CLASSES: Record<CharacterClass, CharacterClassInfo> = {
  warrior: {
    name: '용사',
    description: '균형잡힌 능력을 가진 전사',
    stats: 'HP: 120 | ATK: 15 | DEF: 12',
    icon: '🛡️',
  },
  mage: {
    name: '마법사',
    description: '높은 공격력의 마법사',
    stats: 'HP: 80 | ATK: 20 | DEF: 8',
    icon: '🔮',
  },
  thief: {
    name: '도둑',
    description: '높은 회피율의 암살자',
    stats: 'HP: 100 | ATK: 18 | DEF: 10',
    icon: '🗡️',
  },
};

export const CharacterSelectPage = ({
  onCharacterSelect,
}: CharacterSelectPageProps) => {
  const [characterName, setCharacterName] = useState('');
  const [selectedClass, setSelectedClass] = useState<CharacterClass>('warrior');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { setCharacter } = useGameStore();

  const handleCreateCharacter = async () => {
    if (!characterName.trim()) {
      setError('캐릭터 이름을 입력해주세요');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await createCharacter(characterName, selectedClass);

      if (result.success) {
        setCharacter(result.data);
        onCharacterSelect();
      } else {
        setError(result.error || '캐릭터 생성 실패');
      }
    } catch (err: any) {
      setError(err.message || '오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="character-select-page">
      <div className="character-select-container">
        <h1>캐릭터 생성</h1>
        <p>당신의 캐릭터를 만들어보세요</p>

        <div className="character-name-section">
          <label>캐릭터 이름</label>
          <input
            type="text"
            value={characterName}
            onChange={(e) => setCharacterName(e.target.value)}
            placeholder="캐릭터 이름 입력"
            maxLength={20}
            disabled={isLoading}
          />
        </div>

        <div className="character-class-section">
          <label>직업 선택</label>
          <div className="class-buttons">
            {Object.entries(CHARACTER_CLASSES).map(([key, info]) => (
              <button
                key={key}
                className={`class-button ${selectedClass === key ? 'active' : ''}`}
                onClick={() => setSelectedClass(key as CharacterClass)}
                disabled={isLoading}
              >
                <div className="class-icon">{info.icon}</div>
                <div className="class-name">{info.name}</div>
                <div className="class-desc">{info.description}</div>
                <div className="class-stats">{info.stats}</div>
              </button>
            ))}
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button
          onClick={handleCreateCharacter}
          disabled={isLoading || !characterName.trim()}
          className="create-button"
        >
          {isLoading ? '생성 중...' : '캐릭터 생성'}
        </button>
      </div>
    </div>
  );
};
