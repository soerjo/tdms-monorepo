import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { StopStatus } from '@prisma/client';

export interface SubmitPodDto {
  stopId: string;
  driverId: string;
  latitude: number;
  longitude: number;
  podPhotoUrl: string;
  podSignatureUrl?: string;
  isMockGps?: boolean;
  idempotencyKey: string;
}

@Injectable()
export class DeliveryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService,
  ) {}

  async submitPod(dto: SubmitPodDto) {
    if (dto.isMockGps) {
      throw new BadRequestException('Pengiriman ditolak: Terdeteksi penggunaan Mock GPS pada perangkat');
    }

    const stop = await this.prisma.deliveryStop.findUnique({
      where: { id: dto.stopId },
      include: { trip: true },
    });

    if (!stop) {
      throw new NotFoundException(`Stop dengan ID ${dto.stopId} tidak ditemukan`);
    }

    if (stop.status === StopStatus.DELIVERED) {
      return stop;
    }

    // Hitung jarak Geofencing Haversine (Meter)
    const distanceMeters = this.calculateDistance(
      dto.latitude,
      dto.longitude,
      stop.latitude,
      stop.longitude,
    );

    const isGeofenceVerified = distanceMeters <= 50;
    if (!isGeofenceVerified) {
      throw new BadRequestException(
        `Gagal verifikasi Geofence: Jarak kurir (${distanceMeters.toFixed(1)}m) melebihi batas radius 50m`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedStop = await tx.deliveryStop.update({
        where: { id: dto.stopId },
        data: {
          status: StopStatus.DELIVERED,
          geofenceVerified: true,
          podPhotoUrl: dto.podPhotoUrl,
          podSignatureUrl: dto.podSignatureUrl,
          completedAt: new Date(),
        },
      });

      // Jika COD, catat piutang kas kurir ke Buku Besar
      if (stop.isCod && Number(stop.codAmount) > 0) {
        await this.ledgerService.postJournalEntry({
          transactionRefId: stop.orderId,
          entryType: 'COD_COLLECTION',
          description: `Penerimaan COD Order ${stop.orderId}`,
          idempotencyKey: `cod-${dto.idempotencyKey}`,
          lines: [
            {
              accountCode: '101-CASH-DRIVER',
              amount: Number(stop.codAmount),
              direction: 'DEBIT',
              driverId: dto.driverId,
              orderId: stop.orderId,
            },
            {
              accountCode: '201-MERCHANT-PAYABLE',
              amount: Number(stop.codAmount),
              direction: 'CREDIT',
              driverId: dto.driverId,
              orderId: stop.orderId,
            },
          ],
        });
      }

      // Catat ke Outbox Event
      await tx.outboxEvent.create({
        data: {
          aggregateType: 'DeliveryStop',
          aggregateId: stop.id,
          eventType: 'DeliveryPODSubmitted',
          topic: 'tdms.delivery.pod_submitted',
          payload: {
            stopId: stop.id,
            tripId: stop.tripId,
            orderId: stop.orderId,
            driverId: dto.driverId,
            status: 'DELIVERED',
            distanceMeters,
            isCod: stop.isCod,
            codAmount: stop.codAmount,
          },
        },
      });

      return updatedStop;
    });
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}
