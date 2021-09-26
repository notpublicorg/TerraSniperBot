import { Denom } from '@terra-money/terra.js';

import { createSmartContractWorkflow } from './/terra-processor/smart-contract-workflow';
import { createTerraTransactionsSource } from './terra-processor/terra-transactions-source';
import { TransactionFilter } from './terra-processor/types/transaction-filter';

class TransactionFiltersStorage {
  private FILTERS_MOCK: TransactionFilter[] = [
    {
      contractToSpy: 'terra1ruzfnlfcgzld2yfpnjgspmm3jaeq4xtjl0z490',
      conditions: [
        {
          denom: Denom.USD,
          greaterOrEqual: 20,
          buy: 20,
        },
        {
          denom: Denom.USD,
          greaterOrEqual: 10,
          buy: 10,
        },
        {
          denom: Denom.LUNA,
          greaterOrEqual: 20,
          buy: 20,
        },
      ],
      maxTokenPrice: 100,
    },
  ];
  getFilters() {
    return this.FILTERS_MOCK;
  }
}

const transactionsSource = createTerraTransactionsSource(
  {
    websocketUrl: 'ws://162.55.245.183:26657/websocket',
    lcdUrl: 'https://bombay-lcd.terra.dev',
    lcdChainId: 'bombay-11',
  },
  { error: console.log, info: console.info },
);

const transactionFiltersStorage = new TransactionFiltersStorage();
const smartContractWorkflow = createSmartContractWorkflow(
  transactionFiltersStorage.getFilters.bind(this),
)(transactionsSource);

const subscription = smartContractWorkflow.subscribe(console.log);

process.stdin.on('data', () => {
  console.log('shutting down connection');
  subscription.unsubscribe();
  process.exit(0);
});
