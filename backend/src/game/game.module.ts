import { Module } from '@nestjs/common';
import { GameChatController } from './controllers/game-chat.controller';
import { GameChatService } from './services/game-chat.service';
import { AiService } from './services/ai.service';
import { RagService } from './services/rag.service';
import { StorageService } from './services/storage.service';

@Module({
  controllers: [GameChatController],
  providers: [GameChatService, AiService, RagService, StorageService],
  exports: [GameChatService, AiService, RagService, StorageService],
})
export class GameModule {}
