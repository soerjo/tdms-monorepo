import { Module } from '@nestjs/common';
import { OptimizationService } from './optimization.service.js';
import { OptimizationController } from './optimization.controller.js';

@Module({
  controllers: [OptimizationController],
  providers: [OptimizationService],
  exports: [OptimizationService],
})
export class OptimizationModule {}
