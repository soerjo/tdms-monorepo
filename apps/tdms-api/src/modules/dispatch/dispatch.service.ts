import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { TripStatus } from '@prisma/client';
import { DeliveryStateMachine } from '../../common/state-machine/delivery-state-machine.js';

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

      // Validasi state machine trip
      DeliveryStateMachine.validateTripTransition(trip.status, TripStatus.ASSIGNED);

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

      return await this.prisma.$transaction(async (tx) => {
        const updatedTrip = await tx.deliveryTrip.update({
          where: { id: tripId },
          data: {
            driverId,
            status: TripStatus.ASSIGNED,
          },
        });

        await tx.deliveryStatusHistory.create({
          data: {
            entityType: 'TRIP',
            entityId: trip.id,
            oldStatus: trip.status,
            newStatus: TripStatus.ASSIGNED,
            actorId: driverId,
            reason: 'Driver assignment confirmed with COD check',
          },
        });

        return updatedTrip;
      });
    } finally {
      DispatchService.activeLocks.delete(lockKey);
    }
  }

  async startTrip(tripId: string, driverId: string) {
    const trip = await this.prisma.deliveryTrip.findUnique({
      where: { id: tripId },
    });

    if (!trip) {
      throw new NotFoundException(`Trip ${tripId} tidak ditemukan`);
    }

    if (trip.driverId !== driverId) {
      throw new BadRequestException('Driver tidak terotorisasi untuk memulai trip ini');
    }

    DeliveryStateMachine.validateTripTransition(trip.status, TripStatus.IN_TRANSIT);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.deliveryTrip.update({
        where: { id: tripId },
        data: { status: TripStatus.IN_TRANSIT },
      });

      await tx.deliveryStatusHistory.create({
        data: {
          entityType: 'TRIP',
          entityId: trip.id,
          oldStatus: trip.status,
          newStatus: TripStatus.IN_TRANSIT,
          actorId: driverId,
          reason: 'Courier departed from hub',
        },
      });

      return updated;
    });
  }
}
