import { Module } from '@nestjs/common';
import { RoutingService } from './routing.service.js';
import { RoutingController } from './routing.controller.js';

@Module({
  controllers: [RoutingController],
  providers: [RoutingService],
  exports: [RoutingService],
})
export class RoutingModule {}
