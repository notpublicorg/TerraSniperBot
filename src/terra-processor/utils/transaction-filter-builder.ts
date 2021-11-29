import { TransactionFilter } from '../types/transaction-filter';
import { Denom } from './denom';

class TransactionFilterBuilder {
  private filter: TransactionFilter = {
    tokenContractToSpy: 'knownSmartContractToken',
    taskId: 'defaultTaskId',
    conditions: [{ denom: Denom.LUNA, greaterOrEqual: 100, buy: 10 }],
  };

  with<Prop extends keyof TransactionFilter>(prop: Prop, value: TransactionFilter[Prop]) {
    this.filter[prop] = value;
    return this;
  }

  build() {
    return this.filter;
  }
}

export function aTransactionFilter() {
  return new TransactionFilterBuilder();
}
