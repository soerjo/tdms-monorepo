import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { LocationPingDto } from './dto/location-ping.dto.js';

export interface DriverLiveState {
  driverId: string;
  latitude: number;
  longitude: number;
  bearing?: number;
  speed?: number;
  lastPingAt: number;
}

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);
  // Simulating Redis GEO key `courier:locations`
  private readonly driverLocations = new Map<string, DriverLiveState>();

  async recordPing(dto: LocationPingDto): Promise<DriverLiveState> {
    if (dto.isMock) {
      throw new BadRequestException('Security violation: Fake/Mock GPS detected on client');
    }

    if (dto.speed && dto.speed > 160) {
      this.logger.warn(`Speed anomaly detected for driver ${dto.driverId}: ${dto.speed} km/h`);
    }

    const liveState: DriverLiveState = {
      driverId: dto.driverId,
      latitude: dto.latitude,
      longitude: dto.longitude,
      bearing: dto.bearing,
      speed: dto.speed,
      lastPingAt: Date.now(),
    };

    this.driverLocations.set(dto.driverId, liveState);
    return liveState;
  }

  getDriverLocation(driverId: string): DriverLiveState | null {
    return this.driverLocations.get(driverId) ?? null;
  }

  getAllActiveDrivers(): DriverLiveState[] {
    const ACTIVE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();
    return Array.from(this.driverLocations.values()).filter(
      (driver) => now - driver.lastPingAt <= ACTIVE_THRESHOLD_MS,
    );
  }
}
