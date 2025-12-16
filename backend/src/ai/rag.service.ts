import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChromaClient } from 'chromadb';

interface QueryOptions {
  limit?: number;
  includeConversations?: boolean;
  includeBattles?: boolean;
  includeCharacterState?: boolean;
}

@Injectable()
export class RagService {
  private client: ChromaClient;
  private readonly logger = new Logger(RagService.name);
  private initialized = false;

  constructor(private configService: ConfigService) {}

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const chromaUrl = this.configService.get<string>(
        'CHROMA_URL',
        'http://localhost:8000',
      );

      this.client = new ChromaClient({
        path: chromaUrl,
      });

      // Initialize collections
      await this.initializeCollections();
      this.initialized = true;
      this.logger.log('RAG service initialized successfully');
    } catch (error) {
      this.logger.warn(
        `Failed to initialize RAG service: ${error.message}. RAG will be disabled.`,
      );
      this.initialized = false;
    }
  }

  private async initializeCollections(): Promise<void> {
    try {
      // Create or get collections
      await this.client.getOrCreateCollection({
        name: 'dungeonchat_conversations',
        metadata: { description: 'Game conversations and narratives' },
      });

      await this.client.getOrCreateCollection({
        name: 'dungeonchat_game_events',
        metadata: { description: 'Battle results, level-ups, and game events' },
      });

      await this.client.getOrCreateCollection({
        name: 'dungeonchat_character_snapshots',
        metadata: { description: 'Character state snapshots' },
      });
    } catch (error) {
      this.logger.warn(`Failed to initialize collections: ${error.message}`);
    }
  }

  async embedConversation(
    characterId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      if (!this.initialized) await this.initialize();
      if (!this.initialized) return;

      const collection = await this.client.getOrCreateCollection({
        name: 'dungeonchat_conversations',
      });

      const documentId = `conv_${characterId}_${Date.now()}_${Math.random()}`;

      await collection.add({
        ids: [documentId],
        documents: [content],
        metadatas: [
          {
            characterId,
            role,
            timestamp: new Date().toISOString(),
            ...metadata,
          },
        ],
      });
    } catch (error) {
      this.logger.warn(
        `Failed to embed conversation: ${error.message}. Continuing without RAG.`,
      );
    }
  }

  async embedGameEvent(
    characterId: string,
    eventType: string,
    summary: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      if (!this.initialized) await this.initialize();
      if (!this.initialized) return;

      const collection = await this.client.getOrCreateCollection({
        name: 'dungeonchat_game_events',
      });

      const documentId = `event_${characterId}_${Date.now()}_${Math.random()}`;

      await collection.add({
        ids: [documentId],
        documents: [summary],
        metadatas: [
          {
            characterId,
            eventType,
            timestamp: new Date().toISOString(),
            ...metadata,
          },
        ],
      });
    } catch (error) {
      this.logger.warn(
        `Failed to embed game event: ${error.message}. Continuing without RAG.`,
      );
    }
  }

  async embedCharacterSnapshot(
    characterId: string,
    description: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      if (!this.initialized) await this.initialize();
      if (!this.initialized) return;

      const collection = await this.client.getOrCreateCollection({
        name: 'dungeonchat_character_snapshots',
      });

      const documentId = `snapshot_${characterId}_${Date.now()}`;

      await collection.add({
        ids: [documentId],
        documents: [description],
        metadatas: [
          {
            characterId,
            timestamp: new Date().toISOString(),
            ...metadata,
          },
        ],
      });
    } catch (error) {
      this.logger.warn(
        `Failed to embed character snapshot: ${error.message}. Continuing without RAG.`,
      );
    }
  }

  async queryContext(
    characterId: string,
    queryText: string,
    options: QueryOptions = {},
  ): Promise<string> {
    try {
      if (!this.initialized) await this.initialize();
      if (!this.initialized) return '';

      const {
        limit = 5,
        includeConversations = true,
        includeBattles = true,
      } = options;

      const contextParts: string[] = [];

      // Query conversations
      if (includeConversations) {
        const conversationCollection =
          await this.client.getOrCreateCollection({
            name: 'dungeonchat_conversations',
          });

        const conversationResults = await conversationCollection.query({
          queryTexts: [queryText],
          nResults: Math.ceil(limit / 2),
          where: {
            characterId: characterId,
          },
        });

        if (
          conversationResults.documents &&
          conversationResults.documents[0]
        ) {
          const relevantConversations = conversationResults.documents[0]
            .slice(0, Math.ceil(limit / 2))
            .join('\n');
          if (relevantConversations) {
            contextParts.push(
              `Recent Conversations:\n${relevantConversations}`,
            );
          }
        }
      }

      // Query game events
      if (includeBattles) {
        const eventCollection = await this.client.getOrCreateCollection({
          name: 'dungeonchat_game_events',
        });

        const eventResults = await eventCollection.query({
          queryTexts: [queryText],
          nResults: Math.ceil(limit / 2),
          where: {
            characterId: characterId,
          },
        });

        if (eventResults.documents && eventResults.documents[0]) {
          const relevantEvents = eventResults.documents[0]
            .slice(0, Math.ceil(limit / 2))
            .join('\n');
          if (relevantEvents) {
            contextParts.push(`Recent Events:\n${relevantEvents}`);
          }
        }
      }

      return contextParts.length > 0 ? contextParts.join('\n\n') : '';
    } catch (error) {
      this.logger.warn(
        `Failed to query context: ${error.message}. Continuing without RAG.`,
      );
      return '';
    }
  }

  async deleteCharacterContext(characterId: string): Promise<void> {
    try {
      if (!this.initialized) await this.initialize();
      if (!this.initialized) return;

      const collections = [
        'dungeonchat_conversations',
        'dungeonchat_game_events',
        'dungeonchat_character_snapshots',
      ];

      for (const collectionName of collections) {
        const collection = await this.client.getOrCreateCollection({
          name: collectionName,
        });

        try {
          const results = await collection.get({
            where: {
              characterId: characterId,
            },
          });

          if (results.ids && results.ids.length > 0) {
            await collection.delete({
              ids: results.ids,
            });
          }
        } catch (error) {
          this.logger.warn(
            `Failed to delete from ${collectionName}: ${error.message}`,
          );
        }
      }
    } catch (error) {
      this.logger.warn(
        `Failed to delete character context: ${error.message}`,
      );
    }
  }
}
