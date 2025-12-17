import { Injectable } from '@nestjs/common';

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

export interface Inventory {
  maxSlots: number;
  items: Item[];
}

@Injectable()
export class InventoryService {
  private maxSlotsPerCharacter = 20;

  /**
   * 빈 인벤토리 생성
   */
  createEmptyInventory(): Inventory {
    return {
      maxSlots: this.maxSlotsPerCharacter,
      items: [],
    };
  }

  /**
   * 아이템 추가
   */
  addItem(inventory: Inventory, item: Item): {
    success: boolean;
    message: string;
    inventory: Inventory;
  } {
    // 이미 존재하는 아이템인지 확인
    const existingItem = inventory.items.find(i => i.name === item.name);

    if (existingItem && item.type === 'consumable') {
      // 소비 아이템은 수량 증가
      existingItem.quantity += item.quantity;
      return {
        success: true,
        message: `${item.name} x${item.quantity}를 획득했습니다. (보유: ${existingItem.quantity}개)`,
        inventory,
      };
    }

    // 새 아이템 추가
    if (inventory.items.length >= inventory.maxSlots) {
      return {
        success: false,
        message: '인벤토리가 가득 찼습니다!',
        inventory,
      };
    }

    inventory.items.push({
      ...item,
      id: `item-${Date.now()}-${Math.random()}`,
    });

    return {
      success: true,
      message: `${item.name}를 획득했습니다.`,
      inventory,
    };
  }

  /**
   * 아이템 제거
   */
  removeItem(inventory: Inventory, itemId: string, quantity: number = 1): {
    success: boolean;
    message: string;
    inventory: Inventory;
  } {
    const itemIndex = inventory.items.findIndex(i => i.id === itemId);

    if (itemIndex === -1) {
      return {
        success: false,
        message: '해당 아이템을 찾을 수 없습니다.',
        inventory,
      };
    }

    const item = inventory.items[itemIndex];

    if (item.quantity <= quantity) {
      inventory.items.splice(itemIndex, 1);
      return {
        success: true,
        message: `${item.name}를 버렸습니다.`,
        inventory,
      };
    }

    item.quantity -= quantity;
    return {
      success: true,
      message: `${item.name} x${quantity}를 사용했습니다. (남은 수량: ${item.quantity}개)`,
      inventory,
    };
  }

  /**
   * 아이템 사용 (소비 아이템)
   */
  useConsumableItem(
    inventory: Inventory,
    itemId: string,
  ): {
    success: boolean;
    message: string;
    inventory: Inventory;
    effect?: { healthRestore?: number };
  } {
    const item = inventory.items.find(i => i.id === itemId);

    if (!item) {
      return {
        success: false,
        message: '해당 아이템을 찾을 수 없습니다.',
        inventory,
      };
    }

    if (item.type !== 'consumable') {
      return {
        success: false,
        message: '이 아이템은 사용할 수 없습니다.',
        inventory,
      };
    }

    const effect = {
      healthRestore: item.stats?.healthRestore || 30,
    };

    // 아이템 수량 감소
    const result = this.removeItem(inventory, itemId, 1);

    return {
      success: true,
      message: `${item.name}를 사용했습니다.`,
      inventory,
      effect,
    };
  }

  /**
   * 인벤토리 조회
   */
  getInventory(inventory: Inventory): Item[] {
    return inventory.items;
  }

  /**
   * 특정 아이템 조회
   */
  getItem(inventory: Inventory, itemId: string): Item | undefined {
    return inventory.items.find(i => i.id === itemId);
  }

  /**
   * 인벤토리 상태 조회
   */
  getInventoryStatus(inventory: Inventory): {
    totalSlots: number;
    usedSlots: number;
    percentage: number;
    items: Item[];
  } {
    return {
      totalSlots: inventory.maxSlots,
      usedSlots: inventory.items.length,
      percentage: Math.round((inventory.items.length / inventory.maxSlots) * 100),
      items: inventory.items,
    };
  }

  /**
   * 인벤토리 비우기
   */
  clearInventory(inventory: Inventory): Inventory {
    return {
      ...inventory,
      items: [],
    };
  }

  /**
   * 아이템 타입별 필터링
   */
  getItemsByType(inventory: Inventory, type: Item['type']): Item[] {
    return inventory.items.filter(item => item.type === type);
  }

  /**
   * 아이템 레어도별 필터링
   */
  getItemsByRarity(inventory: Inventory, rarity: Item['rarity']): Item[] {
    return inventory.items.filter(item => item.rarity === rarity);
  }

  /**
   * 특정 이름의 아이템 개수 반환
   */
  getItemCount(inventory: Inventory, itemName: string): number {
    const item = inventory.items.find(i => i.name === itemName);
    return item ? item.quantity : 0;
  }

  /**
   * AI 응답에서 감지한 아이템들을 인벤토리에 추가
   */
  addItemsFromResponse(
    inventory: Inventory,
    itemNames: string[],
  ): {
    inventory: Inventory;
    results: Array<{ name: string; success: boolean; message: string }>;
  } {
    const results: Array<{ name: string; success: boolean; message: string }> = [];

    const itemDefinitions: { [key: string]: Item } = {
      '생명 물약': {
        id: '',
        name: '생명 물약',
        type: 'consumable',
        rarity: 'common',
        quantity: 1,
        description: '체력을 30 회복시킨다.',
        stats: { healthRestore: 30 },
      },
      '마나 물약': {
        id: '',
        name: '마나 물약',
        type: 'consumable',
        rarity: 'common',
        quantity: 1,
        description: '마나를 30 회복시킨다.',
      },
      '검': {
        id: '',
        name: '검',
        type: 'weapon',
        rarity: 'common',
        quantity: 1,
        description: '기본 검',
        stats: { attack: 5 },
      },
      '갑옷': {
        id: '',
        name: '갑옷',
        type: 'armor',
        rarity: 'uncommon',
        quantity: 1,
        description: '기본 갑옷',
        stats: { defense: 10 },
      },
      '방패': {
        id: '',
        name: '방패',
        type: 'armor',
        rarity: 'uncommon',
        quantity: 1,
        description: '기본 방패',
        stats: { defense: 5 },
      },
      '목걸이': {
        id: '',
        name: '목걸이',
        type: 'treasure',
        rarity: 'rare',
        quantity: 1,
        description: '신비한 목걸이',
      },
      '반지': {
        id: '',
        name: '반지',
        type: 'treasure',
        rarity: 'rare',
        quantity: 1,
        description: '신비한 반지',
      },
      '보물': {
        id: '',
        name: '보물',
        type: 'treasure',
        rarity: 'epic',
        quantity: 1,
        description: '귀중한 보물',
      },
      '마법책': {
        id: '',
        name: '마법책',
        type: 'quest',
        rarity: 'rare',
        quantity: 1,
        description: '강력한 마법이 담긴 책',
      },
      '열쇠': {
        id: '',
        name: '열쇠',
        type: 'quest',
        rarity: 'common',
        quantity: 1,
        description: '미스터리한 열쇠',
      },
      '지도': {
        id: '',
        name: '지도',
        type: 'quest',
        rarity: 'uncommon',
        quantity: 1,
        description: '던전의 지도',
      },
    };

    for (const itemName of itemNames) {
      const itemDef = itemDefinitions[itemName];
      if (itemDef) {
        const result = this.addItem(inventory, itemDef);
        results.push({
          name: itemName,
          success: result.success,
          message: result.message,
        });
      }
    }

    return { inventory, results };
  }
}
