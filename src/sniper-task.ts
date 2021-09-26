export type SniperBuyCondition = {
  denom: string;
  greaterOrEqual: string;
  buy: string;
};

export type SniperTask = {
  contract: string;
  conditions: SniperBuyCondition[];
  maxTokenPrice: string;
};
