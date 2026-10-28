import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PricingService } from './pricing.service.js';
import { CalculateFareDto } from './dto/calculate-fare.dto.js';

@ApiTags('Pricing & Dynamic Fares')
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Post('quote')
  @ApiOperation({ summary: 'Calculate dynamic delivery fare based on distance, vehicle and weight' })
  quote(@Body() dto: CalculateFareDto) {
    return this.pricingService.calculateFare(dto);
  }
}
