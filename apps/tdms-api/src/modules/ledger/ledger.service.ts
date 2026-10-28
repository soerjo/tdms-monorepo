import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { JournalDirection } from '@prisma/client';
import { EodSettlementDto, IncidentalExpenseDto } from './dto/eod-settlement.dto.js';

export interface PostJournalDto {
  transactionRefId: string;
  entryType: 'FARE_REVENUE' | 'COD_COLLECTION' | 'TOLL_REIMBURSEMENT' | 'CASH_HANDOVER';
  description?: string;
  idempotencyKey: string;
  lines: {
    accountCode: string;
    amount: number;
    direction: 'DEBIT' | 'CREDIT';
    driverId?: string;
    orderId?: string;
  }[];
}

@Injectable()
export class LedgerService {
  constructor(private readonly prisma: PrismaService) {}

  async postJournalEntry(dto: PostJournalDto) {
    if (!dto.lines || dto.lines.length < 2) {
      throw new BadRequestException('Buku besar minimal memiliki 2 baris (Debit & Credit)');
    }

    let debitTotal = 0;
    let creditTotal = 0;

    for (const line of dto.lines) {
      if (line.amount <= 0) {
        throw new BadRequestException('Nominal journal line harus lebih besar dari 0');
      }
      if (line.direction === 'DEBIT') debitTotal += line.amount;
      if (line.direction === 'CREDIT') creditTotal += line.amount;
    }

    if (Math.abs(debitTotal - creditTotal) > 0.001) {
      throw new BadRequestException(
        `Jurnal tidak seimbang! Total Debit (${debitTotal}) != Total Credit (${creditTotal})`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.ledgerJournalEntry.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
      });
      if (existing) {
        return existing;
      }

      const journalEntry = await tx.ledgerJournalEntry.create({
        data: {
          transactionRefId: dto.transactionRefId,
          entryType: dto.entryType,
          description: dto.description,
          idempotencyKey: dto.idempotencyKey,
        },
      });

      for (const line of dto.lines) {
        const account = await tx.ledgerAccount.findUnique({
          where: { code: line.accountCode },
        });

        if (!account) {
          throw new BadRequestException(`Akun ledger dengan kode ${line.accountCode} tidak ditemukan`);
        }

        await tx.ledgerJournalLine.create({
          data: {
            journalEntryId: journalEntry.id,
            accountId: account.id,
            driverId: line.driverId,
            orderId: line.orderId,
            amount: line.amount,
            direction: line.direction as JournalDirection,
          },
        });

        // Update balance on account
        const delta = line.direction === 'DEBIT' ? line.amount : -line.amount;
        await tx.ledgerAccount.update({
          where: { id: account.id },
          data: {
            balance: {
              increment: delta,
            },
          },
        });
      }

      return journalEntry;
    });
  }

  async getDriverCashInHand(driverId: string): Promise<number> {
    const driverAccount = await this.prisma.ledgerAccount.findUnique({
      where: { code: '101-CASH-DRIVER' },
    });

    if (!driverAccount) return 0;

    const lines = await this.prisma.ledgerJournalLine.findMany({
      where: {
        accountId: driverAccount.id,
        driverId,
      },
    });

    return lines.reduce((total, line) => {
      const amount = Number(line.amount);
      return line.direction === 'DEBIT' ? total + amount : total - amount;
    }, 0);
  }

  async settleDriverCash(dto: EodSettlementDto) {
    const currentCashInHand = await this.getDriverCashInHand(dto.driverId);

    if (Math.abs(currentCashInHand - dto.physicalCashReceived) > 0.001) {
      throw new BadRequestException(
        `Discrepancy detected! Uang fisik kasir (Rp${dto.physicalCashReceived}) tidak sesuai dengan saldo pembukuan sistem kurir (Rp${currentCashInHand})`,
      );
    }

    if (currentCashInHand === 0) {
      return {
        success: true,
        message: 'Driver saldo kas nol, tidak ada setoran kas yang perlu diselesaikan',
        balance: 0,
      };
    }

    // Jurnal Handover Kas:
    // Debit 102-CASH-HUB (Kas Hub bertambah)
    // Credit 101-CASH-DRIVER (Piutang kas kurir berkurang ke nol)
    const journal = await this.postJournalEntry({
      transactionRefId: `SETTLE-${dto.driverId}-${Date.now()}`,
      entryType: 'CASH_HANDOVER',
      description: `Settlement Kas Akhir Hari Driver ${dto.driverId} divalidasi oleh ${dto.cashierId}`,
      idempotencyKey: dto.idempotencyKey,
      lines: [
        {
          accountCode: '102-CASH-HUB',
          amount: dto.physicalCashReceived,
          direction: 'DEBIT',
          driverId: dto.driverId,
        },
        {
          accountCode: '101-CASH-DRIVER',
          amount: dto.physicalCashReceived,
          direction: 'CREDIT',
          driverId: dto.driverId,
        },
      ],
    });

    return {
      success: true,
      journalId: journal.id,
      driverId: dto.driverId,
      settledAmount: dto.physicalCashReceived,
      remainingCashInHand: 0,
    };
  }

  async claimIncidentalExpense(dto: IncidentalExpenseDto) {
    // Jurnal Biaya Operasional / Tol / Parkir:
    // Debit 501-TOLL-EXPENSE (Beban Operasional Bertambah)
    // Credit 202-DRIVER-REIMBURSEMENT (Kewajiban Reimbursement ke Kurir)
    const journal = await this.postJournalEntry({
      transactionRefId: `EXPENSE-${dto.tripCode}-${Date.now()}`,
      entryType: 'TOLL_REIMBURSEMENT',
      description: `Klaim Operasional: ${dto.description} (Trip: ${dto.tripCode})`,
      idempotencyKey: dto.idempotencyKey,
      lines: [
        {
          accountCode: '501-TOLL-EXPENSE',
          amount: dto.amount,
          direction: 'DEBIT',
          driverId: dto.driverId,
        },
        {
          accountCode: '202-DRIVER-REIMBURSEMENT',
          amount: dto.amount,
          direction: 'CREDIT',
          driverId: dto.driverId,
        },
      ],
    });

    return {
      success: true,
      journalId: journal.id,
      claimedAmount: dto.amount,
      receiptPhotoUrl: dto.receiptPhotoUrl,
    };
  }
}
