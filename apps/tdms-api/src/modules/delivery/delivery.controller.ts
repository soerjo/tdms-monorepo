import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service.js';
import { SubmitPodDto } from './dto/submit-pod.dto.js';
import { FailDeliveryDto } from './dto/fail-delivery.dto.js';
import { RtoHandoverDto } from './dto/rto-handover.dto.js';
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

  @Post('stops/:stopId/fail')
  @UseGuards(IdempotencyGuard)
  @ApiHeader({ name: 'Idempotency-Key', description: 'UUIDv4 string' })
  @ApiOperation({ summary: 'Record failed delivery attempt with standardized reason code and auto-RTO' })
  async failDelivery(
    @Param('stopId') stopId: string,
    @Body() dto: FailDeliveryDto,
  ) {
    return this.deliveryService.failDelivery(stopId, dto);
  }

  @Post('rto/orders/:orderId/handover')
  @UseGuards(IdempotencyGuard)
  @ApiHeader({ name: 'Idempotency-Key', description: 'UUIDv4 string' })
  @ApiOperation({ summary: 'Handover physical returned goods scan at destination Hub' })
  async handoverRto(
    @Param('orderId') orderId: string,
    @Body() dto: RtoHandoverDto,
  ) {
    return this.deliveryService.handoverRto(orderId, dto);
  }
}
