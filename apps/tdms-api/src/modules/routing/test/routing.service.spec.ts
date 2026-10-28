import { RoutingService } from '../routing.service.js';
import { ConfigService } from '@nestjs/config';

describe('RoutingService', () => {
  let service: RoutingService;
  let configService: ConfigService;

  beforeEach(() => {
    configService = {
      get: (key: string, defaultValue?: any) => {
        if (key === 'OSRM_URL') return 'http://127.0.0.1:59999'; // unreachable port
        return defaultValue;
      },
    } as any;
    service = new RoutingService(configService);
  });

  it('should calculate route via Haversine fallback when OSRM is offline', async () => {
    const origin = { latitude: -6.1754, longitude: 106.8272 }; // Monas
    const destination = { latitude: -6.2088, longitude: 106.8456 }; // Menteng

    const res = await service.calculateRoute(origin, destination, 'motorcycle');

    expect(res).toBeDefined();
    expect(res.source).toBe('FALLBACK_HAVERSINE');
    expect(res.distanceMeters).toBeGreaterThan(0);
    expect(res.durationSeconds).toBeGreaterThan(0);
  });

  it('should calculate route via real or configured OSRM when reachable', async () => {
    const reachableConfig = {
      get: (key: string, defaultValue?: any) => {
        if (key === 'OSRM_URL') return 'http://localhost:5000';
        return defaultValue;
      },
    } as any;
    const reachableService = new RoutingService(reachableConfig);
    const origin = { latitude: -6.1754, longitude: 106.8272 };
    const destination = { latitude: -6.2088, longitude: 106.8456 };

    const res = await reachableService.calculateRoute(origin, destination, 'motorcycle');
    expect(res).toBeDefined();
    expect(['OSRM', 'FALLBACK_HAVERSINE']).toContain(res.source);
  });
});
