import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OptimizeTripDto } from './dto/optimize-trip.dto.js';

export interface VroomRouteStep {
  type: 'start' | 'job' | 'end';
  location: [number, number];
  job?: number;
  orderId?: string;
  arrival: number;
  duration: number;
  distance: number;
}

export interface OptimizationResult {
  code: number;
  routes: {
    vehicle: number;
    steps: VroomRouteStep[];
    cost: number;
    duration: number;
    distance: number;
  }[];
  unassigned: any[];
}

@Injectable()
export class OptimizationService {
  private readonly logger = new Logger(OptimizationService.name);
  private readonly vroomUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.vroomUrl = this.configService.get<string>('VROOM_URL', 'http://localhost:3000');
  }

  async solveVrptw(dto: OptimizeTripDto): Promise<OptimizationResult> {
    const vroomPayload = {
      vehicles: dto.vehicles.map((v) => ({
        id: v.id,
        profile: v.profile,
        start: v.startLocation,
        capacity: [v.capacity.weightGrams, v.capacity.volumeCm3],
        time_window: v.timeWindow,
      })),
      jobs: dto.jobs.map((j, idx) => ({
        id: idx + 1,
        description: j.orderId,
        location: j.location,
        service: j.serviceTimeSeconds,
        delivery: [j.weightGrams, j.volumeCm3],
        time_windows: j.timeWindow ? [j.timeWindow] : undefined,
      })),
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5s KPI limit

      const response = await fetch(`${this.vroomUrl}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vroomPayload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();
        return result;
      }
    } catch (error: any) {
      this.logger.warn(`VROOM solver unreachable or timed out (${error.message}). Using sequential fallback solver`);
    }

    return this.fallbackSequentialSolver(dto);
  }

  private fallbackSequentialSolver(dto: OptimizeTripDto): OptimizationResult {
    // Greedy heuristic assignment fallback when VROOM solver is offline
    const vehicle = dto.vehicles[0];
    const steps: VroomRouteStep[] = [
      {
        type: 'start',
        location: vehicle ? vehicle.startLocation : [106.8272, -6.1754],
        arrival: Math.floor(Date.now() / 1000),
        duration: 0,
        distance: 0,
      },
    ];

    let currentDuration = 0;
    let currentDistance = 0;

    dto.jobs.forEach((job, idx) => {
      currentDuration += job.serviceTimeSeconds + 600; // estimated travel 10 mins
      currentDistance += 3000; // estimated 3km per stop
      steps.push({
        type: 'job',
        job: idx + 1,
        orderId: job.orderId,
        location: job.location,
        arrival: Math.floor(Date.now() / 1000) + currentDuration,
        duration: currentDuration,
        distance: currentDistance,
      });
    });

    return {
      code: 0,
      routes: [
        {
          vehicle: vehicle ? vehicle.id : 1,
          steps,
          cost: currentDuration,
          duration: currentDuration,
          distance: currentDistance,
        },
      ],
      unassigned: [],
    };
  }
}
