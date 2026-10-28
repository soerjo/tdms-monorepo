import { Controller, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OutboxService } from './outbox.service.js';

@ApiTags('Transactional Outbox')
@Controller('outbox')
export class OutboxController {
  constructor(private readonly outboxService: OutboxService) {}

  @Post('poll')
  @ApiOperation({ summary: 'Trigger transactional outbox poller batch' })
  async poll(@Query('batchSize') batchSize?: number) {
    return this.outboxService.processPendingEvents(batchSize ? Number(batchSize) : 20);
  }
}
