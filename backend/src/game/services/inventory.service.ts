import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { getItemById, getItemsByType } from '../constants/items';

@Injectable()
export class InventoryService {
  constructor(private readonly db: DatabaseService) {}

  async getInventory(characterId: string) {
    const items = await this.db.inventory.findMany({
      where: { characterId },
      orderBy: { createdAt: 'asc' },
    });

    return items.map((item) => ({
      id: item.id,
      itemName: item.itemName,
      itemType: item.itemType,
      quantity: item.quantity,
      statsBonus: item.statsBonus,
      isEquipped: item.isEquipped,
    }));
  }

  async addItem(
    characterId: string,
    itemName: string,
    itemType: string,
    quantity: number = 1,
    statsBonus: any = {},
  ) {
    // Check if item already exists
    const existing = await this.db.inventory.findFirst({
      where: {
        characterId,
        itemName,
        itemType,
      },
    });

    if (existing && itemType === 'potion') {
      // Stack consumable items
      return this.db.inventory.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      });
    }

    // Create new inventory item
    return this.db.inventory.create({
      data: {
        characterId,
        itemName,
        itemType,
        quantity,
        statsBonus: statsBonus || {},
      },
    });
  }

  async useItem(characterId: string, inventoryItemId: string) {
    const character = await this.db.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      throw new NotFoundException('Character not found');
    }

    const item = await this.db.inventory.findUnique({
      where: { id: inventoryItemId },
    });

    if (!item || item.characterId !== characterId) {
      throw new NotFoundException('Item not found');
    }

    const template = getItemById(item.itemName.toLowerCase());

    if (!template) {
      throw new BadRequestException('Unknown item');
    }

    const statsBonus = item.statsBonus as Record<string, number>;
    let effect = {};

    // Apply item effects
    if (statsBonus.hpRestore) {
      const hpRestored = Math.min(
        statsBonus.hpRestore,
        character.maxHp - character.hp,
      );

      await this.db.character.update({
        where: { id: characterId },
        data: { hp: character.hp + hpRestored },
      });

      effect = { hpRestored };
    }

    // Decrease quantity
    if (item.quantity > 1) {
      await this.db.inventory.update({
        where: { id: inventoryItemId },
        data: { quantity: item.quantity - 1 },
      });
    } else {
      await this.db.inventory.delete({
        where: { id: inventoryItemId },
      });
    }

    return {
      itemUsed: item.itemName,
      effect,
      remainingQuantity: item.quantity - 1,
    };
  }

  async equipItem(characterId: string, inventoryItemId: string) {
    const item = await this.db.inventory.findUnique({
      where: { id: inventoryItemId },
    });

    if (!item || item.characterId !== characterId) {
      throw new NotFoundException('Item not found');
    }

    if (item.itemType !== 'weapon' && item.itemType !== 'armor') {
      throw new BadRequestException('Only weapons and armor can be equipped');
    }

    // Find and unequip the previous item of the same type
    const previousEquipped = await this.db.inventory.findFirst({
      where: {
        characterId,
        itemType: item.itemType,
        isEquipped: true,
        id: { not: inventoryItemId },
      },
    });

    if (previousEquipped) {
      await this.db.inventory.update({
        where: { id: previousEquipped.id },
        data: { isEquipped: false },
      });
    }

    // Equip the new item
    const equipped = await this.db.inventory.update({
      where: { id: inventoryItemId },
      data: { isEquipped: true },
    });

    // Update character stats
    const statsBonus = equipped.statsBonus as Record<string, number>;
    const updateData: any = {};

    if (statsBonus.atk) {
      if (previousEquipped) {
        const prevBonus = previousEquipped.statsBonus as Record<string, number>;
        updateData.atk = (await this.db.character.findUnique({
          where: { id: characterId },
        }))
          ?.atk - (prevBonus.atk || 0) + statsBonus.atk;
      } else {
        updateData.atk = (await this.db.character.findUnique({
          where: { id: characterId },
        }))
          ?.atk + statsBonus.atk;
      }
    }

    if (statsBonus.def) {
      if (previousEquipped) {
        const prevBonus = previousEquipped.statsBonus as Record<string, number>;
        updateData.def = (await this.db.character.findUnique({
          where: { id: characterId },
        }))
          ?.def - (prevBonus.def || 0) + statsBonus.def;
      } else {
        updateData.def = (await this.db.character.findUnique({
          where: { id: characterId },
        }))
          ?.def + statsBonus.def;
      }
    }

    if (Object.keys(updateData).length > 0) {
      await this.db.character.update({
        where: { id: characterId },
        data: updateData,
      });
    }

    return {
      equipped: equipped.itemName,
      statsChange: statsBonus,
      unequipped: previousEquipped?.itemName,
    };
  }

  async unequipItem(characterId: string, inventoryItemId: string) {
    const item = await this.db.inventory.findUnique({
      where: { id: inventoryItemId },
    });

    if (!item || item.characterId !== characterId || !item.isEquipped) {
      throw new BadRequestException('Item is not equipped');
    }

    // Unequip
    await this.db.inventory.update({
      where: { id: inventoryItemId },
      data: { isEquipped: false },
    });

    // Update character stats
    const statsBonus = item.statsBonus as Record<string, number>;
    const updateData: any = {};

    if (statsBonus.atk) {
      const character = await this.db.character.findUnique({
        where: { id: characterId },
      });
      updateData.atk = (character?.atk || 0) - statsBonus.atk;
    }

    if (statsBonus.def) {
      const character = await this.db.character.findUnique({
        where: { id: characterId },
      });
      updateData.def = (character?.def || 0) - statsBonus.def;
    }

    if (Object.keys(updateData).length > 0) {
      await this.db.character.update({
        where: { id: characterId },
        data: updateData,
      });
    }

    return {
      unequipped: item.itemName,
      statsChange: statsBonus,
    };
  }
}
