import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { InventoryService } from '../services/inventory.service';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get(':characterId')
  async getInventory(@Param('characterId') characterId: string) {
    const items = await this.inventoryService.getInventory(characterId);
    return {
      success: true,
      data: items,
    };
  }

  @Post('use')
  @UseGuards(JwtAuthGuard)
  async useItem(
    @Request() req,
    @Body() body: { characterId: string; inventoryItemId: string },
  ) {
    const result = await this.inventoryService.useItem(
      body.characterId,
      body.inventoryItemId,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Post('equip')
  @UseGuards(JwtAuthGuard)
  async equipItem(
    @Request() req,
    @Body() body: { characterId: string; inventoryItemId: string },
  ) {
    const result = await this.inventoryService.equipItem(
      body.characterId,
      body.inventoryItemId,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Post('unequip')
  @UseGuards(JwtAuthGuard)
  async unequipItem(
    @Request() req,
    @Body() body: { characterId: string; inventoryItemId: string },
  ) {
    const result = await this.inventoryService.unequipItem(
      body.characterId,
      body.inventoryItemId,
    );
    return {
      success: true,
      data: result,
    };
  }
}
