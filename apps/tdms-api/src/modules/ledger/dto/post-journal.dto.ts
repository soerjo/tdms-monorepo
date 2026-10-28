import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNumber, IsOptional, IsPositive, IsString, ValidateNested } from 'class-validator';

export class JournalLineDto {
  @ApiProperty({ example: '101-CASH-DRIVER' })
  @IsString()
  accountCode!: string;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiProperty({ enum: ['DEBIT', 'CREDIT'] })
  @IsEnum(['DEBIT', 'CREDIT'])
  direction!: 'DEBIT' | 'CREDIT';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  driverId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  orderId?: string;
}

export class PostJournalDto {
  @ApiProperty({ example: 'ORD-9821' })
  @IsString()
  transactionRefId!: string;

  @ApiProperty({ enum: ['FARE_REVENUE', 'COD_COLLECTION', 'TOLL_REIMBURSEMENT', 'CASH_HANDOVER'] })
  @IsEnum(['FARE_REVENUE', 'COD_COLLECTION', 'TOLL_REIMBURSEMENT', 'CASH_HANDOVER'])
  entryType!: 'FARE_REVENUE' | 'COD_COLLECTION' | 'TOLL_REIMBURSEMENT' | 'CASH_HANDOVER';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'b3f54d19-94b2-4d4b-9705-e406fef29562' })
  @IsString()
  idempotencyKey!: string;

  @ApiProperty({ type: [JournalLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalLineDto)
  lines!: JournalLineDto[];
}
