import { MsgExecuteContract, TxInfo } from '@terra-money/terra.js';
import { firstValueFrom, of } from 'rxjs';
import { filter, toArray } from 'rxjs/operators';

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
  const source = of(...transaction.tx.value.msg).pipe(
    filter((m) =>
      Boolean(
        m.type === 'wasm/MsgExecuteContract' &&
          transactionFilter.contract === m.value.contract &&
          m.value.execute_msg,
      ),
    ),
    filter((m: MsgExecuteContract.Data) => {
      const parsedExecuteMsg: ProvideLiquidityParam = JSON.parse(
        Buffer.from(m.value.execute_msg as unknown as string, 'base64').toString('utf8'),
      );

      if (parsedExecuteMsg && 'provide_liquidity' in parsedExecuteMsg) {
        const currencyAmount = parsedExecuteMsg.provide_liquidity.assets.find(
          (a) => 'native_token' in a.info,
        ) as LiquidityCurrencyAmount;
        const tokenAmount = parsedExecuteMsg.provide_liquidity.assets.find(
          (a) => 'token' in a.info,
        ) as LiquidityTokenAmount;

        const denom = currencyAmount.info.native_token.denom;
        const satisfiedCondition =
          transactionFilter.chosenCoins.includes(denom) &&
          transactionFilter.conditions[denom]?.find(
            (condition) =>
              +currencyAmount.amount >= condition.greaterOrEqual &&
              (!transactionFilter.maxTokenPrice ||
                transactionFilter.maxTokenPrice >=
                  calculateAverageTokenPrice(
                    +tokenAmount.amount,
                    +currencyAmount.amount,
                    condition.buy,
                  )),
          );

        return Boolean(satisfiedCondition);
      }
    }),
    toArray(),
  );

  return firstValueFrom(source);
}

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
