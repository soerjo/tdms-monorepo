import { PricingService } from '../pricing.service.js';

describe('PricingService', () => {
  let service: PricingService;

  beforeEach(() => {
    service = new PricingService();
  });

  it('should calculate base motorcycle fare correctly within 3km', () => {
    const result = service.calculateFare({
      distanceMeters: 2500,
      durationSeconds: 600,
      vehicleType: 'MOTORCYCLE',
    });

    expect(result.baseFare).toBe(10000);
    expect(result.distanceFare).toBe(0);
    expect(result.weightSurcharge).toBe(0);
    expect(result.totalFare).toBe(10000);
  });

  it('should add billable distance and weight surcharge for van with peak hour multiplier', () => {
    const result = service.calculateFare({
      distanceMeters: 10000, // 10 km -> 7 billable km
      durationSeconds: 1800,
      vehicleType: 'VAN',
      weightGrams: 8000, // 3kg excess
      isPeakHour: true,
    });

    expect(result.baseFare).toBe(50000);
    expect(result.distanceFare).toBe(42000); // 7 * 6000
    expect(result.weightSurcharge).toBe(3000); // 3 * 1000
    expect(result.totalFare).toBe(118750);
  });

  it('should calculate base fare and distance for TRUCK_CDE', () => {
    const result = service.calculateFare({
      distanceMeters: 15000, // 15 km -> 12 billable km
      durationSeconds: 3600,
      vehicleType: 'TRUCK_CDE',
    });

    expect(result.baseFare).toBe(150000);
    expect(result.distanceFare).toBe(144000); // 12 * 12000
    expect(result.totalFare).toBe(294000);
  });
});
