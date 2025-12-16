import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { RagService } from './rag.service';

@Module({
  providers: [AiService, RagService],
  exports: [AiService, RagService],
})
export class AiModule {}
