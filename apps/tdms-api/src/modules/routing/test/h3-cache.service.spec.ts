import { H3CacheService } from '../h3-cache.service.js';

describe('H3CacheService', () => {
  let service: H3CacheService;

  beforeEach(() => {
    service = new H3CacheService();
  });

  it('should generate valid H3 index for coordinates', () => {
    const h3Index = service.getH3Index(-6.2088, 106.8456);
    expect(typeof h3Index).toBe('string');
    expect(h3Index.length).toBeGreaterThan(10);
  });

  it('should set and retrieve matrix cache', () => {
    const originH3 = '88654c5545fffff';
    const destH3 = '88654c5547fffff';

    expect(service.getMatrixCache(originH3, destH3)).toBeNull();

    service.setMatrixCache(originH3, destH3, 1200, 8500, 3600);
    const cached = service.getMatrixCache(originH3, destH3);

    expect(cached).not.toBeNull();
    expect(cached?.duration).toBe(1200);
    expect(cached?.distance).toBe(8500);
  });

  it('should return null for expired cache', () => {
    const originH3 = '88654c5545fffff';
    const destH3 = '88654c5547fffff';

    service.setMatrixCache(originH3, destH3, 500, 2000, -1); // already expired
    expect(service.getMatrixCache(originH3, destH3)).toBeNull();
  });
});
