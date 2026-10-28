import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class ForwardGeocodeDto {
  @ApiProperty({ example: 'Jl. Jend. Sudirman Kav 52-53, Senayan, Kebayoran Baru, Jakarta Selatan' })
  @IsString()
  @IsNotEmpty()
  rawAddress!: string;
}

export class SnapCoordinateDto {
  @ApiProperty({ example: -6.2254 })
  @IsNumber()
  latitude!: number;

  @ApiProperty({ example: 106.8091 })
  @IsNumber()
  longitude!: number;

  @ApiProperty({ example: 'motorcycle', required: false })
  @IsOptional()
  @IsString()
  profile?: string;
}
