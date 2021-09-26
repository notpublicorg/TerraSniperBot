export type BuyCondition = { denom: string; greaterOrEqual: number; buy: number };

export type TransactionFilter = {
  contractToSpy: string;
  conditions: BuyCondition[];
  maxTokenPrice?: number;
};

export type ParsedLiquidity = {
  token: { amount: string; contract: string };
  currency: { amount: string; denom: string };
};
