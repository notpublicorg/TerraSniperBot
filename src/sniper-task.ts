export type SniperBuyCondition = {
  denom: string;
  greaterOrEqual: string;
  buy: string;
};

export type SniperTaskNew = {
  contract: string;
  conditions: SniperBuyCondition[];
  maxTokenPrice: string;
};
