import { Module } from '@nestjs/common';
import { OutboxService } from './outbox.service.js';
import { OutboxController } from './outbox.controller.js';

@Module({
  controllers: [OutboxController],
  providers: [OutboxService],
  exports: [OutboxService],
})
export class OutboxModule {}
