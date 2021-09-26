import { Denom } from '@terra-money/terra.js';

import { createSmartContractWorkflow } from './smart-contract-workflow';
import { createTerraTransactionsSource } from './terra-transactions-source';
import { TransactionFilter } from './types/transaction-filter';

const FILTERS_MOCK: TransactionFilter[] = [
  {
    contractToSpy: '',
    conditions: [
      {
        denom: Denom.USD,
        greaterOrEqual: 10000,
        buy: 10000,
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
