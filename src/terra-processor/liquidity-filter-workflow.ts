import { Msg, MsgExecuteContract, StdTx } from '@terra-money/terra.js';
import { Observable, pipe } from 'rxjs';
import { filter, map, mergeMap, take } from 'rxjs/operators';

import {
  LiquidityCurrencyAmount,
  LiquidityTokenAmount,
  ProvideLiquidityParam,
} from './types/liquidity';
import {
  BuyCondition,
  FiltrationResult,
  ParsedLiquidity,
  TransactionFilter,
} from './types/transaction-filter';
import { terraAmountConverter } from './utils/terra-types-converter';

export const createLiquidityFilterWorkflow = (
  getFiltersSource: () => Observable<TransactionFilter>,
) =>
  pipe(
    mergeMap((t: StdTx.Data['value']) => t.msg),
    filter(isValidSmartContract),
    map(parseLiquidityInfo),
    filter(Boolean),
    mergeMap((liquidity) =>
      getFiltersSource().pipe(
        filter((f) => f.contractToSpy === liquidity.token.contract),
        map(({ conditions, maxTokenPrice, taskId }): FiltrationResult | null => {
          const satisfiedBuyCondition = conditions.find(
            isLiquiditySatisfiesCondition(liquidity, maxTokenPrice),
          );

          return satisfiedBuyCondition ? { taskId, satisfiedBuyCondition, liquidity } : null;
        }),
        filter(Boolean),
        take(1),
      ),
    ),
  );

function isValidSmartContract(msg: Msg.Data): msg is MsgExecuteContract.Data {
  return msg.type === 'wasm/MsgExecuteContract' && Boolean(msg.value.execute_msg);
}

function parseLiquidityInfo({ value }: MsgExecuteContract.Data): ParsedLiquidity | null {
  const parsed: ProvideLiquidityParam =
    typeof value.execute_msg === 'string'
      ? JSON.parse(Buffer.from(value.execute_msg as unknown as string, 'base64').toString('utf8'))
      : value.execute_msg;

  if (!parsed || !parsed.provide_liquidity || !parsed.provide_liquidity.assets) return null;

  const currencyInfo = parsed.provide_liquidity.assets.find(
    (a) => 'native_token' in a.info,
  ) as LiquidityCurrencyAmount;
  const tokenInfo = parsed.provide_liquidity.assets.find(
    (a) => 'token' in a.info,
  ) as LiquidityTokenAmount;

  if (!currencyInfo || !tokenInfo) return null;

  return {
    pairContract: value.contract,
    token: {
      amount: terraAmountConverter.toNumber(tokenInfo.amount),
      contract: tokenInfo.info.token.contract_addr,
    },
    currency: {
      amount: terraAmountConverter.toNumber(currencyInfo.amount),
      denom: currencyInfo.info.native_token.denom,
    },
  };
}

const isLiquiditySatisfiesCondition =
  ({ currency, token }: ParsedLiquidity, maxTokenPrice?: number) =>
  (condition: BuyCondition) => {
    if (currency.denom !== condition.denom) return false;

    if (currency.amount < condition.greaterOrEqual) return false;

    if (!maxTokenPrice) return true;

    return (
      maxTokenPrice >= calculateAverageTokenPrice(token.amount, currency.amount, condition.buy)
    );
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
