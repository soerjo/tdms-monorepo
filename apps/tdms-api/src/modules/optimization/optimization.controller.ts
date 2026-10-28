import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OptimizationService } from './optimization.service.js';
import { OptimizeTripDto } from './dto/optimize-trip.dto.js';

@ApiTags('Optimization & VRP')
@Controller('optimization')
export class OptimizationController {
  constructor(private readonly optimizationService: OptimizationService) {}

  @Post('solve')
  @ApiOperation({ summary: 'Solve VRPTW and capacity constraints using VROOM with fallback' })
  async solve(@Body() dto: OptimizeTripDto) {
    return this.optimizationService.solveVrptw(dto);
  }
}
