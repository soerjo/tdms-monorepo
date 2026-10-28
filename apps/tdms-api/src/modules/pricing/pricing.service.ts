import { Injectable } from '@nestjs/common';
import { CalculateFareDto } from './dto/calculate-fare.dto.js';

export interface FareQuoteResult {
  baseFare: number;
  distanceFare: number;
  weightSurcharge: number;
  peakHourMultiplier: number;
  totalFare: number;
  currency: 'IDR';
}

@Injectable()
export class PricingService {
  calculateFare(dto: CalculateFareDto): FareQuoteResult {
    let baseFare = 10000; // IDR 10.000 default motor
    let ratePerKm = 2500; // IDR 2.500 / km

    if (dto.vehicleType === 'VAN') {
      baseFare = 50000;
      ratePerKm = 6000;
    } else if (dto.vehicleType === 'TRUCK_CDE') {
      baseFare = 150000;
      ratePerKm = 12000;
    }

    const distanceKm = Math.max(0, dto.distanceMeters / 1000);
    const billableKm = Math.max(0, distanceKm - 3); // 3 km pertama masuk base fare
    const distanceFare = Math.round(billableKm * ratePerKm);

    // Weight surcharge: 500 IDR per kg di atas 5kg
    let weightSurcharge = 0;
    if (dto.weightGrams && dto.weightGrams > 5000) {
      const extraKg = Math.ceil((dto.weightGrams - 5000) / 1000);
      weightSurcharge = extraKg * 1000;
    }

    const peakMultiplier = dto.isPeakHour ? 1.25 : 1.0;
    const subtotal = baseFare + distanceFare + weightSurcharge;
    const totalFare = Math.round(subtotal * peakMultiplier);

    return {
      baseFare,
      distanceFare,
      weightSurcharge,
      peakHourMultiplier: peakMultiplier,
      totalFare,
      currency: 'IDR',
    };
  }
}
