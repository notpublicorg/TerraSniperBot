import { TxInfo } from '@terra-money/terra.js';

type LiquidityCurrencyAmount = {
  amount: string;
  info: { native_token: { denom: string } };
};
type LiquidityTokenAmount = {
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

type BuyCondition = { greaterOrEqual: number };
export type BuyConditionsByDenom = Record<string, BuyCondition[]>;
export type TransactionFilter = {
  contract: string;
  chosenCoins: string[];
  conditions: BuyConditionsByDenom;
};

export function checkTransaction(filter: TransactionFilter, transaction: TxInfo.Data) {
  if (
    transaction.tx.value.msg.some((m) => {
      if (
        m.type === 'wasm/MsgExecuteContract' &&
        filter.contract === m.value.contract &&
        m.value.execute_msg
      ) {
        const parsedExecuteMsg: ProvideLiquidityParam = JSON.parse(
          Buffer.from(m.value.execute_msg as unknown as string, 'base64').toString('utf8'),
        );

        if (parsedExecuteMsg && 'provide_liquidity' in parsedExecuteMsg) {
          const currencyAmount = parsedExecuteMsg.provide_liquidity.assets.find(
            (a) => 'native_token' in a.info,
          ) as LiquidityCurrencyAmount;

          const denom = currencyAmount.info.native_token.denom;

          return Boolean(
            filter.chosenCoins.includes(denom) &&
              filter.conditions[denom]?.some(
                (condition) => +currencyAmount.amount >= condition.greaterOrEqual,
              ),
          );
        }
      }
    })
  ) {
    return true;
  }
  return false;
}
