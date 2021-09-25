export type LiquidityCurrencyAmount = {
  amount: string;
  info: { native_token: { denom: string } };
};
export type LiquidityTokenAmount = {
  amount: string;
  info: {
    token: { contract_addr: string };
  };
};
export type ProvideLiquidityParam = {
  provide_liquidity: {
    assets: Array<LiquidityCurrencyAmount | LiquidityTokenAmount>;
    slippage_tolerance: string;
  };
};

export type ParsedLiquidity = {
  token: { amount: string };
  currency: { amount: string; denom: string };
};
