import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsPositive } from 'class-validator';

export class CalculateFareDto {
  @ApiProperty({ example: 8500, description: 'Distance in meters' })
  @IsNumber()
  @IsPositive()
  distanceMeters!: number;

  @ApiProperty({ example: 1200, description: 'Duration in seconds' })
  @IsNumber()
  @IsPositive()
  durationSeconds!: number;

  @ApiProperty({ example: 'MOTORCYCLE', enum: ['MOTORCYCLE', 'VAN', 'TRUCK_CDE'] })
  @IsEnum(['MOTORCYCLE', 'VAN', 'TRUCK_CDE'])
  vehicleType!: 'MOTORCYCLE' | 'VAN' | 'TRUCK_CDE';

  @ApiProperty({ example: 2500, description: 'Weight in grams', required: false })
  @IsOptional()
  @IsNumber()
  weightGrams?: number;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  isPeakHour?: boolean;
}
