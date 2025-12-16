import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SaveService } from './save.service';
import { DatabaseService } from '../../database/database.service';
import {
  createMockCharacter,
  createMockInventoryItem,
  MockDatabaseService,
} from '../test/test-utils';
import { SAMPLE_SAVE_STATE, SAMPLE_WARRIOR } from '../test/test-fixtures';

describe('SaveService', () => {
  let service: SaveService;
  let dbService: MockDatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaveService,
        { provide: DatabaseService, useClass: MockDatabaseService },
      ],
    }).compile();

    service = module.get<SaveService>(SaveService);
    dbService = module.get<MockDatabaseService>(DatabaseService) as any;
  });

  describe('saveGame', () => {
    it('유효한 슬롯에 게임을 저장할 수 있어야 함', async () => {
      const character = createMockCharacter();
      dbService.character.findUnique.mockResolvedValue(character);
      dbService.inventory.findMany.mockResolvedValue([]);
      dbService.conversation.findMany.mockResolvedValue([]);
      dbService.saveState.findUnique.mockResolvedValue(null);
      dbService.saveState.create.mockResolvedValue(SAMPLE_SAVE_STATE);

      const result = await service.saveGame(character.id, 1, '테스트 저장');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('gameState');
      expect(dbService.saveState.create).toHaveBeenCalled();
    });

    it('슬롯 1에서 5까지 저장할 수 있어야 함', async () => {
      const character = createMockCharacter();
      dbService.character.findUnique.mockResolvedValue(character);
      dbService.inventory.findMany.mockResolvedValue([]);
      dbService.conversation.findMany.mockResolvedValue([]);
      dbService.saveState.findUnique.mockResolvedValue(null);
      dbService.saveState.create.mockResolvedValue(SAMPLE_SAVE_STATE);

      for (let slot = 1; slot <= 5; slot++) {
        const result = await service.saveGame(character.id, slot);
        expect(result).toBeDefined();
      }
    });

    it('슬롯 0은 거부해야 함', async () => {
      const character = createMockCharacter();

      await expect(service.saveGame(character.id, 0)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('슬롯 6은 거부해야 함', async () => {
      const character = createMockCharacter();

      await expect(service.saveGame(character.id, 6)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('같은 슬롯에 다시 저장하면 업데이트해야 함', async () => {
      const character = createMockCharacter();
      const existingSave = SAMPLE_SAVE_STATE;

      dbService.character.findUnique.mockResolvedValue(character);
      dbService.inventory.findMany.mockResolvedValue([]);
      dbService.conversation.findMany.mockResolvedValue([]);
      dbService.saveState.findUnique.mockResolvedValue(existingSave);
      dbService.saveState.update.mockResolvedValue({
        ...existingSave,
        saveName: '업데이트된 저장',
      });

      const result = await service.saveGame(character.id, 1, '업데이트된 저장');

      expect(dbService.saveState.update).toHaveBeenCalled();
    });

    it('캐릭터를 찾을 수 없으면 NotFoundException을 throw해야 함', async () => {
      dbService.character.findUnique.mockResolvedValue(null);

      await expect(
        service.saveGame('non-existent', 1),
      ).rejects.toThrow(NotFoundException);
    });

    it('게임 상태 스냅샷에 캐릭터 정보를 포함해야 함', async () => {
      const character = createMockCharacter({
        id: 'char-123',
        name: '테스트용사',
        level: 5,
        exp: 450,
        hp: 100,
        maxHp: 150,
      });
      dbService.character.findUnique.mockResolvedValue(character);
      dbService.inventory.findMany.mockResolvedValue([]);
      dbService.conversation.findMany.mockResolvedValue([]);
      dbService.saveState.findUnique.mockResolvedValue(null);
      dbService.saveState.create.mockResolvedValue({
        ...SAMPLE_SAVE_STATE,
        gameState: {
          character: {
            id: character.id,
            name: character.name,
            level: character.level,
            hp: character.hp,
          },
          inventory: [],
          conversations: [],
        },
      });

      const result = await service.saveGame(character.id, 1);

      const gameState = result.gameState as any;
      expect(gameState.character.id).toBe('char-123');
      expect(gameState.character.name).toBe('테스트용사');
      expect(gameState.character.level).toBe(5);
    });

    it('게임 상태 스냅샷에 인벤토리를 포함해야 함', async () => {
      const character = createMockCharacter();
      const inventory = [
        createMockInventoryItem({ itemName: '체력 포션', quantity: 3 }),
        createMockInventoryItem({ itemName: '강철 검', isEquipped: true }),
      ];
      dbService.character.findUnique.mockResolvedValue(character);
      dbService.inventory.findMany.mockResolvedValue(inventory);
      dbService.conversation.findMany.mockResolvedValue([]);
      dbService.saveState.findUnique.mockResolvedValue(null);
      dbService.saveState.create.mockResolvedValue({
        ...SAMPLE_SAVE_STATE,
        gameState: {
          character: {},
          inventory,
          conversations: [],
        },
      });

      const result = await service.saveGame(character.id, 1);

      const gameState = result.gameState as any;
      expect(gameState.inventory).toHaveLength(2);
      expect(gameState.inventory[0].itemName).toBe('체력 포션');
      expect(gameState.inventory[1].isEquipped).toBe(true);
    });

    it('게임 상태 스냅샷에 최근 대화 기록을 포함해야 함', async () => {
      const character = createMockCharacter();
      const conversations = [
        { role: 'user', content: '안녕', createdAt: new Date() },
        { role: 'assistant', content: '반갑습니다', createdAt: new Date() },
      ];
      dbService.character.findUnique.mockResolvedValue(character);
      dbService.inventory.findMany.mockResolvedValue([]);
      dbService.conversation.findMany.mockResolvedValue(conversations);
      dbService.saveState.findUnique.mockResolvedValue(null);
      dbService.saveState.create.mockResolvedValue({
        ...SAMPLE_SAVE_STATE,
        gameState: {
          character: {},
          inventory: [],
          conversations,
        },
      });

      const result = await service.saveGame(character.id, 1);

      const gameState = result.gameState as any;
      expect(gameState.conversations).toHaveLength(2);
      expect(gameState.conversations[0].role).toBe('user');
    });
  });

  describe('getSaveSlots', () => {
    it('캐릭터의 모든 저장 슬롯을 조회할 수 있어야 함', async () => {
      const character = createMockCharacter();
      const saves = [
        { ...SAMPLE_SAVE_STATE, slotNumber: 1 },
        { ...SAMPLE_SAVE_STATE, slotNumber: 2 },
      ];
      dbService.saveState.findMany.mockResolvedValue(saves);

      const result = await service.getSaveSlots(character.id);

      expect(result).toHaveLength(2);
      expect(result[0].slotNumber).toBe(1);
      expect(result[1].slotNumber).toBe(2);
    });

    it('각 저장 슬롯의 미리보기 정보를 포함해야 함', async () => {
      const character = createMockCharacter();
      const saves = [
        {
          ...SAMPLE_SAVE_STATE,
          gameState: {
            character: { level: 5, currentFloor: 3, hp: 100, maxHp: 150 },
          },
        },
      ];
      dbService.saveState.findMany.mockResolvedValue(saves);

      const result = await service.getSaveSlots(character.id);

      expect(result[0].preview).toBeDefined();
      expect(result[0].preview.level).toBe(5);
      expect(result[0].preview.floor).toBe(3);
      expect(result[0].preview.hp).toBe('100/150');
    });

    it('저장된 시간을 포함해야 함', async () => {
      const character = createMockCharacter();
      const now = new Date();
      const saves = [
        {
          ...SAMPLE_SAVE_STATE,
          updatedAt: now,
        },
      ];
      dbService.saveState.findMany.mockResolvedValue(saves);

      const result = await service.getSaveSlots(character.id);

      expect(result[0].savedAt).toBe(now);
    });
  });

  describe('loadGame', () => {
    it('저장된 게임을 불러올 수 있어야 함', async () => {
      const character = createMockCharacter();
      const save = SAMPLE_SAVE_STATE;
      dbService.saveState.findUnique.mockResolvedValue(save);
      dbService.character.update.mockResolvedValue(character);

      const result = await service.loadGame(save.id, character.id);

      expect(result).toHaveProperty('character');
      expect(result).toHaveProperty('inventory');
      expect(result).toHaveProperty('conversations');
      expect(result).toHaveProperty('message');
    });

    it('캐릭터 상태를 복원해야 함', async () => {
      const character = createMockCharacter();
      const save = {
        ...SAMPLE_SAVE_STATE,
        gameState: {
          character: {
            level: 10,
            exp: 5000,
            hp: 80,
            maxHp: 200,
            atk: 30,
            def: 25,
            currentFloor: 8,
            gold: 1000,
          },
          inventory: [],
          conversations: [],
        },
      };
      dbService.saveState.findUnique.mockResolvedValue(save);
      dbService.character.update.mockResolvedValue({
        ...character,
        level: 10,
        exp: 5000,
      });

      const result = await service.loadGame(save.id, character.id);

      expect(result.character.level).toBe(10);
      expect(result.character.exp).toBe(5000);
    });

    it('존재하지 않는 저장 파일은 NotFoundException을 throw해야 함', async () => {
      dbService.saveState.findUnique.mockResolvedValue(null);

      await expect(
        service.loadGame('non-existent', 'char-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('다른 캐릭터의 저장 파일을 불러올 수 없어야 함', async () => {
      const save = { ...SAMPLE_SAVE_STATE, characterId: 'other-char' };
      dbService.saveState.findUnique.mockResolvedValue(save);

      await expect(
        service.loadGame(save.id, 'char-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteSave', () => {
    it('저장 파일을 삭제할 수 있어야 함', async () => {
      const save = SAMPLE_SAVE_STATE;
      dbService.saveState.findUnique.mockResolvedValue(save);
      dbService.saveState.delete.mockResolvedValue(save);

      const result = await service.deleteSave(save.id, save.characterId);

      expect(result).toHaveProperty('message');
      expect(dbService.saveState.delete).toHaveBeenCalledWith({
        where: { id: save.id },
      });
    });

    it('존재하지 않는 저장 파일은 NotFoundException을 throw해야 함', async () => {
      dbService.saveState.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteSave('non-existent', 'char-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('다른 캐릭터의 저장 파일을 삭제할 수 없어야 함', async () => {
      const save = { ...SAMPLE_SAVE_STATE, characterId: 'other-char' };
      dbService.saveState.findUnique.mockResolvedValue(save);

      await expect(
        service.deleteSave(save.id, 'char-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('autoSave', () => {
    it('자동 저장을 할 수 있어야 함', async () => {
      const character = createMockCharacter();
      dbService.character.findUnique.mockResolvedValue(character);
      dbService.inventory.findMany.mockResolvedValue([]);
      dbService.conversation.findMany.mockResolvedValue([]);
      dbService.saveState.findUnique.mockResolvedValue(null);
      dbService.saveState.create.mockResolvedValue(SAMPLE_SAVE_STATE);

      const result = await service.autoSave(character.id, '전투 승리');

      expect(result).toBe(true);
      expect(dbService.saveState.create).toHaveBeenCalled();
    });

    it('자동 저장은 슬롯 6을 사용해야 함', async () => {
      const character = createMockCharacter();
      dbService.character.findUnique.mockResolvedValue(character);
      dbService.inventory.findMany.mockResolvedValue([]);
      dbService.conversation.findMany.mockResolvedValue([]);
      dbService.saveState.findUnique.mockResolvedValue(null);
      dbService.saveState.create.mockResolvedValue({
        ...SAMPLE_SAVE_STATE,
        slotNumber: 6,
      });

      await service.autoSave(character.id, '레벨업');

      const call = dbService.saveState.create.mock.calls[0][0];
      expect(call.data.slotNumber).toBe(6);
    });

    it('자동 저장 이름에 트리거를 포함해야 함', async () => {
      const character = createMockCharacter();
      dbService.character.findUnique.mockResolvedValue(character);
      dbService.inventory.findMany.mockResolvedValue([]);
      dbService.conversation.findMany.mockResolvedValue([]);
      dbService.saveState.findUnique.mockResolvedValue(null);
      dbService.saveState.create.mockResolvedValue(SAMPLE_SAVE_STATE);

      await service.autoSave(character.id, '전투 승리');

      const call = dbService.saveState.create.mock.calls[0][0];
      expect(call.data.saveName).toContain('전투 승리');
    });

    it('캐릭터가 없으면 조용히 실패해야 함', async () => {
      dbService.character.findUnique.mockResolvedValue(null);

      const result = await service.autoSave('non-existent', '테스트');

      expect(result).toBe(null);
    });

    it('에러 발생 시 조용히 실패해야 함', async () => {
      const character = createMockCharacter();
      dbService.character.findUnique.mockResolvedValue(character);
      dbService.inventory.findMany.mockRejectedValue(new Error('DB Error'));

      const result = await service.autoSave(character.id, '테스트');

      expect(result).toBe(false);
    });
  });

  describe('Save/Load flow', () => {
    it('저장 후 불러오기 시 동일한 상태를 복원해야 함', async () => {
      const character = createMockCharacter({
        level: 5,
        exp: 450,
        hp: 100,
        maxHp: 150,
        gold: 500,
      });
      const inventory = [createMockInventoryItem()];

      // 저장
      dbService.character.findUnique.mockResolvedValue(character);
      dbService.inventory.findMany.mockResolvedValue(inventory);
      dbService.conversation.findMany.mockResolvedValue([]);
      dbService.saveState.findUnique.mockResolvedValue(null);
      dbService.saveState.create.mockResolvedValue(SAMPLE_SAVE_STATE);

      const saveResult = await service.saveGame(character.id, 1);

      // 불러오기
      dbService.saveState.findUnique.mockResolvedValue(saveResult);
      dbService.character.update.mockResolvedValue(character);

      const loadResult = await service.loadGame(saveResult.id, character.id);

      expect(loadResult.character.level).toBe(5);
      expect(loadResult.character.gold).toBe(500);
    });
  });
});
