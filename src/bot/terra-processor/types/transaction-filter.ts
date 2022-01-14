export type BuyCondition = { denom: string; greaterOrEqual: number; buy: number };

export type TransactionFilter = {
  taskId: string;
  tokenContractToSpy: string;
  allowedPairContract?: string;
  conditions: BuyCondition[];
  maxTokenPrice?: number;
};
