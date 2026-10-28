import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GeocodingService } from './geocoding.service.js';
import { ForwardGeocodeDto, SnapCoordinateDto } from './dto/geocode.dto.js';

@ApiTags('Geocoding & Address Snapping')
@Controller('geocoding')
export class GeocodingController {
  constructor(private readonly geocodingService: GeocodingService) {}

  @Post('forward')
  @ApiOperation({ summary: 'Convert raw address string into WGS84 GPS coordinates' })
  async forward(@Body() dto: ForwardGeocodeDto) {
    return this.geocodingService.forwardGeocode(dto);
  }

  @Post('snap')
  @ApiOperation({ summary: 'Snap GPS coordinate to nearest drivable road segment via OSRM /nearest' })
  async snap(@Body() dto: SnapCoordinateDto) {
    return this.geocodingService.snapToRoad(dto);
  }
}
