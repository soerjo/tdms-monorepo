import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LedgerService } from './ledger.service.js';
import { PostJournalDto } from './dto/post-journal.dto.js';
import { EodSettlementDto, IncidentalExpenseDto } from './dto/eod-settlement.dto.js';
import { IdempotencyGuard } from '../../common/guards/idempotency.guard.js';

@ApiTags('Ledger')
@Controller('ledger')
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Post('journal')
  @UseGuards(IdempotencyGuard)
  @ApiHeader({ name: 'Idempotency-Key', description: 'UUIDv4 string' })
  @ApiOperation({ summary: 'Post a balanced double-entry journal entry' })
  async postEntry(@Body() dto: PostJournalDto) {
    return this.ledgerService.postJournalEntry(dto);
  }

  @Get('drivers/:driverId/cash-in-hand')
  @ApiOperation({ summary: 'Get total cash-in-hand held by driver' })
  async getDriverCash(@Param('driverId') driverId: string) {
    const balance = await this.ledgerService.getDriverCashInHand(driverId);
    return {
      driverId,
      cashInHand: balance,
      limit: 2000000,
      isLimitBreached: balance > 2000000,
    };
  }

  @Post('settlement/eod')
  @UseGuards(IdempotencyGuard)
  @ApiHeader({ name: 'Idempotency-Key', description: 'UUIDv4 string' })
  @ApiOperation({ summary: 'End-of-day driver cash settlement with cashier physical validation' })
  async settleEod(@Body() dto: EodSettlementDto) {
    return this.ledgerService.settleDriverCash(dto);
  }

  @Post('expenses/incidental')
  @UseGuards(IdempotencyGuard)
  @ApiHeader({ name: 'Idempotency-Key', description: 'UUIDv4 string' })
  @ApiOperation({ summary: 'Record incidental toll/parking expense claim' })
  async claimExpense(@Body() dto: IncidentalExpenseDto) {
    return this.ledgerService.claimIncidentalExpense(dto);
  }
}
