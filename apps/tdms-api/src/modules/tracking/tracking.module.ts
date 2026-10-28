import { Module } from '@nestjs/common';
import { TrackingService } from './tracking.service.js';
import { TrackingController } from './tracking.controller.js';

@Module({
  controllers: [TrackingController],
  providers: [TrackingService],
  exports: [TrackingService],
})
export class TrackingModule {}
