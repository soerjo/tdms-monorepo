import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class FailDeliveryDto {
  @ApiProperty({ example: 'HOUSE_EMPTY', description: 'RECIPIENT_ABSENT, WRONG_ADDRESS, RESCHEDULED, REJECTED' })
  @IsString()
  @IsNotEmpty()
  reasonCode!: string;

  @ApiProperty({ example: 'https://storage.tdms.internal/evidence/fail_123.jpg' })
  @IsString()
  @IsNotEmpty()
  evidencePhotoUrl!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  idempotencyKey!: string;
}
