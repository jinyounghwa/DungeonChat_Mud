// 아이템 인터페이스
export interface Item {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'consumable' | 'quest' | 'treasure';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  quantity: number;
  description?: string;
  stats?: {
    attack?: number;
    defense?: number;
    healthRestore?: number;
  };
}

// 인벤토리 인터페이스
export interface Inventory {
  maxSlots: number;
  items: Item[];
}

// 상태 이상 인터페이스
export interface StatusEffect {
  type: 'poison' | 'curse' | 'burn' | 'freeze' | 'stun' | 'bleed';
  duration: number;
  damage?: number;
}

// 게임 선택지 인터페이스
export interface GameChoice {
  choice1: string;
  choice2: string;
}

// 캐릭터 인터페이스
export interface Character {
  id: string;
  name: string;
  level: number;
  floor: number;
  health: number;
  maxHealth: number;
  experience: number;
}

// 메시지 인터페이스
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

// 게임 상태 인터페이스 (확장)
export interface GameState {
  characterId: string;
  floor: number;
  health: number;
  maxHealth: number;
  experience: number;
  level: number;
  lastUpdated: string;

  // 추가 정보
  inventory?: Inventory;
  statusEffects?: StatusEffect[];
  stats?: {
    totalDamageDealt?: number;
    totalDamageTaken?: number;
    monstersDefeated?: number;
    itemsCollected?: number;
  };
}
