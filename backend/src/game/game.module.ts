import { Module } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AiService } from '../ai/ai.service';
import { CharacterService } from './services/character.service';
import { BattleService } from './services/battle.service';
import { GameChatService } from './services/game-chat.service';
import { InventoryService } from './services/inventory.service';
import { SaveService } from './services/save.service';
import { CharacterController } from './controllers/character.controller';
import { BattleController } from './controllers/battle.controller';
import { GameChatController } from './controllers/game-chat.controller';
import { InventoryController } from './controllers/inventory.controller';
import { SaveController } from './controllers/save.controller';
import { RecordsController } from './controllers/records.controller';

@Module({
  controllers: [
    CharacterController,
    BattleController,
    GameChatController,
    InventoryController,
    SaveController,
    RecordsController,
  ],
  providers: [
    CharacterService,
    BattleService,
    GameChatService,
    InventoryService,
    SaveService,
    DatabaseService,
    AiService,
  ],
  exports: [
    CharacterService,
    BattleService,
    GameChatService,
    InventoryService,
    SaveService,
  ],
})
export class GameModule {}
