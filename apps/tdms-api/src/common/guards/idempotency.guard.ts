import {
  BadRequestException,
  CanActivate,
  ConflictException,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class IdempotencyGuard implements CanActivate {
  private static readonly processedKeys = new Set<string>();

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

    if (IdempotencyGuard.processedKeys.has(idempotencyKey)) {
      throw new ConflictException(
        `Request dengan Idempotency-Key ${idempotencyKey} sedang atau sudah diproses`,
      );
    }

    IdempotencyGuard.processedKeys.add(idempotencyKey);
    return true;
  }
}
