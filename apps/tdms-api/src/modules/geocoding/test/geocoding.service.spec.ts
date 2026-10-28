import { GeocodingService } from '../geocoding.service.js';
import { ConfigService } from '@nestjs/config';

describe('GeocodingService', () => {
  let service: GeocodingService;
  let configService: ConfigService;

  beforeEach(() => {
    configService = {
      get: (key: string, defaultValue?: any) => {
        if (key === 'OSRM_URL') return 'http://127.0.0.1:59999'; // offline port
        return defaultValue;
      },
    } as any;
    service = new GeocodingService(configService);
  });

  it('should forward geocode address and return coordinates', async () => {
    const res = await service.forwardGeocode({
      rawAddress: 'Jl. Jendral Sudirman Kav 52, Jakarta',
    });
    expect(res).toBeDefined();
    expect(typeof res.latitude).toBe('number');
    expect(typeof res.longitude).toBe('number');
  });

  it('should fallback snapToRoad when OSRM is offline', async () => {
    const res = await service.snapToRoad({
      latitude: -6.2254,
      longitude: 106.8091,
    });
    expect(res).toBeDefined();
    expect(res.snappedLatitude).toBeCloseTo(-6.2254, 3);
    expect(res.snappedLongitude).toBeCloseTo(106.8091, 3);
    expect(res.source).toBe('FALLBACK');
  });
});
