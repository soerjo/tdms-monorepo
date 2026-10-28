import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service.js';
import { SubmitPodDto } from './dto/submit-pod.dto.js';
import { IdempotencyGuard } from '../../common/guards/idempotency.guard.js';

@ApiTags('Delivery & POD')
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post('pod')
  @UseGuards(IdempotencyGuard)
  @ApiHeader({ name: 'Idempotency-Key', description: 'UUIDv4 string' })
  @ApiOperation({ summary: 'Submit e-POD with geofence validation & automatic COD ledger posting' })
  async submitPod(@Body() dto: SubmitPodDto) {
    return this.deliveryService.submitPod(dto);
  }
}
