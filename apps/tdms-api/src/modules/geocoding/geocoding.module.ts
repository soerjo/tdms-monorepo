import { Module } from '@nestjs/common';
import { GeocodingService } from './geocoding.service.js';
import { GeocodingController } from './geocoding.controller.js';

@Module({
  controllers: [GeocodingController],
  providers: [GeocodingService],
  exports: [GeocodingService],
})
export class GeocodingModule {}
