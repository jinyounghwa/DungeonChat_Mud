import { Injectable } from '@nestjs/common';

interface GameContext {
  text: string;
  timestamp: number;
}

@Injectable()
export class RagService {
  private contexts = new Map<string, GameContext[]>();
  private maxMemory = parseInt(process.env.MAX_CONTEXT_MEMORY || '10');
  private contextTimeout = parseInt(process.env.CONTEXT_TIMEOUT || '3600') * 1000;

  async storeContext(characterId: string, text: string): Promise<void> {
    if (!this.contexts.has(characterId)) {
      this.contexts.set(characterId, []);
    }

    const contexts = this.contexts.get(characterId)!;
    contexts.push({
      text,
      timestamp: Date.now(),
    });

    if (contexts.length > this.maxMemory) {
      contexts.shift();
    }

    this.cleanupOldContexts(characterId);
  }

  getContext(characterId: string, count: number = 5): string {
    const contexts = this.contexts.get(characterId) || [];
    return contexts
      .slice(-count)
      .map(ctx => ctx.text)
      .join('\n---\n');
  }

  private cleanupOldContexts(characterId: string): void {
    const contexts = this.contexts.get(characterId);
    if (!contexts) return;

    const now = Date.now();
    const filtered = contexts.filter(ctx => now - ctx.timestamp < this.contextTimeout);
    this.contexts.set(characterId, filtered);
  }

  clearContext(characterId: string): void {
    this.contexts.delete(characterId);
  }
}
