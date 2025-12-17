import { Module } from '@nestjs/common';
import { GameChatController } from './controllers/game-chat.controller';
import { GameChatService } from './services/game-chat.service';
import { AiService } from './services/ai.service';
import { RagService } from './services/rag.service';
import { StorageService } from './services/storage.service';
import { GameStateAnalyzerService } from './services/game-state-analyzer.service';

@Module({
  controllers: [GameChatController],
  providers: [
    GameChatService,
    AiService,
    RagService,
    StorageService,
    GameStateAnalyzerService,
  ],
  exports: [
    GameChatService,
    AiService,
    RagService,
    StorageService,
    GameStateAnalyzerService,
  ],
})
export class GameModule {}
