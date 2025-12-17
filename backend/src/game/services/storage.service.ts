import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

interface GameState {
  characterId: string;
  floor: number;
  health: number;
  maxHealth: number;
  experience: number;
  level: number;
  lastUpdated: string;
}

@Injectable()
export class StorageService {
  private dataDir = path.join(process.cwd(), 'data');

  constructor() {
    this.ensureDataDir();
  }

  private async ensureDataDir(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create data directory:', error);
    }
  }

  async saveGameState(characterId: string, state: GameState): Promise<void> {
    try {
      const filePath = path.join(this.dataDir, characterId + '.json');
      await fs.writeFile(filePath, JSON.stringify(state, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save game state:', error);
    }
  }

  async loadGameState(characterId: string): Promise<GameState | null> {
    try {
      const filePath = path.join(this.dataDir, characterId + '.json');
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  async deleteGameState(characterId: string): Promise<void> {
    try {
      const filePath = path.join(this.dataDir, characterId + '.json');
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Failed to delete game state:', error);
    }
  }
}
