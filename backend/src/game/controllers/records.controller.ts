import { Controller, Get, Param, Query } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Controller('records')
export class RecordsController {
  constructor(private readonly db: DatabaseService) {}

  @Get('battles/:characterId')
  async getBattleRecords(
    @Param('characterId') characterId: string,
    @Query('limit') limit: string = '10',
    @Query('offset') offset: string = '0',
  ) {
    const limitNum = Math.min(parseInt(limit, 10), 100);
    const offsetNum = parseInt(offset, 10);

    const battles = await this.db.battleLog.findMany({
      where: { characterId },
      orderBy: { createdAt: 'desc' },
      take: limitNum,
      skip: offsetNum,
    });

    const total = await this.db.battleLog.count({
      where: { characterId },
    });

    return {
      success: true,
      data: {
        battles,
        total,
        page: Math.floor(offsetNum / limitNum) + 1,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  @Get('conversations/:characterId')
  async getConversations(
    @Param('characterId') characterId: string,
    @Query('limit') limit: string = '20',
    @Query('offset') offset: string = '0',
  ) {
    const limitNum = Math.min(parseInt(limit, 10), 100);
    const offsetNum = parseInt(offset, 10);

    const conversations = await this.db.conversation.findMany({
      where: { characterId },
      orderBy: { createdAt: 'desc' },
      take: limitNum,
      skip: offsetNum,
    });

    const total = await this.db.conversation.count({
      where: { characterId },
    });

    return {
      success: true,
      data: {
        conversations: conversations.reverse(),
        total,
        page: Math.floor(offsetNum / limitNum) + 1,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }
}
