import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { TripStatus } from '@prisma/client';

@Injectable()
export class DispatchService {
  private static readonly activeLocks = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService,
  ) {}

  async assignTrip(tripId: string, driverId: string) {
    const lockKey = `lock:trip:assign:${tripId}`;

    if (DispatchService.activeLocks.has(lockKey)) {
      throw new BadRequestException('Trip sedang dalam proses penugasan oleh driver lain');
    }

    DispatchService.activeLocks.add(lockKey);

    try {
      const trip = await this.prisma.deliveryTrip.findUnique({
        where: { id: tripId },
        include: { stops: true },
      });

      if (!trip) {
        throw new NotFoundException(`Trip dengan ID ${tripId} tidak ditemukan`);
      }

      // Hitung total COD dalam trip ini
      const totalTripCod = trip.stops.reduce((sum, stop) => {
        return stop.isCod ? sum + Number(stop.codAmount) : sum;
      }, 0);

      // Cek limit uang kas yang dibawa kurir
      const currentCash = await this.ledgerService.getDriverCashInHand(driverId);
      const MAX_CASH_LIMIT = 2000000; // Rp 2.000.000

      if (currentCash + totalTripCod > MAX_CASH_LIMIT) {
        throw new BadRequestException(
          `Penugasan ditolak: Total uang kas kurir (saat ini: Rp${currentCash} + trip: Rp${totalTripCod}) melebihi batas Rp${MAX_CASH_LIMIT}`,
        );
      }

      return await this.prisma.deliveryTrip.update({
        where: { id: tripId },
        data: {
          driverId,
          status: TripStatus.ASSIGNED,
        },
      });
    } finally {
      DispatchService.activeLocks.delete(lockKey);
    }
  }
}
