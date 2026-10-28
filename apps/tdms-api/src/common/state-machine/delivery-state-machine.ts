import { BadRequestException } from '@nestjs/common';
import { TripStatus, StopStatus } from '@prisma/client';

export class DeliveryStateMachine {
  private static readonly allowedTripTransitions: Record<TripStatus, TripStatus[]> = {
    [TripStatus.ASSIGNED]: [TripStatus.IN_TRANSIT, TripStatus.CANCELLED],
    [TripStatus.IN_TRANSIT]: [TripStatus.COMPLETED, TripStatus.CANCELLED],
    [TripStatus.COMPLETED]: [],
    [TripStatus.CANCELLED]: [],
  };

  private static readonly allowedStopTransitions: Record<StopStatus, StopStatus[]> = {
    [StopStatus.PENDING]: [StopStatus.ARRIVED, StopStatus.FAILED],
    [StopStatus.ARRIVED]: [StopStatus.DELIVERED, StopStatus.FAILED],
    [StopStatus.DELIVERED]: [],
    [StopStatus.FAILED]: [StopStatus.RTO, StopStatus.PENDING], // PENDING for re-attempt
    [StopStatus.RTO]: [],
  };

  static validateTripTransition(currentStatus: TripStatus, nextStatus: TripStatus): void {
    if (currentStatus === nextStatus) return;
    const allowed = this.allowedTripTransitions[currentStatus] || [];
    if (!allowed.includes(nextStatus)) {
      throw new BadRequestException(
        `Transisi Trip tidak valid: Tidak dapat mengubah status Trip dari '${currentStatus}' ke '${nextStatus}'`,
      );
    }
  }

  static validateStopTransition(
    currentStatus: StopStatus,
    nextStatus: StopStatus,
    tripStatus?: TripStatus,
  ): void {
    if (currentStatus === nextStatus) return;

    // Invariant: Stop tidak boleh diselesaikan jika Trip belum IN_TRANSIT
    if (tripStatus && tripStatus !== TripStatus.IN_TRANSIT && nextStatus === StopStatus.DELIVERED) {
      throw new BadRequestException(
        `Integritas Pengiriman Gagal: Stop tidak dapat ditandai DELIVERED saat status Trip masih '${tripStatus}'. Trip harus 'IN_TRANSIT'.`,
      );
    }

    const allowed = this.allowedStopTransitions[currentStatus] || [];
    if (!allowed.includes(nextStatus)) {
      throw new BadRequestException(
        `Transisi Stop tidak valid: Tidak dapat mengubah status Stop dari '${currentStatus}' ke '${nextStatus}'`,
      );
    }
  }
}
