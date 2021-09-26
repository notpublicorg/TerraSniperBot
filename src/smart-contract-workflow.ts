import { Msg, MsgExecuteContract, TxInfo } from '@terra-money/terra.js';
import { from, Observable } from 'rxjs';
import { filter, map, mergeMap, take } from 'rxjs/operators';

import {
  LiquidityCurrencyAmount,
  LiquidityTokenAmount,
  ParsedLiquidity,
  ProvideLiquidityParam,
} from './types/liquidity';
import { BuyCondition, TransactionFilter } from './types/transaction-filter';

export const createSmartContractWorkflow =
  (transactionFilters: TransactionFilter[]) => (transactions: Observable<TxInfo.Data>) =>
    transactions.pipe(
      mergeMap((t) => t.tx.value.msg),
      filter(isValidSmartContract),
      mergeMap(processMsgWithFilters(from(transactionFilters))),
    );

const processMsgWithFilters =
  (transactionFilter: Observable<TransactionFilter>) => (message: MsgExecuteContract.Data) =>
    transactionFilter.pipe(
      filter((f) => f.contractToSpy === message.value.contract),
      map((f) => {
        const liquidity = parseLiquidityInfo(message);

        if (!liquidity) return null;

        return {
          conditions: f.conditions,
          maxTokenPrice: f.maxTokenPrice,
          contract: message.value.contract,
          liquidity,
        };
      }),
      filter(Boolean),
      map(({ conditions, maxTokenPrice, liquidity, contract }) => {
        const satisfiedBuyCondition = conditions.find(
          isLiquiditySatisfiesCondition(liquidity, maxTokenPrice),
        );

        return satisfiedBuyCondition ? { contract, satisfiedBuyCondition, liquidity } : null;
      }),
      filter(Boolean),
      take(1),
    );

function isValidSmartContract(msg: Msg.Data): msg is MsgExecuteContract.Data {
  return msg.type === 'wasm/MsgExecuteContract' && Boolean(msg.value.execute_msg);
}

function parseLiquidityInfo({ value }: MsgExecuteContract.Data): ParsedLiquidity | null {
  const parsed: ProvideLiquidityParam =
    typeof value.execute_msg === 'string'
      ? JSON.parse(Buffer.from(value.execute_msg as unknown as string, 'base64').toString('utf8'))
      : value.execute_msg;

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

const isLiquiditySatisfiesCondition =
  ({ currency, token }: ParsedLiquidity, maxTokenPrice?: number) =>
  (condition: BuyCondition) => {
    if (currency.denom !== condition.denom) return false;

    const currencyAmount = +currency.amount;
    const tokenAmount = +token.amount;

    if (currencyAmount < condition.greaterOrEqual) return false;

    if (!maxTokenPrice) return true;

    return maxTokenPrice >= calculateAverageTokenPrice(tokenAmount, currencyAmount, condition.buy);
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
