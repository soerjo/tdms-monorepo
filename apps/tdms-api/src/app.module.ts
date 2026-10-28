import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { validate } from './config/env.validation.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { MetricsModule } from './modules/metrics/metrics.module.js';
import { RoutingModule } from './modules/routing/routing.module.js';
import { LedgerModule } from './modules/ledger/ledger.module.js';
import { DeliveryModule } from './modules/delivery/delivery.module.js';
import { DispatchModule } from './modules/dispatch/dispatch.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    HealthModule,
    MetricsModule,
    RoutingModule,
    LedgerModule,
    DeliveryModule,
    DispatchModule,
  ],
})
export class AppModule {}
