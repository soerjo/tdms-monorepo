import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class SubmitPodDto {
  @ApiProperty()
  @IsString()
  stopId!: string;

  @ApiProperty()
  @IsString()
  driverId!: string;

  @ApiProperty()
  @IsNumber()
  latitude!: number;

  @ApiProperty()
  @IsNumber()
  longitude!: number;

  @ApiProperty()
  @IsString()
  podPhotoUrl!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  podSignatureUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isMockGps?: boolean;

  @ApiProperty()
  @IsString()
  idempotencyKey!: string;
}
