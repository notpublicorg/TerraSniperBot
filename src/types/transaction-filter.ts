export type BuyCondition = { denom: string; greaterOrEqual: number; buy: number };
export type TransactionFilter = {
  contractToSpy: string;
  conditions: BuyCondition[];
  maxTokenPrice?: number;
};
