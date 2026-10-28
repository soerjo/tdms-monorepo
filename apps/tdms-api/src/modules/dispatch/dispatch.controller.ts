import { Controller, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DispatchService } from './dispatch.service.js';

@ApiTags('Dispatch')
@Controller('dispatch')
export class DispatchController {
  constructor(private readonly dispatchService: DispatchService) {}

  @Post('trips/:tripId/assign/:driverId')
  @ApiOperation({ summary: 'Assign trip to driver with distributed lock & COD limit check' })
  async assignTrip(
    @Param('tripId') tripId: string,
    @Param('driverId') driverId: string,
  ) {
    return this.dispatchService.assignTrip(tripId, driverId);
  }
}
