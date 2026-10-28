import {
  BadRequestException,
  CanActivate,
  ConflictException,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import * as crypto from 'crypto';

export interface IdempotencyEntry {
  key: string;
  requestHash: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: number;
}

@Injectable()
export class IdempotencyGuard implements CanActivate {
  private static readonly records = new Map<string, IdempotencyEntry>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const idempotencyKey = request.headers['idempotency-key'] as string;

    if (!idempotencyKey) {
      throw new BadRequestException('Header Idempotency-Key wajib disertakan');
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(idempotencyKey)) {
      throw new BadRequestException('Idempotency-Key harus berformat UUIDv4');
    }

    const bodyStr = JSON.stringify(request.body || {});
    const requestHash = crypto.createHash('sha256').update(bodyStr).digest('hex');

    const existing = IdempotencyGuard.records.get(idempotencyKey);
    if (existing) {
      // Cek apakah payload berubah (Payload Drift Detection)
      if (existing.requestHash !== requestHash) {
        throw new BadRequestException(
          `Idempotency violation: Kunci '${idempotencyKey}' sudah digunakan untuk payload yang berbeda`,
        );
      }

      if (existing.status === 'PROCESSING') {
        throw new ConflictException(
          `Concurrent execution: Request dengan Idempotency-Key '${idempotencyKey}' sedang diproses`,
        );
      }

      // Replay allowed
      return true;
    }

    IdempotencyGuard.records.set(idempotencyKey, {
      key: idempotencyKey,
      requestHash,
      status: 'PROCESSING',
      createdAt: Date.now(),
    });

    return true;
  }

  static markCompleted(idempotencyKey: string): void {
    const record = IdempotencyGuard.records.get(idempotencyKey);
    if (record) {
      record.status = 'COMPLETED';
    }
  }

  static markFailed(idempotencyKey: string): void {
    const record = IdempotencyGuard.records.get(idempotencyKey);
    if (record) {
      record.status = 'FAILED';
    }
  }

  static clear(): void {
    IdempotencyGuard.records.clear();
  }
}
