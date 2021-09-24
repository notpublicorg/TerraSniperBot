import { MsgExecuteContract, TxInfo } from '@terra-money/terra.js';
import { firstValueFrom, of } from 'rxjs';
import { filter, map, mergeMap, take, toArray } from 'rxjs/operators';

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
  contractToSpy: string;
  chosenCoins: string[];
  conditions: BuyConditionsByDenom;
  maxTokenPrice?: number;
};

export async function checkTransaction(
  transactionFilter: TransactionFilter[],
  transaction: TxInfo.Data,
) {
  const source = of(transaction).pipe(
    mergeMap((t) => t.tx.value.msg),
    filter((m): m is MsgExecuteContract.Data => m.type === 'wasm/MsgExecuteContract'),
    filter((m) => Boolean(m.value.execute_msg)),
    mergeMap((m) =>
      of(...transactionFilter).pipe(
        filter((f) => f.contractToSpy === m.value.contract),
        map((f) => ({
          chosenCoins: f.chosenCoins,
          conditions: f.conditions,
          maxTokenPrice: f.maxTokenPrice,
          contract: m.value.contract,
          liquidity: parseLiquidityInfo(m),
        })),
        filter(({ liquidity }) => Boolean(liquidity)),
        map(({ chosenCoins, conditions, maxTokenPrice, liquidity, contract }) => {
          const currencyDenom = liquidity.currency.denom;
          const currencyAmount = liquidity.currency.amount;
          const tokenAmount = liquidity.token.amount;

          const satisfiedCondition =
            chosenCoins.includes(currencyDenom) &&
            conditions[currencyDenom]?.find(
              checkCondition(+tokenAmount, +currencyAmount, maxTokenPrice),
            );

          return satisfiedCondition
            ? {
                contract,
                denom: currencyDenom,
                toBuy: satisfiedCondition.buy,
                liquidity: { currency: currencyAmount, token: tokenAmount },
              }
            : null;
        }),
        filter(Boolean),
        take(1),
      ),
    ),
    toArray(),
  );

  return firstValueFrom(source);
}

function parseLiquidityInfo(txMsg: MsgExecuteContract.Data) {
  const parsed: ProvideLiquidityParam = JSON.parse(
    Buffer.from(txMsg.value.execute_msg as unknown as string, 'base64').toString('utf8'),
  );

  if (!parsed || !parsed.provide_liquidity) return null;

  const currencyInfo = parsed.provide_liquidity.assets.find(
    (a) => 'native_token' in a.info,
  ) as LiquidityCurrencyAmount;
  const tokenInfo = parsed.provide_liquidity.assets.find(
    (a) => 'token' in a.info,
  ) as LiquidityTokenAmount;

  if (!currencyInfo || !tokenInfo) return null;

  return {
    token: { amount: tokenInfo.amount },
    currency: { amount: currencyInfo.amount, denom: currencyInfo.info.native_token.denom },
  };
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
