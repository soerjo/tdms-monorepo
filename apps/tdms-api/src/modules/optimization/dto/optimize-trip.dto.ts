import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class VehicleCapacityDto {
  @ApiProperty({ example: 50000, description: 'Max weight in grams' })
  @IsNumber()
  weightGrams!: number;

  @ApiProperty({ example: 200000, description: 'Max volume in cm3' })
  @IsNumber()
  volumeCm3!: number;
}

export class OptimizationVehicleDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  id!: number;

  @ApiProperty({ example: 'motorcycle' })
  @IsString()
  profile!: string;

  @ApiProperty({ example: [106.8272, -6.1754], description: '[lon, lat]' })
  @IsArray()
  startLocation!: [number, number];

  @ApiProperty({ type: VehicleCapacityDto })
  @ValidateNested()
  @Type(() => VehicleCapacityDto)
  capacity!: VehicleCapacityDto;

  @ApiProperty({ example: [1761638400, 1761667200], required: false })
  @IsOptional()
  @IsArray()
  timeWindow?: [number, number];
}

export class OptimizationJobDto {
  @ApiProperty({ example: 'ORD-101' })
  @IsString()
  orderId!: string;

  @ApiProperty({ example: [106.8456, -6.2088], description: '[lon, lat]' })
  @IsArray()
  location!: [number, number];

  @ApiProperty({ example: 300, description: 'Service time in seconds' })
  @IsNumber()
  serviceTimeSeconds!: number;

  @ApiProperty({ example: 2000, description: 'Weight in grams' })
  @IsNumber()
  weightGrams!: number;

  @ApiProperty({ example: 5000, description: 'Volume in cm3' })
  @IsNumber()
  volumeCm3!: number;

  @ApiProperty({ example: 50000, description: 'COD amount if applicable', required: false })
  @IsOptional()
  @IsNumber()
  codAmount?: number;

  @ApiProperty({ example: [1761642000, 1761652800], required: false })
  @IsOptional()
  @IsArray()
  timeWindow?: [number, number];
}

export class OptimizeTripDto {
  @ApiProperty({ type: [OptimizationVehicleDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OptimizationVehicleDto)
  vehicles!: OptimizationVehicleDto[];

  @ApiProperty({ type: [OptimizationJobDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OptimizationJobDto)
  jobs!: OptimizationJobDto[];
}
