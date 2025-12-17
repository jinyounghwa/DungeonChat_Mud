import { create } from 'zustand';
import { Character, Message, GameState } from '../types/game';

interface GameStore {
  character: Character | null;
  messages: Message[];
  gameState: GameState | null;
  
  setCharacter: (character: Character) => void;
  setGameState: (state: GameState) => void;
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  character: null,
  messages: [],
  gameState: null,
  
  setCharacter: (character) => set({ character }),
  setGameState: (state) => set({ gameState: state }),
  
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  
  clearMessages: () => set({ messages: [] }),
  
  reset: () => set({ character: null, messages: [], gameState: null }),
}));
