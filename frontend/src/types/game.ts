export interface Character {
  id: string;
  name: string;
  class: 'warrior' | 'mage' | 'thief';
  level: number;
  exp: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  currentFloor: number;
  gold: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

export interface GameState {
  character: Character | null;
  messages: Message[];
  currentBattle?: {
    battleId: string;
    monster: any;
  };
}
