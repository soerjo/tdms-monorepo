import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoutingService, RouteCoordinate } from './routing.service.js';

export class CalculateRouteDto {
  origin!: RouteCoordinate;
  destination!: RouteCoordinate;
  vehicleProfile?: 'motorcycle' | 'van';
}

@ApiTags('Routing')
@Controller('routing')
export class RoutingController {
  constructor(private readonly routingService: RoutingService) {}

  @Post('quote')
  @ApiOperation({ summary: 'Calculate route distance, duration and polyline with fallback' })
  async quote(@Body() dto: CalculateRouteDto) {
    return this.routingService.calculateRoute(
      dto.origin,
      dto.destination,
      dto.vehicleProfile ?? 'motorcycle',
    );
  }
}
