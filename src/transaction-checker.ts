import { MsgExecuteContract, TxInfo } from '@terra-money/terra.js';
import { firstValueFrom, of } from 'rxjs';
import { filter, flatMap, map, mergeMap, toArray } from 'rxjs/operators';

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

type BuyCondition = { greaterOrEqual: number; buy: number };
export type BuyConditionsByDenom = Record<string, BuyCondition[]>;
export type TransactionFilter = {
  contract: string;
  chosenCoins: string[];
  conditions: BuyConditionsByDenom;
  maxTokenPrice?: number;
};

export async function checkTransaction(
  transactionFilter: TransactionFilter,
  transaction: TxInfo.Data,
) {
  const source = of(transaction).pipe(
    mergeMap((t) => t.tx.value.msg),
    filter((m): m is MsgExecuteContract.Data => m.type === 'wasm/MsgExecuteContract'),
    filter((m) => transactionFilter.contract === m.value.contract),
    filter((m) => Boolean(m.value.execute_msg)),
    map((m) => ({
      ...m.value,
      execute_msg: JSON.parse(
        Buffer.from(m.value.execute_msg as unknown as string, 'base64').toString('utf8'),
      ) as ProvideLiquidityParam,
    })),
    filter((m) => m.execute_msg && 'provide_liquidity' in m.execute_msg),
    map((m) => {
      const currencyAmount = m.execute_msg.provide_liquidity.assets.find(
        (a) => 'native_token' in a.info,
      ) as LiquidityCurrencyAmount;
      const tokenAmount = m.execute_msg.provide_liquidity.assets.find(
        (a) => 'token' in a.info,
      ) as LiquidityTokenAmount;

      const denom = currencyAmount.info.native_token.denom;
      const satisfiedCondition =
        transactionFilter.chosenCoins.includes(denom) &&
        transactionFilter.conditions[denom]?.find(
          checkCondition(
            +tokenAmount.amount,
            +currencyAmount.amount,
            transactionFilter.maxTokenPrice,
          ),
        );

      return satisfiedCondition
        ? {
            contract: m.contract,
            denom,
            toBuy: satisfiedCondition.buy,
            liquidity: { currency: currencyAmount.amount, token: tokenAmount.amount },
          }
        : null;
    }),
    filter(Boolean),
    toArray(),
  );

  return firstValueFrom(source);
}

const checkCondition =
  (totalToken: number, totalCurrency: number, maxTokenPrice?: number) =>
  (condition: BuyCondition) => {
    if (totalCurrency >= condition.greaterOrEqual) {
      if (!maxTokenPrice) return true;
      return maxTokenPrice >= calculateAverageTokenPrice(totalToken, totalCurrency, condition.buy);
    }
  };

function calculateAverageTokenPrice(
  totalToken: number,
  totalCurrency: number,
  currencyToBuy: number,
) {
  const bougthTokenAmount = (totalToken * currencyToBuy) / (totalCurrency + currencyToBuy);
  const bougthTokenAmountWithCommission = bougthTokenAmount * 0.997;
  const averageTokenPrice = currencyToBuy / bougthTokenAmountWithCommission;

  return averageTokenPrice;
}
