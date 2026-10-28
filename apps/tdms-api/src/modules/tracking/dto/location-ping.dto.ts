import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class LocationPingDto {
  @ApiProperty({ example: 'd3b07384-d113-4001-9e23-2895698b6a98' })
  @IsString()
  driverId!: string;

  @ApiProperty({ example: -6.2088 })
  @IsNumber()
  latitude!: number;

  @ApiProperty({ example: 106.8456 })
  @IsNumber()
  longitude!: number;

  @ApiProperty({ example: 45.5, required: false })
  @IsOptional()
  @IsNumber()
  bearing?: number;

  @ApiProperty({ example: 25.0, required: false, description: 'Speed in km/h' })
  @IsOptional()
  @IsNumber()
  speed?: number;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isMock?: boolean;
}
