import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface EnqueueEventDto {
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  topic: string;
  payload: any;
  headers?: any;
}

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);
  private static readonly MAX_RETRY_ATTEMPTS = 5;

  constructor(private readonly prisma: PrismaService) {}

  async enqueueEvent(dto: EnqueueEventDto) {
    return this.prisma.outboxEvent.create({
      data: {
        aggregateType: dto.aggregateType,
        aggregateId: dto.aggregateId,
        eventType: dto.eventType,
        topic: dto.topic,
        payload: dto.payload,
        headers: dto.headers || {},
        status: 'PENDING',
      },
    });
  }

  async processPendingEvents(batchSize: number = 20): Promise<{ processed: number; failed: number; deadLettered: number }> {
    // Klaim baris secara safe dengan status transisi
    const pendingEvents = await this.prisma.outboxEvent.findMany({
      where: {
        status: 'PENDING',
        availableAt: { lte: new Date() },
      },
      take: batchSize,
      orderBy: { createdAt: 'asc' },
    });

    let processed = 0;
    let failed = 0;
    let deadLettered = 0;

    for (const event of pendingEvents) {
      if (event.attemptCount >= OutboxService.MAX_RETRY_ATTEMPTS) {
        // Pindahkan ke Dead Letter Status
        this.logger.error(`Event ${event.id} exceeded max retries (${event.attemptCount}). Moving to DEAD_LETTER`);
        await this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            status: 'DEAD_LETTER',
            lastError: `Max attempts (${OutboxService.MAX_RETRY_ATTEMPTS}) reached. Escalated to DLQ.`,
          },
        });
        deadLettered++;
        continue;
      }

      try {
        this.logger.log(`Publishing outbox event [${event.eventType}] to topic [${event.topic}]`);

        await this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            status: 'PUBLISHED',
            publishedAt: new Date(),
          },
        });
        processed++;
      } catch (err: any) {
        this.logger.error(`Failed to publish event ${event.id}: ${err.message}`);
        const nextAttempt = event.attemptCount + 1;
        // Exponential backoff: 2^attempt * 5000 ms
        const backoffMs = Math.pow(2, nextAttempt) * 5000;

        await this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            attemptCount: nextAttempt,
            lastError: err.message,
            availableAt: new Date(Date.now() + backoffMs),
          },
        });
        failed++;
      }
    }

    return { processed, failed, deadLettered };
  }
}
