import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { ChatMessage } from '../components/ChatMessage';
import { GameStats } from '../components/GameStats';
import { GameChoices } from '../components/GameChoices';
import { sendMessage } from '../api/client';
import { GameChoice } from '../types/game';
import '../styles/chat-screen.css';

export const ChatScreen: React.FC = () => {
  const { character, messages, gameState, addMessage, setGameState } = useGameStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentChoices, setCurrentChoices] = useState<GameChoice | null>(null);
  const messagesEnd = useRef<HTMLDivElement>(null);

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

  const handleChoiceSelect = (choice: string) => {
    setInput(choice);
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
