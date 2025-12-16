import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class SaveService {
  constructor(private readonly db: DatabaseService) {}

  async saveGame(
    characterId: string,
    slotNumber: number,
    saveName?: string,
  ) {
    if (slotNumber < 1 || slotNumber > 5) {
      throw new BadRequestException('Slot number must be between 1 and 5');
    }

    const character = await this.db.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      throw new NotFoundException('Character not found');
    }

    // Get inventory and recent conversations
    const inventory = await this.db.inventory.findMany({
      where: { characterId },
    });

    const conversations = await this.db.conversation.findMany({
      where: { characterId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Create game state snapshot
    const gameState = {
      character: {
        id: character.id,
        name: character.name,
        class: character.class,
        level: character.level,
        exp: character.exp,
        hp: character.hp,
        maxHp: character.maxHp,
        atk: character.atk,
        def: character.def,
        currentFloor: character.currentFloor,
        gold: character.gold,
      },
      inventory: inventory.map((item) => ({
        id: item.id,
        itemName: item.itemName,
        itemType: item.itemType,
        quantity: item.quantity,
        isEquipped: item.isEquipped,
      })),
      conversations: conversations.map((conv) => ({
        role: conv.role,
        content: conv.content,
        createdAt: conv.createdAt,
      })),
    };

    // Find or create save state
    const existing = await this.db.saveState.findUnique({
      where: {
        characterId_slotNumber: {
          characterId,
          slotNumber,
        },
      },
    });

    if (existing) {
      return this.db.saveState.update({
        where: { id: existing.id },
        data: {
          saveName: saveName || existing.saveName,
          gameState,
        },
      });
    }

    return this.db.saveState.create({
      data: {
        characterId,
        slotNumber,
        saveName: saveName || `세이브 ${slotNumber}`,
        gameState,
      },
    });
  }

  async getSaveSlots(characterId: string) {
    const saves = await this.db.saveState.findMany({
      where: { characterId },
      orderBy: { slotNumber: 'asc' },
    });

    return saves.map((save) => ({
      id: save.id,
      slotNumber: save.slotNumber,
      saveName: save.saveName,
      preview: {
        level: (save.gameState as any).character?.level,
        floor: (save.gameState as any).character?.currentFloor,
        hp: `${(save.gameState as any).character?.hp}/${(save.gameState as any).character?.maxHp}`,
      },
      savedAt: save.updatedAt,
    }));
  }

  async loadGame(saveId: string, characterId: string) {
    const save = await this.db.saveState.findUnique({
      where: { id: saveId },
    });

    if (!save || save.characterId !== characterId) {
      throw new NotFoundException('Save file not found');
    }

    const gameState = save.gameState as any;

    // Update character
    await this.db.character.update({
      where: { id: characterId },
      data: {
        level: gameState.character.level,
        exp: gameState.character.exp,
        hp: gameState.character.hp,
        maxHp: gameState.character.maxHp,
        atk: gameState.character.atk,
        def: gameState.character.def,
        currentFloor: gameState.character.currentFloor,
        gold: gameState.character.gold,
      },
    });

    return {
      character: gameState.character,
      inventory: gameState.inventory,
      conversations: gameState.conversations,
      message: '게임을 불러왔습니다.',
    };
  }

  async deleteSave(saveId: string, characterId: string) {
    const save = await this.db.saveState.findUnique({
      where: { id: saveId },
    });

    if (!save || save.characterId !== characterId) {
      throw new NotFoundException('Save file not found');
    }

    await this.db.saveState.delete({
      where: { id: saveId },
    });

    return { message: '저장 데이터가 삭제되었습니다.' };
  }

  // Auto-save function (triggered on battle victory, level up, floor change)
  async autoSave(characterId: string, trigger: string = '자동 저장') {
    try {
      // Use slot 0 for auto-save (overwrite each time)
      // Change to slot 6 (beyond user-accessible slots 1-5) for persistent auto-save
      const autoSaveSlot = 6;

      const character = await this.db.character.findUnique({
        where: { id: characterId },
      });

      if (!character) {
        return null; // Silently fail for auto-save
      }

      const inventory = await this.db.inventory.findMany({
        where: { characterId },
      });

      const conversations = await this.db.conversation.findMany({
        where: { characterId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      const gameState = {
        character: {
          id: character.id,
          name: character.name,
          class: character.class,
          level: character.level,
          exp: character.exp,
          hp: character.hp,
          maxHp: character.maxHp,
          atk: character.atk,
          def: character.def,
          currentFloor: character.currentFloor,
          gold: character.gold,
        },
        inventory: inventory.map((item) => ({
          id: item.id,
          itemName: item.itemName,
          itemType: item.itemType,
          quantity: item.quantity,
          isEquipped: item.isEquipped,
        })),
        conversations: conversations.map((conv) => ({
          role: conv.role,
          content: conv.content,
          createdAt: conv.createdAt,
        })),
      };

      const existing = await this.db.saveState.findUnique({
        where: {
          characterId_slotNumber: {
            characterId,
            slotNumber: autoSaveSlot,
          },
        },
      });

      if (existing) {
        await this.db.saveState.update({
          where: { id: existing.id },
          data: {
            saveName: `${trigger} - ${new Date().toLocaleTimeString('ko-KR')}`,
            gameState,
          },
        });
      } else {
        await this.db.saveState.create({
          data: {
            characterId,
            slotNumber: autoSaveSlot,
            saveName: `${trigger} - ${new Date().toLocaleTimeString('ko-KR')}`,
            gameState,
          },
        });
      }

      return true;
    } catch (error) {
      // Silently fail for auto-save to not interrupt game flow
      return false;
    }
  }
}
