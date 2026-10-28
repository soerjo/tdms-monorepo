import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { JournalDirection } from '@prisma/client';

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
}
