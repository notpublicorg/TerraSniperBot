export type BuyCondition = { denom: string; greaterOrEqual: number; buy: number };

export type TransactionFilter = {
  taskId: string;
  contractToSpy: string;
  conditions: BuyCondition[];
  maxTokenPrice?: number;
};

export type ParsedLiquidity = {
  token: { amount: number; contract: string };
  currency: { amount: number; denom: string };
};
