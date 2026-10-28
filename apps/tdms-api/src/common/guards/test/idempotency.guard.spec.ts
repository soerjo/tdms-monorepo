import { IdempotencyGuard } from '../idempotency.guard.js';
import { BadRequestException, ConflictException } from '@nestjs/common';

describe('IdempotencyGuard', () => {
  let guard: IdempotencyGuard;

  beforeEach(() => {
    guard = new IdempotencyGuard();
  });

  const createMockContext = (idempotencyKey?: string): any => ({
    switchToHttp: () => ({
      getRequest: () => ({
        headers: {
          'idempotency-key': idempotencyKey,
        },
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
    expect(guard.canActivate(createMockContext(validUuid))).toBe(true);
  });

  it('should throw ConflictException on duplicate idempotency key', () => {
    const duplicateUuid = '123e4567-e89b-12d3-a456-426614174001';
    expect(guard.canActivate(createMockContext(duplicateUuid))).toBe(true);
    expect(() => guard.canActivate(createMockContext(duplicateUuid))).toThrow(ConflictException);
  });
});
