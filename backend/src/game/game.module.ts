import { Module } from '@nestjs/common';
import { GameChatController } from './controllers/game-chat.controller';
import { GameChatService } from './services/game-chat.service';
import { AiService } from './services/ai.service';
import { RagService } from './services/rag.service';
import { StorageService } from './services/storage.service';
import { GameStateAnalyzerService } from './services/game-state-analyzer.service';
import { GameDocumentationRagService } from './services/game-documentation-rag.service';
import { InventoryService } from './services/inventory.service';
import { ChoiceParserService } from './services/choice-parser.service';

@Module({
  controllers: [GameChatController],
  providers: [
    GameChatService,
    AiService,
    RagService,
    StorageService,
    GameStateAnalyzerService,
    GameDocumentationRagService,
    InventoryService,
    ChoiceParserService,
  ],
  exports: [
    GameChatService,
    AiService,
    RagService,
    StorageService,
    GameStateAnalyzerService,
    GameDocumentationRagService,
    InventoryService,
    ChoiceParserService,
  ],
})
export class GameModule {}
