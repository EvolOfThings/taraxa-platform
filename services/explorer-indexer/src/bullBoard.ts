import { ExpressAdapter } from '@bull-board/express';
import { INestApplication } from '@nestjs/common';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { Queue } from 'bull';
import { Queues } from './types';

export const initializeBullBoard = (app: INestApplication) => {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/bull-board');

  const pbftQueue = app.get<Queue>(`BullQueue_${Queues.NEW_PBFTS}`);
  const dagsQueue = app.get<Queue>(`BullQueue_${Queues.NEW_DAGS}`);
  const transactionsQueue = app.get<Queue>(
    `BullQueue_${Queues.STALE_TRANSACTIONS}`
  );

  createBullBoard({
    queues: [
      new BullAdapter(pbftQueue),
      new BullAdapter(dagsQueue),
      new BullAdapter(transactionsQueue),
    ],
    serverAdapter,
  });
  return serverAdapter.getRouter();
};
