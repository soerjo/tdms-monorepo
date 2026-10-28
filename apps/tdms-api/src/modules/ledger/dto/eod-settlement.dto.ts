import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class EodSettlementDto {
  @ApiProperty({ example: 'd3b07384-d113-4001-9e23-2895698b6a98' })
  @IsString()
  @IsNotEmpty()
  driverId!: string;

  @ApiProperty({ example: 450000 })
  @IsNumber()
  @IsPositive()
  physicalCashReceived!: number;

  @ApiProperty({ example: 'CASHIER-HUB-01' })
  @IsString()
  @IsNotEmpty()
  cashierId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  idempotencyKey!: string;
}

export class IncidentalExpenseDto {
  @ApiProperty({ example: 'd3b07384-d113-4001-9e23-2895698b6a98' })
  @IsString()
  @IsNotEmpty()
  driverId!: string;

  @ApiProperty({ example: 'TRIP-JKT-101' })
  @IsString()
  @IsNotEmpty()
  tripCode!: string;

  @ApiProperty({ example: 25000, description: 'Toll, parking, retribution expense in IDR' })
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiProperty({ example: 'https://storage.tdms.internal/receipts/toll_struk_982.jpg' })
  @IsString()
  @IsNotEmpty()
  receiptPhotoUrl!: string;

  @ApiProperty({ example: 'Tol Lingkar Luar Pondok Ranji' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  idempotencyKey!: string;
}
