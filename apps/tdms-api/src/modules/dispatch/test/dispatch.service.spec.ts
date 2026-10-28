import { DispatchService } from '../dispatch.service.js';

describe('DispatchService', () => {
  let service: DispatchService;
  let mockPrisma: any;
  let mockLedger: any;

  beforeEach(() => {
    mockPrisma = {
      $transaction: async (cb: any) => cb(mockPrisma),
      deliveryTrip: {
        findUnique: () => ({
          id: 'trip-1',
          driverId: 'driver-1',
          status: 'ASSIGNED',
          stops: [{ isCod: true, codAmount: 500000 }],
        }),
        update: (args: any) => ({ id: args.where.id, ...args.data }),
      },
      deliveryStatusHistory: {
        create: () => ({ id: 'hist-1' }),
      },
    };
    mockLedger = {
      getDriverCashInHand: async () => 1800000, // already holding 1.8M
    };
    service = new DispatchService(mockPrisma, mockLedger);
  });

  it('should reject assignment when driver cash-in-hand limit would be breached', async () => {
    // 1.8M + 500K = 2.3M > 2.0M
    await expect(service.assignTrip('trip-1', 'driver-1')).rejects.toThrow('melebihi batas');
  });

  it('should allow assignment when total cash is within safety limit', async () => {
    mockLedger.getDriverCashInHand = async () => 1000000; // holding 1.0M + 500K = 1.5M < 2.0M
    const res = await service.assignTrip('trip-1', 'driver-1');
    expect(res.id).toBe('trip-1');
    expect(res.driverId).toBe('driver-1');
  });

  it('should start trip transition from ASSIGNED to IN_TRANSIT', async () => {
    const res = await service.startTrip('trip-1', 'driver-1');
    expect(res.status).toBe('IN_TRANSIT');
  });

  it('should reject startTrip if unauthorized driver attempts start', async () => {
    await expect(service.startTrip('trip-1', 'driver-intruder')).rejects.toThrow('tidak terotorisasi');
  });
});
