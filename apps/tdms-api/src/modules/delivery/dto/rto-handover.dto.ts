import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RtoHandoverDto {
  @ApiProperty({ example: 'HUB-CGK-01' })
  @IsString()
  @IsNotEmpty()
  hubId!: string;

  @ApiProperty({ example: 'STAFF-WAREHOUSE-08' })
  @IsString()
  @IsNotEmpty()
  receivedBy!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  idempotencyKey!: string;
}
