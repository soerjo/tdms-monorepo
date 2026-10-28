import { Injectable, Logger } from '@nestjs/common';
import { latLngToCell } from 'h3-js';

export interface MatrixItem {
  originIndex: number;
  destIndex: number;
  durationSeconds: number;
  distanceMeters: number;
}

@Injectable()
export class H3CacheService {
  private readonly logger = new Logger(H3CacheService.name);
  // In-memory matrix cache simulating Redis H3 resolution 8 cache
  private readonly cache = new Map<string, { duration: number; distance: number; expiresAt: number }>();
  private readonly H3_RESOLUTION = 8; // ~460m edge length, ideal for delivery clustering

  getH3Index(latitude: number, longitude: number): string {
    return latLngToCell(latitude, longitude, this.H3_RESOLUTION);
  }

  getMatrixCache(originH3: string, destH3: string): { duration: number; distance: number } | null {
    const key = `matrix:v1:${originH3}:${destH3}`;
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return { duration: cached.duration, distance: cached.distance };
  }

  setMatrixCache(
    originH3: string,
    destH3: string,
    duration: number,
    distance: number,
    ttlSeconds: number = 3600,
  ): void {
    const key = `matrix:v1:${originH3}:${destH3}`;
    this.cache.set(key, {
      duration,
      distance,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }
}
