import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { GameChatService } from '../services/game-chat.service';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';

@Controller('game')
export class GameChatController {
  constructor(private readonly gameChatService: GameChatService) {}

  @Post('chat')
  @UseGuards(JwtAuthGuard)
  async chat(
    @Body()
    body: {
      characterId: string;
      message: string;
      context?: any;
    },
  ) {
    const result = await this.gameChatService.processMessage(
      body.characterId,
      body.message,
      body.context,
    );

    return {
      success: true,
      data: result,
    };
  }

  @Get('conversations/:characterId')
  @UseGuards(JwtAuthGuard)
  async getConversations(
    @Param('characterId') characterId: string,
    @Query('limit') limit: string = '20',
  ) {
    const conversations = await this.gameChatService.getConversationHistory(
      characterId,
      parseInt(limit, 10),
    );

    return {
      success: true,
      data: {
        conversations,
        total: conversations.length,
      },
    };
  }
}
