import { pipe } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';

import { BuyCondition, TransactionFilter } from './types/transaction-filter';
import { FiltrationResult, ParsedLiquidity } from './types/workflow';

export const filterLiquidity = (liquidity: ParsedLiquidity) =>
  pipe(
    filter((f: TransactionFilter) => f.contractToSpy === liquidity.token.contract),
    map(({ conditions, maxTokenPrice, taskId }): FiltrationResult | null => {
      const satisfiedBuyCondition = conditions.find(
        isLiquiditySatisfiesCondition(liquidity, maxTokenPrice),
      );

      return satisfiedBuyCondition ? { taskId, satisfiedBuyCondition, liquidity } : null;
    }),
    filter(Boolean),
    take(1),
  );

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
  // TODO: выровнять количество нулей у token и currency
  const bougthTokenAmount = (totalToken * currencyToBuy) / (totalCurrency + currencyToBuy);
  const bougthTokenAmountWithCommission = bougthTokenAmount * 0.997;
  const averageTokenPrice = currencyToBuy / bougthTokenAmountWithCommission;

  return averageTokenPrice;
}
