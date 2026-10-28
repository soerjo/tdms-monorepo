import { Module } from '@nestjs/common';
import { RoutingService } from './routing.service.js';
import { RoutingController } from './routing.controller.js';
import { H3CacheService } from './h3-cache.service.js';

@Module({
  controllers: [RoutingController],
  providers: [RoutingService, H3CacheService],
  exports: [RoutingService, H3CacheService],
})
export class RoutingModule {}
