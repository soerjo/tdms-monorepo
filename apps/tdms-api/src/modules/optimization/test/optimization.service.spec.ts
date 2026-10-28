import { OptimizationService } from '../optimization.service.js';
import { ConfigService } from '@nestjs/config';

describe('OptimizationService', () => {
  let service: OptimizationService;
  let configService: ConfigService;

  beforeEach(() => {
    configService = {
      get: (_key: string, defaultValue?: any) => defaultValue,
    } as any;
    service = new OptimizationService(configService);
  });

  it('should solve VRPTW using sequential fallback when VROOM is offline', async () => {
    const res = await service.solveVrptw({
      vehicles: [
        {
          id: 1,
          profile: 'motorcycle',
          startLocation: [106.8272, -6.1754],
          capacity: { weightGrams: 50000, volumeCm3: 200000 },
        },
      ],
      jobs: [
        {
          orderId: 'ORD-101',
          location: [106.8456, -6.2088],
          serviceTimeSeconds: 300,
          weightGrams: 2000,
          volumeCm3: 5000,
        },
      ],
    });

    expect(res).toBeDefined();
    expect(res.routes).toHaveLength(1);
    expect(res.routes[0].steps).toHaveLength(2); // start + 1 job
    expect(res.routes[0].steps[1].orderId).toBe('ORD-101');
  });
});
