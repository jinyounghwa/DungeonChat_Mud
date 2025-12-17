export interface Character {
  id: string;
  name: string;
  level: number;
  floor: number;
  health: number;
  maxHealth: number;
  experience: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface GameState {
  characterId: string;
  floor: number;
  health: number;
  maxHealth: number;
  experience: number;
  level: number;
  lastUpdated: string;
}
