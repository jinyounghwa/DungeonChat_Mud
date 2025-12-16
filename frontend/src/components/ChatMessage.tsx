import { Message } from '../types/game';
import '../styles/ChatMessage.css';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const getMessageClassName = () => {
    switch (message.role) {
      case 'system':
        return 'chat-message system';
      case 'assistant':
        return 'chat-message assistant';
      case 'user':
        return 'chat-message user';
      default:
        return 'chat-message';
    }
  };

  // Check if message contains ASCII art (box-drawing characters)
  const isASCIIArt = () => {
    const asciiArtChars = ['╔', '╗', '╚', '╝', '║', '═', '┌', '┐', '└', '┘', '─', '├', '┤', '┬', '┴', '┼'];
    return asciiArtChars.some(char => message.content.includes(char));
  };

  const formatContent = () => {
    switch (message.role) {
      case 'system':
        return `[SYSTEM] ${message.content}`;
      case 'assistant':
        // Don't add prefix for ASCII art responses to preserve formatting
        return isASCIIArt() ? message.content : `> ${message.content}`;
      case 'user':
        return `$ ${message.content}`;
      default:
        return message.content;
    }
  };

  return (
    <div className={getMessageClassName()}>
      <p className="message-text">{formatContent()}</p>
    </div>
  );
};
