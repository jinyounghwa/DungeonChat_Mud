import { Module } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AiService } from '../ai/ai.service';
import { CharacterService } from './services/character.service';
import { BattleService } from './services/battle.service';
import { CharacterController } from './controllers/character.controller';
import { BattleController } from './controllers/battle.controller';

@Module({
  controllers: [CharacterController, BattleController],
  providers: [CharacterService, BattleService, DatabaseService, AiService],
  exports: [CharacterService, BattleService],
})
export class GameModule {}
