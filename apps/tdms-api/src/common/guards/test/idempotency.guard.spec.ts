import { IdempotencyGuard } from '../idempotency.guard.js';
import { BadRequestException, ConflictException } from '@nestjs/common';

describe('IdempotencyGuard', () => {
  let guard: IdempotencyGuard;

  beforeEach(() => {
    IdempotencyGuard.clear();
    guard = new IdempotencyGuard();
  });

  const createMockContext = (idempotencyKey?: string, body: any = {}): any => ({
    switchToHttp: () => ({
      getRequest: () => ({
        headers: {
          'idempotency-key': idempotencyKey,
        },
        body,
      }),
    }),
  });

  it('should throw BadRequestException if Idempotency-Key header is missing', () => {
    expect(() => guard.canActivate(createMockContext(undefined))).toThrow(BadRequestException);
  });

  it('should throw BadRequestException if Idempotency-Key is not valid UUIDv4', () => {
    expect(() => guard.canActivate(createMockContext('invalid-uuid'))).toThrow(BadRequestException);
  });

  it('should allow valid UUIDv4 idempotency key on first request', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';
    expect(guard.canActivate(createMockContext(validUuid, { amount: 1000 }))).toBe(true);
  });

  it('should throw ConflictException on concurrent duplicate idempotency key request', () => {
    const duplicateUuid = '123e4567-e89b-12d3-a456-426614174001';
    expect(guard.canActivate(createMockContext(duplicateUuid, { orderId: 'ORD-1' }))).toBe(true);
    expect(() => guard.canActivate(createMockContext(duplicateUuid, { orderId: 'ORD-1' }))).toThrow(ConflictException);
  });

  it('should detect payload drift when same key is sent with different body', () => {
    const key = '123e4567-e89b-12d3-a456-426614174002';
    expect(guard.canActivate(createMockContext(key, { amount: 50000 }))).toBe(true);
    // Mark completed
    IdempotencyGuard.markCompleted(key);

    // Call again with DIFFERENT payload
    expect(() => guard.canActivate(createMockContext(key, { amount: 99999 }))).toThrow('Idempotency violation');
  });

  it('should allow safe replay when key and payload are identical after completion', () => {
    const key = '123e4567-e89b-12d3-a456-426614174003';
    expect(guard.canActivate(createMockContext(key, { amount: 50000 }))).toBe(true);
    IdempotencyGuard.markCompleted(key);

    // Safe replay identical payload
    expect(guard.canActivate(createMockContext(key, { amount: 50000 }))).toBe(true);
  });
});
