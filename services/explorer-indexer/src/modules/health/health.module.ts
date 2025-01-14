import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { DagModule } from '../dag';
import { LiveSyncerModule } from '../live-sync';
import { PbftModule } from '../pbft';
import { HealthController } from './health.controller';
import { SyncerHealthIndicator } from './syncerHealthIndicator';
import * as dotenv from 'dotenv';
import { ProducerHealthController } from './producerHealth.controller';
import { ProducerHealthIndicator } from './producerHealthIndicator';
import { TransactionModule } from '../transaction';

dotenv.config();
const isProducer = process.env.ENABLE_PRODUCER_MODULE === 'true';

@Module({
  imports: isProducer
    ? [
        TerminusModule,
        PbftModule,
        DagModule,
        TransactionModule,
        LiveSyncerModule,
      ]
    : [TerminusModule, PbftModule, DagModule, TransactionModule],
  controllers: isProducer ? [ProducerHealthController] : [HealthController],
  providers: isProducer ? [ProducerHealthIndicator] : [SyncerHealthIndicator],
})
export class HealthModule {}
