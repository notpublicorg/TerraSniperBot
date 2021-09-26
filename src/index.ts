import { Denom } from '@terra-money/terra.js';

import { createSmartContractWorkflow } from './smart-contract-workflow';
import { createTerraTransactionsSource } from './terra-transactions-source';
import { TransactionFilter } from './types/transaction-filter';

const FILTERS_MOCK: TransactionFilter[] = [
  {
    contractToSpy: 'terra17pewe6hl5ft8jgfuhrts9qlpyyq3sr4xw4tgw0',
    conditions: [
      {
        denom: Denom.USD,
        greaterOrEqual: 10,
        buy: 10,
      },
      {
        denom: Denom.LUNA,
        greaterOrEqual: 20,
        buy: 10,
      },
    ],
  },
];

const transactionsSource = createTerraTransactionsSource(
  {
    websocketUrl: 'ws://162.55.245.183:26657/websocket',
    lcdUrl: 'https://bombay-lcd.terra.dev',
    lcdChainId: 'bombay-11',
  },
  { error: console.log },
);

const smartContractWorkflow = createSmartContractWorkflow(FILTERS_MOCK)(transactionsSource);

const subscription = smartContractWorkflow.subscribe(console.log);

process.stdin.on('data', () => {
  console.log('shutting down connection');
  subscription.unsubscribe();
  process.exit(0);
});
