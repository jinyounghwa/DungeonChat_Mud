import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from '../database/database.service';
import { AiService } from '../ai/ai.service';
import { RagService } from '../ai/rag.service';

// Mock Database Service
export class MockDatabaseService {
  character = {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  };

  user = {
    findUnique: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
  };

  inventory = {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  battleLog = {
    create: jest.fn(),
    findMany: jest.fn(),
  };

  saveState = {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  conversation = {
    create: jest.fn(),
    findMany: jest.fn(),
  };
}

// Mock AI Service
export class MockAiService {
  async generateText(): Promise<string> {
    return 'Mock AI response';
  }

  async generateDungeonDescription(): Promise<string> {
    return 'Mock dungeon description';
  }

  async generateBattleNarration(): Promise<string> {
    return 'Mock battle narration';
  }

  async generateMonsterDescription(): Promise<string> {
    return 'Mock monster description';
  }

  async generateLevelUpMessage(): Promise<string> {
    return 'Mock level-up message';
  }
}

// Mock RAG Service
export class MockRagService {
  async initialize(): Promise<void> {
    return;
  }

  async embedConversation(): Promise<void> {
    return;
  }

  async embedGameEvent(): Promise<void> {
    return;
  }

  async queryContext(): Promise<string> {
    return '';
  }

  async deleteCharacterContext(): Promise<void> {
    return;
  }
}

// Factory functions for test data
export function createMockCharacter(overrides: any = {}) {
  return {
    id: 'char-123',
    userId: 'user-123',
    name: '테스트용사',
    class: 'warrior',
    level: 1,
    exp: 0,
    hp: 120,
    maxHp: 120,
    atk: 15,
    def: 12,
    currentFloor: 1,
    gold: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockUser(overrides: any = {}) {
  return {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    passwordHash: 'hashedpassword',
    createdAt: new Date(),
    lastLogin: new Date(),
    ...overrides,
  };
}

export function createMockMonster(overrides: any = {}) {
  return {
    name: '고블린',
    level: 2,
    hp: 30,
    maxHp: 30,
    atk: 8,
    def: 3,
    isBoss: false,
    ascii: '',
    ...overrides,
  };
}

export function createMockInventoryItem(overrides: any = {}) {
  return {
    id: 'item-123',
    characterId: 'char-123',
    itemName: '체력 포션',
    itemType: 'potion',
    quantity: 1,
    isEquipped: false,
    createdAt: new Date(),
    ...overrides,
  };
}

export function createMockBattleLog(overrides: any = {}) {
  return {
    id: 'battle-log-123',
    characterId: 'char-123',
    monsterName: '고블린',
    monsterLevel: 2,
    result: 'victory',
    damageDealt: 15,
    damageTaken: 5,
    expGained: 20,
    goldGained: 10,
    itemsGained: [],
    battleDuration: 3,
    createdAt: new Date(),
    ...overrides,
  };
}

export function createMockSaveState(overrides: any = {}) {
  return {
    id: 'save-123',
    characterId: 'char-123',
    slotNumber: 1,
    saveName: '테스트 저장',
    gameState: {
      character: createMockCharacter(),
      inventory: [],
      conversations: [],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// Test module setup helper
export async function createTestingModule(
  imports: any[],
  providers: any[] = [],
): Promise<TestingModule> {
  const module: TestingModule = await Test.createTestingModule({
    imports,
    providers: [
      ...providers,
      {
        provide: DatabaseService,
        useClass: MockDatabaseService,
      },
      {
        provide: AiService,
        useClass: MockAiService,
      },
      {
        provide: RagService,
        useClass: MockRagService,
      },
    ],
  }).compile();

  return module;
}

// Combat calculation test helpers
export function testDamageCalculation(
  playerAtk: number,
  monsterDef: number,
  expectedMinDamage: number = 1,
): { damage: number; isValid: boolean } {
  const damage = Math.max(expectedMinDamage, playerAtk - monsterDef / 2);
  return {
    damage: Math.floor(damage),
    isValid: damage >= expectedMinDamage,
  };
}
