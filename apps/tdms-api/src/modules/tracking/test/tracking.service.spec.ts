import { TrackingService } from '../tracking.service.js';

describe('TrackingService', () => {
  let service: TrackingService;

  beforeEach(() => {
    service = new TrackingService();
  });

  it('should record valid location ping and update state', async () => {
    const state = await service.recordPing({
      driverId: 'driver-1',
      latitude: -6.2088,
      longitude: 106.8456,
      bearing: 90,
      speed: 35,
    });

    expect(state.driverId).toBe('driver-1');
    expect(state.latitude).toBe(-6.2088);
    expect(service.getDriverLocation('driver-1')).toEqual(state);
    expect(service.getAllActiveDrivers()).toHaveLength(1);
  });

  it('should reject fake mock GPS ping with security error', async () => {
    await expect(
      service.recordPing({
        driverId: 'driver-fraud',
        latitude: -6.2088,
        longitude: 106.8456,
        isMock: true,
      }),
    ).rejects.toThrow('Security violation');
  });
});
