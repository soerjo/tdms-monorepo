import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TrackingService } from './tracking.service.js';
import { LocationPingDto } from './dto/location-ping.dto.js';

@ApiTags('Tracking & Telemetry')
@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post('ping')
  @ApiOperation({ summary: 'Ingest courier live GPS location ping' })
  async ping(@Body() dto: LocationPingDto) {
    return this.trackingService.recordPing(dto);
  }

  @Get('drivers/:driverId')
  @ApiOperation({ summary: 'Get current courier live location' })
  async getDriverLocation(@Param('driverId') driverId: string) {
    return this.trackingService.getDriverLocation(driverId);
  }

  @Get('drivers')
  @ApiOperation({ summary: 'List all currently active couriers' })
  async listActiveDrivers() {
    return this.trackingService.getAllActiveDrivers();
  }
}
