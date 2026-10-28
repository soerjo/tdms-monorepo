import { DispatchService } from '../dispatch.service.js';

describe('DispatchService', () => {
  let service: DispatchService;
  let mockPrisma: any;
  let mockLedger: any;

  beforeEach(() => {
    mockPrisma = {
      deliveryTrip: {
        findUnique: () => ({
          id: 'trip-1',
          stops: [{ isCod: true, codAmount: 500000 }],
        }),
        update: (args: any) => ({ id: args.where.id, ...args.data }),
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
});
