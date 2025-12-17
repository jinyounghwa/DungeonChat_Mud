import React from 'react';
import { Message } from '../types/game';
import '../styles/chat.css';

export const ChatMessage: React.FC<{ message: Message }> = ({ message }) => {
  const roleClass = message.role === 'user' ? 'user-msg' : 
                   message.role === 'system' ? 'system-msg' : 'assistant-msg';
  
  return (
    <div className={`message ${roleClass}`}>
      <span className="msg-content">{message.content}</span>
    </div>
  );
};
