import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { GameChatService } from '../services/game-chat.service';

@Controller('game')
export class GameChatController {
  constructor(private gameChatService: GameChatService) {}

  @Post('chat')
  async chat(
    @Body() body: { characterId: string; message: string },
  ) {
    const result = await this.gameChatService.processMessage(
      body.characterId,
      body.message,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Get('state/:characterId')
  getGameState(@Param('characterId') characterId: string) {
    const state = this.gameChatService.getGameState(characterId);
    return {
      success: !!state,
      data: state || null,
    };
  }

  @Post('clear/:characterId')
  async clearCharacter(@Param('characterId') characterId: string) {
    await this.gameChatService.clearCharacterData(characterId);
    return {
      success: true,
      message: 'Character data cleared',
    };
  }
}
