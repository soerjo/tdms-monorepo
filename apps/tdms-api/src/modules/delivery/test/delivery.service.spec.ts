import { DeliveryService } from '../delivery.service.js';

describe('DeliveryService', () => {
  let service: DeliveryService;
  let mockPrisma: any;
  let mockLedger: any;

  beforeEach(() => {
    mockPrisma = {
      $transaction: async (cb: any) => cb(mockPrisma),
      deliveryStop: {
        findUnique: () => ({
          id: 'stop-1',
          orderId: 'ORD-1',
          tripId: 'trip-1',
          latitude: -6.2088,
          longitude: 106.8456,
          isCod: true,
          codAmount: 150000,
          status: 'PENDING',
        }),
        findMany: () => [
          { id: 'stop-rto-1', orderId: 'ORD-RTO', status: 'RTO' },
        ],
        update: (args: any) => ({ id: args.where.id, ...args.data }),
        count: () => 1, // 1 prior failure -> next will trigger RTO
      },
      outboxEvent: {
        create: () => ({ id: 'outbox-1' }),
      },
    };
    mockLedger = {
      postJournalEntry: async () => ({ id: 'journal-cod' }),
    };
    service = new DeliveryService(mockPrisma, mockLedger);
  });

  it('should reject POD submission if mock GPS is detected', async () => {
    await expect(
      service.submitPod({
        stopId: 'stop-1',
        driverId: 'driver-1',
        latitude: -6.2088,
        longitude: 106.8456,
        podPhotoUrl: 'https://img.url',
        isMockGps: true,
        idempotencyKey: 'idemp-pod-1',
      }),
    ).rejects.toThrow('Mock GPS');
  });

  it('should reject POD if courier is outside 50m geofence radius', async () => {
    await expect(
      service.submitPod({
        stopId: 'stop-1',
        driverId: 'driver-1',
        latitude: -6.215,
        longitude: 106.8456,
        podPhotoUrl: 'https://img.url',
        idempotencyKey: 'idemp-pod-2',
      }),
    ).rejects.toThrow('melebihi batas radius 50m');
  });

  it('should successfully submit POD when within geofence radius', async () => {
    const res = await service.submitPod({
      stopId: 'stop-1',
      driverId: 'driver-1',
      latitude: -6.208801, // ~10cm away
      longitude: 106.8456,
      podPhotoUrl: 'https://img.url',
      idempotencyKey: 'idemp-pod-3',
    });

    expect(res.status).toBe('DELIVERED');
    expect(res.geofenceVerified).toBe(true);
  });

  it('should trigger RTO on second delivery failure', async () => {
    const res = await service.failDelivery('stop-1', {
      reasonCode: 'HOUSE_EMPTY',
      evidencePhotoUrl: 'https://img.fail',
      idempotencyKey: 'idemp-fail-1',
    });

    expect(res.rtoTriggered).toBe(true);
    expect(res.attemptNumber).toBe(2);
    expect(res.stop.status).toBe('RTO');
  });

  it('should complete physical RTO handover scan at hub', async () => {
    const res = await service.handoverRto('ORD-RTO', {
      hubId: 'HUB-JKT-01',
      receivedBy: 'OFFICER-01',
      idempotencyKey: 'idemp-handover',
    });

    expect(res.success).toBe(true);
    expect(res.hubId).toBe('HUB-JKT-01');
  });
});
