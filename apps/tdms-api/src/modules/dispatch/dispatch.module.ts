import { Module } from '@nestjs/common';
import { DispatchService } from './dispatch.service.js';
import { DispatchController } from './dispatch.controller.js';
import { LedgerModule } from '../ledger/ledger.module.js';

@Module({
  imports: [LedgerModule],
  controllers: [DispatchController],
  providers: [DispatchService],
  exports: [DispatchService],
})
export class DispatchModule {}
