import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CharacterService } from './character.service';
import { DatabaseService } from '../../database/database.service';
import { RagService } from '../../ai/rag.service';
import { SaveService } from './save.service';
import { CreateCharacterDto } from '../dtos/create-character.dto';
import {
  createMockCharacter,
  MockDatabaseService,
  MockRagService,
} from '../test/test-utils';
import {
  SAMPLE_WARRIOR,
  SAMPLE_MAGE,
  SAMPLE_THIEF,
  CHARACTER_STAT_GROWTH,
} from '../test/test-fixtures';

describe('CharacterService', () => {
  let service: CharacterService;
  let dbService: MockDatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CharacterService,
        { provide: DatabaseService, useClass: MockDatabaseService },
        { provide: RagService, useClass: MockRagService },
        {
          provide: SaveService,
          useValue: {
            autoSave: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<CharacterService>(CharacterService);
    dbService = module.get<MockDatabaseService>(DatabaseService) as any;
  });

  describe('createCharacter', () => {
    it('warrior 직업으로 캐릭터를 생성할 수 있어야 함', async () => {
      const userId = 'user-123';
      const dto: CreateCharacterDto = {
        name: '테스트용사',
        class: 'warrior',
      };

      dbService.character.create.mockResolvedValue({
        id: 'char-123',
        userId,
        ...dto,
        level: 1,
        exp: 0,
        hp: 120,
        maxHp: 120,
        atk: 15,
        def: 12,
        currentFloor: 1,
        gold: 0,
      });

      const result = await service.createCharacter(userId, dto);

      expect(result.name).toBe('테스트용사');
      expect(result.class).toBe('warrior');
      expect(result.level).toBe(1);
      expect(result.hp).toBe(120);
      expect(result.atk).toBe(15);
      expect(result.def).toBe(12);
    });

    it('mage 직업으로 캐릭터를 생성할 수 있어야 함', async () => {
      const userId = 'user-123';
      const dto: CreateCharacterDto = {
        name: '테스트마법사',
        class: 'mage',
      };

      dbService.character.create.mockResolvedValue({
        id: 'char-123',
        userId,
        ...dto,
        level: 1,
        exp: 0,
        hp: 80,
        maxHp: 80,
        atk: 20,
        def: 8,
        currentFloor: 1,
        gold: 0,
      });

      const result = await service.createCharacter(userId, dto);

      expect(result.name).toBe('테스트마법사');
      expect(result.class).toBe('mage');
      expect(result.hp).toBe(80);
      expect(result.atk).toBe(20);
      expect(result.def).toBe(8);
    });

    it('thief 직업으로 캐릭터를 생성할 수 있어야 함', async () => {
      const userId = 'user-123';
      const dto: CreateCharacterDto = {
        name: '테스트도둑',
        class: 'thief',
      };

      dbService.character.create.mockResolvedValue({
        id: 'char-123',
        userId,
        ...dto,
        level: 1,
        exp: 0,
        hp: 100,
        maxHp: 100,
        atk: 18,
        def: 10,
        currentFloor: 1,
        gold: 0,
      });

      const result = await service.createCharacter(userId, dto);

      expect(result.name).toBe('테스트도둑');
      expect(result.class).toBe('thief');
      expect(result.hp).toBe(100);
      expect(result.atk).toBe(18);
      expect(result.def).toBe(10);
    });

    it('유효하지 않은 직업은 거부해야 함', async () => {
      const userId = 'user-123';
      const dto: CreateCharacterDto = {
        name: '잘못된캐릭터',
        class: 'invalid' as any,
      };

      await expect(service.createCharacter(userId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('생성된 캐릭터는 레벨 1로 시작해야 함', async () => {
      const userId = 'user-123';
      const dto: CreateCharacterDto = {
        name: '테스트용사',
        class: 'warrior',
      };

      dbService.character.create.mockResolvedValue({
        id: 'char-123',
        userId,
        ...dto,
        level: 1,
        exp: 0,
        hp: 120,
        maxHp: 120,
        atk: 15,
        def: 12,
        currentFloor: 1,
        gold: 0,
      });

      const result = await service.createCharacter(userId, dto);

      expect(result.level).toBe(1);
      expect(result.exp).toBe(0);
    });
  });

  describe('getCharacter', () => {
    it('캐릭터 ID로 캐릭터를 조회할 수 있어야 함', async () => {
      const character = createMockCharacter();
      dbService.character.findUnique.mockResolvedValue(character);

      const result = await service.getCharacter(character.id);

      expect(result.id).toBe(character.id);
      expect(result.name).toBe(character.name);
      expect(result.level).toBe(character.level);
    });

    it('존재하지 않는 캐릭터는 NotFoundException을 throw해야 함', async () => {
      dbService.character.findUnique.mockResolvedValue(null);

      await expect(service.getCharacter('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getCharacterStats', () => {
    it('캐릭터 상세 통계를 반환해야 함', async () => {
      const character = createMockCharacter({ level: 5, exp: 450 });
      dbService.character.findUnique.mockResolvedValue(character);
      dbService.battleLog.findMany.mockResolvedValue([
        {
          result: 'victory',
          goldGained: 25,
        },
        {
          result: 'victory',
          goldGained: 15,
        },
      ]);

      const result = await service.getCharacterStats(character.id);

      expect(result).toHaveProperty('character');
      expect(result).toHaveProperty('expToNextLevel');
      expect(result).toHaveProperty('totalMonstersDefeated');
      expect(result).toHaveProperty('totalGoldEarned');
      expect(result.totalMonstersDefeated).toBe(2);
      expect(result.totalGoldEarned).toBe(40);
    });

    it('다음 레벨까지 필요한 경험치를 계산해야 함', async () => {
      const character = createMockCharacter({ level: 5, exp: 450 });
      dbService.character.findUnique.mockResolvedValue(character);
      dbService.battleLog.findMany.mockResolvedValue([]);

      const result = await service.getCharacterStats(character.id);

      // 레벨 5: 500 EXP 필요, 현재 450 -> 남은 경험치 50
      expect(result.expToNextLevel).toBe(50);
    });
  });

  describe('gainExp', () => {
    it('경험치를 얻을 수 있어야 함', async () => {
      const character = createMockCharacter({ level: 1, exp: 0 });
      dbService.character.findUnique.mockResolvedValue(character);
      dbService.character.update.mockResolvedValue({
        ...character,
        exp: 50,
      });

      const result = await service.gainExp(character.id, 50);

      expect(result.character.exp).toBe(50);
      expect(result.leveledUp).toBe(false);
    });

    it('경험치가 충분하면 레벨업해야 함', async () => {
      const character = createMockCharacter({ level: 1, exp: 0, maxHp: 120, atk: 15, def: 12 });
      dbService.character.findUnique.mockResolvedValue(character);
      dbService.character.update.mockResolvedValue({
        ...character,
        level: 2,
        exp: 0,
        hp: 130,
        maxHp: 130,
        atk: 17,
        def: 14,
      });

      const result = await service.gainExp(character.id, 100);

      expect(result.leveledUp).toBe(true);
      expect(result.character.level).toBe(2);
    });

    it('레벨업 시 직업별 스탯이 증가해야 함', async () => {
      const warrior = createMockCharacter({ class: 'warrior', level: 1, exp: 0, maxHp: 120, atk: 15, def: 12 });
      dbService.character.findUnique.mockResolvedValue(warrior);
      dbService.character.update.mockResolvedValue({
        ...warrior,
        level: 2,
        hp: 130,
        maxHp: 130,
        atk: 17,
        def: 14,
      });

      const result = await service.gainExp(warrior.id, 100);

      // Warrior 레벨업: HP +10, ATK +2, DEF +2
      expect(result.hpIncrease).toBe(10);
      expect(result.atkIncrease).toBe(2);
      expect(result.defIncrease).toBe(2);
    });

    it('레벨업 시 HP가 완전히 회복되어야 함', async () => {
      const character = createMockCharacter({
        level: 1,
        exp: 0,
        hp: 50, // 손상된 HP
        maxHp: 120,
      });
      dbService.character.findUnique.mockResolvedValue(character);
      dbService.character.update.mockResolvedValue({
        ...character,
        level: 2,
        hp: 130, // 새 최대 HP로 회복
        maxHp: 130,
      });

      const result = await service.gainExp(character.id, 100);

      expect(result.character.hp).toBe(result.character.maxHp);
    });

    it('한 번에 여러 레벨을 올릴 수 있어야 함', async () => {
      const character = createMockCharacter({ level: 1, exp: 0, maxHp: 120, atk: 15, def: 12 });
      dbService.character.findUnique.mockResolvedValue(character);
      dbService.character.update.mockResolvedValue({
        ...character,
        level: 3,
        exp: 0,
        hp: 150,
        maxHp: 150,
        atk: 19,
        def: 16,
      });

      const result = await service.gainExp(character.id, 300); // 100 + 200 = 300 (2레벨업)

      expect(result.leveledUp).toBe(true);
      expect(result.character.level).toBe(3);
      expect(result.levelIncrease).toBe(2);
    });

    it('존재하지 않는 캐릭터는 NotFoundException을 throw해야 함', async () => {
      dbService.character.findUnique.mockResolvedValue(null);

      await expect(service.gainExp('non-existent', 50)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateCharacterStats', () => {
    it('캐릭터 스탯을 업데이트할 수 있어야 함', async () => {
      const character = createMockCharacter();
      dbService.character.update.mockResolvedValue({
        ...character,
        hp: 100,
        gold: 500,
      });

      const result = await service.updateCharacterStats(character.id, {
        hp: 100,
        gold: 500,
      });

      expect(result.hp).toBe(100);
      expect(result.gold).toBe(500);
    });

    it('여러 스탯을 동시에 업데이트할 수 있어야 함', async () => {
      const character = createMockCharacter();
      dbService.character.update.mockResolvedValue({
        ...character,
        hp: 80,
        maxHp: 150,
        atk: 20,
        def: 15,
        level: 6,
      });

      const result = await service.updateCharacterStats(character.id, {
        hp: 80,
        maxHp: 150,
        atk: 20,
        def: 15,
        level: 6,
      });

      expect(result.hp).toBe(80);
      expect(result.maxHp).toBe(150);
      expect(result.atk).toBe(20);
      expect(result.def).toBe(15);
      expect(result.level).toBe(6);
    });
  });

  describe('Character level progression', () => {
    it('레벨 1에서 2로 올리는데 100 EXP가 필요해야 함', async () => {
      const character = createMockCharacter({ level: 1, exp: 0 });
      dbService.character.findUnique.mockResolvedValue(character);
      dbService.character.update.mockResolvedValue({
        ...character,
        level: 2,
        exp: 0,
      });

      const result = await service.gainExp(character.id, 100);

      expect(result.leveledUp).toBe(true);
      expect(result.character.level).toBe(2);
    });

    it('레벨 2에서 3으로 올리는데 200 EXP가 필요해야 함', async () => {
      const character = createMockCharacter({ level: 2, exp: 0 });
      dbService.character.findUnique.mockResolvedValue(character);
      dbService.character.update.mockResolvedValue({
        ...character,
        level: 3,
        exp: 0,
      });

      const result = await service.gainExp(character.id, 200);

      expect(result.leveledUp).toBe(true);
      expect(result.character.level).toBe(3);
    });

    it('레벨 5에서 6으로 올리는데 500 EXP가 필요해야 함', async () => {
      const character = createMockCharacter({ level: 5, exp: 0 });
      dbService.character.findUnique.mockResolvedValue(character);
      dbService.character.update.mockResolvedValue({
        ...character,
        level: 6,
        exp: 0,
      });

      const result = await service.gainExp(character.id, 500);

      expect(result.leveledUp).toBe(true);
      expect(result.character.level).toBe(6);
    });
  });

  describe('Character stat growth by class', () => {
    it('warrior는 레벨업 시 HP +10, ATK +2, DEF +2 증가해야 함', async () => {
      const warrior = createMockCharacter({
        class: 'warrior',
        level: 1,
        exp: 0,
        maxHp: 120,
        atk: 15,
        def: 12,
      });
      dbService.character.findUnique.mockResolvedValue(warrior);
      dbService.character.update.mockResolvedValue({
        ...warrior,
        level: 2,
        hp: 130,
        maxHp: 130,
        atk: 17,
        def: 14,
      });

      const result = await service.gainExp(warrior.id, 100);

      expect(result.hpIncrease).toBe(10);
      expect(result.atkIncrease).toBe(2);
      expect(result.defIncrease).toBe(2);
    });

    it('mage는 레벨업 시 HP +6, ATK +3, DEF +1 증가해야 함', async () => {
      const mage = createMockCharacter({
        class: 'mage',
        level: 1,
        exp: 0,
        maxHp: 80,
        atk: 20,
        def: 8,
      });
      dbService.character.findUnique.mockResolvedValue(mage);
      dbService.character.update.mockResolvedValue({
        ...mage,
        level: 2,
        hp: 86,
        maxHp: 86,
        atk: 23,
        def: 9,
      });

      const result = await service.gainExp(mage.id, 100);

      expect(result.hpIncrease).toBe(6);
      expect(result.atkIncrease).toBe(3);
      expect(result.defIncrease).toBe(1);
    });

    it('thief는 레벨업 시 HP +8, ATK +2.5, DEF +1.5 증가해야 함', async () => {
      const thief = createMockCharacter({
        class: 'thief',
        level: 1,
        exp: 0,
        maxHp: 100,
        atk: 18,
        def: 10,
      });
      dbService.character.findUnique.mockResolvedValue(thief);
      dbService.character.update.mockResolvedValue({
        ...thief,
        level: 2,
        hp: 108,
        maxHp: 108,
        atk: 20.5,
        def: 11.5,
      });

      const result = await service.gainExp(thief.id, 100);

      expect(result.hpIncrease).toBe(8);
      expect(Math.round(result.atkIncrease * 10) / 10).toBe(2.5);
      expect(Math.round(result.defIncrease * 10) / 10).toBe(1.5);
    });
  });
});
