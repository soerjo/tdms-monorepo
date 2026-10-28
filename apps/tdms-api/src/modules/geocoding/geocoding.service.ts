import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ForwardGeocodeDto, SnapCoordinateDto } from './dto/geocode.dto.js';

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  source: 'PHOTON' | 'MOCK_GEOCODER';
}

export interface SnapResult {
  snappedLatitude: number;
  snappedLongitude: number;
  distanceToRoadMeters: number;
  streetName?: string;
  source: 'OSRM_NEAREST' | 'FALLBACK';
}

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private readonly osrmUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.osrmUrl = this.configService.get<string>('OSRM_URL', 'http://localhost:5000');
  }

  async forwardGeocode(dto: ForwardGeocodeDto): Promise<GeocodeResult> {
    try {
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(dto.rawAddress)}&limit=1`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          const first = data.features[0];
          return {
            longitude: first.geometry.coordinates[0],
            latitude: first.geometry.coordinates[1],
            formattedAddress: first.properties.name || dto.rawAddress,
            source: 'PHOTON',
          };
        }
      }
    } catch (err: any) {
      this.logger.warn(`Photon geocoding failed: ${err.message}. Using deterministic fallback.`);
    }

    // Deterministic fallback for test & resilience
    return {
      latitude: -6.2088,
      longitude: 106.8456,
      formattedAddress: dto.rawAddress,
      source: 'MOCK_GEOCODER',
    };
  }

  async snapToRoad(dto: SnapCoordinateDto): Promise<SnapResult> {
    const profile = dto.profile || 'motorcycle';
    const url = `${this.osrmUrl}/nearest/v1/${profile}/${dto.longitude},${dto.latitude}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.waypoints && data.waypoints.length > 0) {
          const wp = data.waypoints[0];
          return {
            snappedLongitude: wp.location[0],
            snappedLatitude: wp.location[1],
            distanceToRoadMeters: wp.distance,
            streetName: wp.name,
            source: 'OSRM_NEAREST',
          };
        }
      }
    } catch (err: any) {
      this.logger.warn(`OSRM /nearest failed: ${err.message}`);
    }

    return {
      snappedLatitude: dto.latitude,
      snappedLongitude: dto.longitude,
      distanceToRoadMeters: 0,
      source: 'FALLBACK',
    };
  }
}
