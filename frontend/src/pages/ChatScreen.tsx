import { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { ChatMessage } from '../components/ChatMessage';
import '../styles/ChatScreen.css';

export const ChatScreen = () => {
  const { character, messages, addMessage } = useGameStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || !character) {
      return;
    }

    // Add user message
    addMessage({
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    });

    setInput('');
    setIsLoading(true);

    try {
      // TODO: Send message to API and get response
      // For now, just add a placeholder response
      setTimeout(() => {
        addMessage({
          id: `msg-${Date.now()}-response`,
          role: 'assistant',
          content: '더 이상 진행할 수 없습니다. 백엔드를 설정해주세요.',
          timestamp: new Date(),
        });
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error('Failed to send message:', error);
      addMessage({
        id: `msg-${Date.now()}-error`,
        role: 'system',
        content: '[ERROR] 메시지 전송에 실패했습니다.',
        timestamp: new Date(),
      });
      setIsLoading(false);
    }
  };

  if (!character) {
    return (
      <div className="chat-screen error">
        <div className="error-message">
          캐릭터를 선택해주세요.
        </div>
      </div>
    );
  }

  return (
    <div className="chat-screen">
      <header className="chat-header">
        <div className="header-left">
          <span className="character-name">{character.name}</span>
          <span className="character-level">Lv.{character.level}</span>
        </div>
        <button className="menu-button">☰</button>
      </header>

      <div className="chat-area">
        <div className="cli-container">
          {messages.length === 0 ? (
            <div className="welcome-message">
              <p>> 던전에 입장했습니다...</p>
              <p>> 행운을 빕니다!</p>
            </div>
          ) : (
            messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <form className="input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="명령어를 입력하세요..."
          disabled={isLoading}
          className="message-input"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="send-button"
        >
          전송
        </button>
      </form>
    </div>
  );
};
