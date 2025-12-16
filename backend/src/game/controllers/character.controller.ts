import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CharacterService } from '../services/character.service';
import { CreateCharacterDto } from '../dtos/create-character.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';

@Controller('characters')
export class CharacterController {
  constructor(private readonly characterService: CharacterService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createCharacter(
    @Request() req,
    @Body() createCharacterDto: CreateCharacterDto,
  ) {
    const character = await this.characterService.createCharacter(
      req.user.userId,
      createCharacterDto,
    );
    return {
      success: true,
      data: character,
    };
  }

  @Get(':id')
  async getCharacter(@Param('id') characterId: string) {
    const character = await this.characterService.getCharacter(characterId);
    return {
      success: true,
      data: character,
    };
  }

  @Get(':id/stats')
  async getCharacterStats(@Param('id') characterId: string) {
    const stats = await this.characterService.getCharacterStats(characterId);
    return {
      success: true,
      data: stats,
    };
  }
}
