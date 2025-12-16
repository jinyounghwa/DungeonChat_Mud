import { create } from 'zustand';
import { Character, Message, AuthState, GameState } from '../types/game';

interface GameStore extends GameState, AuthState {
  // Auth actions
  setUser: (user: any) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;

  // Game actions
  setCharacter: (character: Character | null) => void;
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  updateCharacter: (updates: Partial<Character>) => void;
  setBattle: (battle: { battleId: string; monster: any } | undefined) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  // Initial states
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  character: null,
  messages: [],
  currentBattle: undefined,

  // Auth actions
  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  setTokens: (accessToken, refreshToken) =>
    set({
      accessToken,
      refreshToken,
      isAuthenticated: true,
    }),

  logout: () =>
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      character: null,
      messages: [],
    }),

  // Game actions
  setCharacter: (character) => set({ character }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  clearMessages: () => set({ messages: [] }),

  updateCharacter: (updates) =>
    set((state) => ({
      character: state.character ? { ...state.character, ...updates } : null,
    })),

  setBattle: (currentBattle) => set({ currentBattle }),
}));
