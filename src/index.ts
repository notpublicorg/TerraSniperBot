import { Denom } from '@terra-money/terra.js';

import { SniperTask } from './sniper-task';
import { TerraTasksProcessor } from './terra-processor';

const TASKS: SniperTask[] = [
  {
    id: 'taskId',
    status: 'active',
    contract: 'terra1ruzfnlfcgzld2yfpnjgspmm3jaeq4xtjl0z490',
    conditions: [
      {
        denom: Denom.USD,
        greaterOrEqual: '20',
        buy: '20',
      },
      {
        denom: Denom.USD,
        greaterOrEqual: '10',
        buy: '10',
      },
      {
        denom: Denom.LUNA,
        greaterOrEqual: '20',
        buy: '20',
      },
    ],
    maxTokenPrice: '100',
  },
];

const terraProcessor = new TerraTasksProcessor();

terraProcessor.init(TASKS);

process.stdin.on('data', () => {
  console.log('shutting down connection');
  terraProcessor.stop();
  process.exit(0);
});
