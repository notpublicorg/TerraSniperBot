export type BuyCondition = { denom: string; greaterOrEqual: number; buy: number };

export type TransactionFilter = {
  taskId: string;
  contractToSpy: string;
  conditions: BuyCondition[];
  maxTokenPrice?: number;
};
