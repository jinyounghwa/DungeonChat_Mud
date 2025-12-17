import React from 'react';
import { GameChoice } from '../types/game';
import '../styles/choices.css';

export const GameChoices: React.FC<{
  choices: GameChoice;
  onChoiceSelect: (choice: string) => void;
  disabled?: boolean;
}> = ({ choices, onChoiceSelect, disabled = false }) => {
  if (!choices) return null;

  return (
    <div className="game-choices">
      <div className="choices-prompt">선택지:</div>
      <div className="choices-container">
        <button
          className="choice-button choice-1"
          onClick={() => onChoiceSelect(choices.choice1)}
          disabled={disabled}
        >
          <span className="choice-number">1</span>
          <span className="choice-text">{choices.choice1}</span>
        </button>
        <button
          className="choice-button choice-2"
          onClick={() => onChoiceSelect(choices.choice2)}
          disabled={disabled}
        >
          <span className="choice-number">2</span>
          <span className="choice-text">{choices.choice2}</span>
        </button>
      </div>
    </div>
  );
};
