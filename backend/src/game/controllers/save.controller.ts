import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SaveService } from '../services/save.service';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';

@Controller('game/saves')
export class SaveController {
  constructor(private readonly saveService: SaveService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async saveGame(
    @Request() req,
    @Body() body: { characterId: string; slotNumber: number; saveName?: string },
  ) {
    const result = await this.saveService.saveGame(
      body.characterId,
      body.slotNumber,
      body.saveName,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Get(':characterId')
  async getSaveSlots(@Param('characterId') characterId: string) {
    const saves = await this.saveService.getSaveSlots(characterId);
    return {
      success: true,
      data: saves,
    };
  }

  @Post('load/:saveId')
  @UseGuards(JwtAuthGuard)
  async loadGame(
    @Param('saveId') saveId: string,
    @Body() body: { characterId: string },
  ) {
    const result = await this.saveService.loadGame(saveId, body.characterId);
    return {
      success: true,
      data: result,
    };
  }

  @Delete(':saveId')
  @UseGuards(JwtAuthGuard)
  async deleteSave(
    @Param('saveId') saveId: string,
    @Body() body: { characterId: string },
  ) {
    const result = await this.saveService.deleteSave(saveId, body.characterId);
    return {
      success: true,
      data: result,
    };
  }
}
