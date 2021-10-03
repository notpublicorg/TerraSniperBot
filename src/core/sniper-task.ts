export type SniperBuyCondition = {
  currency: string;
  greaterOrEqual: string;
  buy: string;
};

export type SniperTaskNew = {
  contract: string;
  conditions: SniperBuyCondition[];
  maxTokenPrice?: string;
};

export type SniperTask = SniperTaskNew & {
  id: string;
  status: 'active' | 'blocked' | 'closed';
};
