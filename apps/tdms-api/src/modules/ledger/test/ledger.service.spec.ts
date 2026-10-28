import { LedgerService } from '../ledger.service.js';

describe('LedgerService', () => {
  let service: LedgerService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      $transaction: async (cb: any) => cb(mockPrisma),
      ledgerJournalEntry: {
        findUnique: () => null,
        create: (args: any) => ({ id: 'journal-uuid', ...args.data }),
      },
      ledgerAccount: {
        findUnique: (args: any) => ({ id: 'acc-uuid', code: args.where.code }),
        update: () => ({}),
      },
      ledgerJournalLine: {
        create: (args: any) => args.data,
        findMany: () => [
          { amount: 300000, direction: 'DEBIT' },
          { amount: 100000, direction: 'CREDIT' },
        ],
      },
    };
    service = new LedgerService(mockPrisma);
  });

  it('should throw error when journal is unbalanced', async () => {
    await expect(
      service.postJournalEntry({
        transactionRefId: 'ORD-1',
        entryType: 'COD_COLLECTION',
        idempotencyKey: 'idemp-1',
        lines: [
          { accountCode: '101-CASH-DRIVER', amount: 50000, direction: 'DEBIT' },
          { accountCode: '201-MERCHANT-PAYABLE', amount: 40000, direction: 'CREDIT' },
        ],
      }),
    ).rejects.toThrow('Jurnal tidak seimbang');
  });

  it('should post balanced journal correctly', async () => {
    const res = await service.postJournalEntry({
      transactionRefId: 'ORD-1',
      entryType: 'COD_COLLECTION',
      idempotencyKey: 'idemp-1',
      lines: [
        { accountCode: '101-CASH-DRIVER', amount: 50000, direction: 'DEBIT' },
        { accountCode: '201-MERCHANT-PAYABLE', amount: 50000, direction: 'CREDIT' },
      ],
    });

    expect(res).toBeDefined();
    expect(res.id).toBe('journal-uuid');
  });

  it('should calculate driver cash-in-hand correctly from debit/credit lines', async () => {
    const cash = await service.getDriverCashInHand('driver-1');
    expect(cash).toBe(200000); // 300.000 - 100.000
  });

  it('should settle driver cash successfully when physical cash matches ledger balance', async () => {
    const res = await service.settleDriverCash({
      driverId: 'driver-1',
      physicalCashReceived: 200000,
      cashierId: 'cashier-1',
      idempotencyKey: 'idemp-settle',
    });

    expect(res.success).toBe(true);
    expect(res.remainingCashInHand).toBe(0);
  });

  it('should reject settlement when physical cash does not match system balance', async () => {
    await expect(
      service.settleDriverCash({
        driverId: 'driver-1',
        physicalCashReceived: 150000, // Discrepancy!
        cashierId: 'cashier-1',
        idempotencyKey: 'idemp-settle-fail',
      }),
    ).rejects.toThrow('Discrepancy detected');
  });

  it('should record incidental toll and parking expense claims', async () => {
    const res = await service.claimIncidentalExpense({
      driverId: 'driver-1',
      tripCode: 'TRIP-JKT-101',
      amount: 25000,
      receiptPhotoUrl: 'https://storage/toll.jpg',
      description: 'Tol JORR Pondok Ranji',
      idempotencyKey: 'idemp-toll',
    });

    expect(res.success).toBe(true);
    expect(res.claimedAmount).toBe(25000);
  });
});
