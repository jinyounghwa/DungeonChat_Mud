import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { BattleService } from '../services/battle.service';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';

@Controller('battles')
export class BattleController {
  constructor(private readonly battleService: BattleService) {}

  @Post('start')
  @UseGuards(JwtAuthGuard)
  async startBattle(@Body() body: { characterId: string }) {
    const result = await this.battleService.startBattle(body.characterId);
    return {
      success: true,
      data: result,
    };
  }

  @Post(':battleId/attack')
  @UseGuards(JwtAuthGuard)
  async attack(@Param('battleId') battleId: string) {
    const result = await this.battleService.attack(battleId);
    return {
      success: true,
      data: result,
    };
  }

  @Post(':battleId/defend')
  @UseGuards(JwtAuthGuard)
  async defend(@Param('battleId') battleId: string) {
    const result = await this.battleService.defend(battleId);
    return {
      success: true,
      data: result,
    };
  }

  @Post(':battleId/escape')
  @UseGuards(JwtAuthGuard)
  async escape(@Param('battleId') battleId: string) {
    const result = await this.battleService.escape(battleId);
    return {
      success: true,
      data: result,
    };
  }

  @Post(':battleId/finish')
  @UseGuards(JwtAuthGuard)
  async finishBattle(@Param('battleId') battleId: string) {
    const result = await this.battleService.finishBattle(battleId);
    return {
      success: true,
      data: result,
    };
  }
}
