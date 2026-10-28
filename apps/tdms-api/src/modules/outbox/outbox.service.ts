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

  async processPendingEvents(batchSize: number = 20): Promise<{ processed: number; failed: number }> {
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

    for (const event of pendingEvents) {
      try {
        // Disini event di-publish ke Message Broker (RabbitMQ / Kafka)
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
        await this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            attemptCount: { increment: 1 },
            lastError: err.message,
            availableAt: new Date(Date.now() + 30000), // exponential backoff
          },
        });
        failed++;
      }
    }

    return { processed, failed };
  }
}
