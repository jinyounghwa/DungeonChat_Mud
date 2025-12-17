import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { ChatMessage } from '../components/ChatMessage';
import { GameStats } from '../components/GameStats';
import { GameChoices } from '../components/GameChoices';
import { sendMessage, getGameState } from '../api/client';
import { GameChoice } from '../types/game';
import '../styles/chat-screen.css';

export const ChatScreen: React.FC = () => {
  const { character, messages, gameState, addMessage, setGameState } = useGameStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentChoices, setCurrentChoices] = useState<GameChoice | null>(null);
  const messagesEnd = useRef<HTMLDivElement>(null);

  // 게임 시작 시 기존 게임 상태 불러오기
  useEffect(() => {
    if (character && !gameState) {
      const loadGameState = async () => {
        const savedState = await getGameState(character.id);
        if (savedState) {
          setGameState(savedState);
        } else {
          // 새 게임 상태 초기화
          const initialState = {
            characterId: character.id,
            floor: 1,
            health: 100,
            maxHealth: 100,
            experience: 0,
            level: 1,
            lastUpdated: new Date().toISOString(),
            inventory: { maxSlots: 20, items: [] },
            statusEffects: [],
            stats: {
              totalDamageDealt: 0,
              totalDamageTaken: 0,
              monstersDefeated: 0,
              itemsCollected: 0,
            },
          };
          setGameState(initialState);
        }
      };
      loadGameState();
    }
  }, [character, gameState, setGameState]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !character || isLoading) return;

    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user' as const,
      content: input,
      timestamp: new Date(),
    };

    addMessage(userMessage);
    setInput('');
    setIsLoading(true);

    try {
      const result = await sendMessage(character.id, input);

      addMessage({
        id: `msg-${Date.now()}-response`,
        role: 'assistant',
        content: result.response,
        timestamp: new Date(),
      });

      setGameState(result.gameState);
      setCurrentChoices(result.choices || null);
    } catch (error) {
      addMessage({
        id: `msg-${Date.now()}-error`,
        role: 'system',
        content: '[ERROR] 메시지 전송 실패',
        timestamp: new Date(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChoiceSelect = async (choice: string) => {
    // 선택지를 입력 필드에 설정
    setInput(choice);

    // 즉시 메시지 전송
    if (!character || isLoading) return;

    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user' as const,
      content: choice,
      timestamp: new Date(),
    };

    addMessage(userMessage);
    setInput('');
    setIsLoading(true);

    try {
      const result = await sendMessage(character.id, choice);

      addMessage({
        id: `msg-${Date.now()}-response`,
        role: 'assistant',
        content: result.response,
        timestamp: new Date(),
      });

      setGameState(result.gameState);
      setCurrentChoices(result.choices || null);
    } catch (error) {
      addMessage({
        id: `msg-${Date.now()}-error`,
        role: 'system',
        content: '[ERROR] 메시지 전송 실패',
        timestamp: new Date(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!character) {
    return <div className="chat-screen error">캐릭터를 선택해주세요</div>;
  }

  return (
    <div className="chat-screen">
      <header className="chat-header">
        <h1>{character.name} (Lv.{character.level})</h1>
        <GameStats state={gameState} />
      </header>

      <div className="messages-container">
        {messages.length === 0 && (
          <div className="welcome">
            <p>&gt; 던전에 입장했습니다...</p>
            <p>&gt; 행운을 빕니다!</p>
          </div>
        )}
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {currentChoices && (
          <GameChoices
            choices={currentChoices}
            onChoiceSelect={handleChoiceSelect}
            disabled={isLoading}
          />
        )}
        <div ref={messagesEnd} />
      </div>

      <form className="input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="명령어를 입력하세요..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          {isLoading ? '전송 중...' : '전송'}
        </button>
      </form>
    </div>
  );
};
