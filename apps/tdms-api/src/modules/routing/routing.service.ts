import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

export interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
  geometry?: string;
  source: 'OSRM' | 'FALLBACK_HAVERSINE';
}

@Injectable()
export class RoutingService {
  private readonly logger = new Logger(RoutingService.name);
  private readonly osrmUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.osrmUrl = this.configService.get<string>('OSRM_URL', 'http://localhost:5000');
  }

  async calculateRoute(
    origin: RouteCoordinate,
    destination: RouteCoordinate,
    vehicleProfile: 'motorcycle' | 'van' = 'motorcycle',
  ): Promise<RouteResult> {
    const url = `${this.osrmUrl}/route/v1/${vehicleProfile}/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=polyline`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300); // 300ms SLA timeout

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.routes && data.routes.length > 0) {
          const primaryRoute = data.routes[0];
          return {
            distanceMeters: Math.round(primaryRoute.distance),
            durationSeconds: Math.round(primaryRoute.duration),
            geometry: primaryRoute.geometry,
            source: 'OSRM',
          };
        }
      }
    } catch (error: any) {
      this.logger.warn(
        `OSRM routing request failed or timed out (${error.message}). Falling back to Haversine * 1.35`,
      );
    }

    return this.calculateHaversineFallback(origin, destination);
  }

  private calculateHaversineFallback(
    origin: RouteCoordinate,
    destination: RouteCoordinate,
  ): RouteResult {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (origin.latitude * Math.PI) / 180;
    const phi2 = (destination.latitude * Math.PI) / 180;
    const deltaPhi = ((destination.latitude - origin.latitude) * Math.PI) / 180;
    const deltaLambda = ((destination.longitude - origin.longitude) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const straightDistance = R * c;
    const roadCurvatureCoefficient = 1.35;
    const distanceMeters = Math.round(straightDistance * roadCurvatureCoefficient);

    // Assume average speed 25 km/h for urban delivery (approx 6.94 m/s)
    const averageSpeedMps = 6.94;
    const durationSeconds = Math.round(distanceMeters / averageSpeedMps);

    return {
      distanceMeters,
      durationSeconds,
      source: 'FALLBACK_HAVERSINE',
    };
  }
}
