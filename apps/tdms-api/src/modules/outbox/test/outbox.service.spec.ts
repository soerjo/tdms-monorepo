import { OutboxService } from '../outbox.service.js';

describe('OutboxService', () => {
  let service: OutboxService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      outboxEvent: {
        create: (args: any) => ({ id: 'outbox-1', ...args.data }),
        findMany: () => [
          { id: 'event-1', eventType: 'TripOptimized', topic: 'tdms.trip.optimized', attemptCount: 0 },
        ],
        update: () => ({}),
      },
    };
    service = new OutboxService(mockPrisma);
  });

  it('should enqueue event to outbox table', async () => {
    const res = await service.enqueueEvent({
      aggregateType: 'Trip',
      aggregateId: 'trip-1',
      eventType: 'TripOptimized',
      topic: 'tdms.trip.optimized',
      payload: { tripId: 'trip-1' },
    });

    expect(res.id).toBe('outbox-1');
    expect(res.status).toBe('PENDING');
  });

  it('should process pending outbox events successfully', async () => {
    const res = await service.processPendingEvents(10);
    expect(res.processed).toBe(1);
    expect(res.failed).toBe(0);
    expect(res.deadLettered).toBe(0);
  });

  it('should move poison event to DEAD_LETTER after exceeding max retry attempts', async () => {
    mockPrisma.outboxEvent.findMany = () => [
      { id: 'poison-event', eventType: 'CorruptEvent', topic: 'tdms.corrupt', attemptCount: 5 },
    ];

    const res = await service.processPendingEvents(10);
    expect(res.deadLettered).toBe(1);
    expect(res.processed).toBe(0);
  });
});
