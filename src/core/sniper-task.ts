export type SniperBuyCondition = {
  currency: string;
  greaterOrEqual: string;
  buy: string;
};

export type SniperTaskNew = {
  tokenContract: string;
  pairContract?: string;
  conditions: SniperBuyCondition[];
  maxSpread: string;
  maxTokenPrice?: string;
};

export type SniperTask = SniperTaskNew & {
  id: string;
  status: 'active' | 'blocked' | 'closed';
};
