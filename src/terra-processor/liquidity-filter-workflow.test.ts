import { TxInfo } from '@terra-money/terra.js';
import { firstValueFrom, from, map, mergeMap, toArray } from 'rxjs';

import { filterLiquidity } from './filter-liquidity';
import { tryGetLiquidityMsgs } from './parse-liquidity';
import { TransactionFilter } from './types/transaction-filter';
import { Denom } from './utils/denom';
import { terraAmountConverter } from './utils/terra-types-converter';
import { aTransaction, createWasmExecuteMsg } from './utils/transaction-builder';
import { aTransactionFilter } from './utils/transaction-filter-builder';

const { toTerraFormat } = terraAmountConverter;

const PAIR_CONTRACT = 'pairContract';
const DEFAULT_COIN_DENOM = Denom.LUNA;

function checkTransaction(transactionFilter: TransactionFilter[], transactions: TxInfo.Data[]) {
  return firstValueFrom(
    from(transactions).pipe(
      map((t) => t.tx.value),
      tryGetLiquidityMsgs,
      mergeMap((l) => from(transactionFilter).pipe(filterLiquidity(l))),
      toArray(),
    ),
  );
}

it('should reject non-execute transaction', async () => {
  const TRANSACTION = aTransaction().build();
  const FILTER = aTransactionFilter().build();

  await expect(checkTransaction([FILTER], [TRANSACTION])).resolves.toEqual([]);
});

it('should reject transaction without liquidity message', async () => {
  const TRANSACTION = aTransaction()
    .withMsgs([createWasmExecuteMsg(PAIR_CONTRACT)])
    .build();
  const FILTER = aTransactionFilter().build();

  await expect(checkTransaction([FILTER], [TRANSACTION])).resolves.toEqual([]);
});

it('should reject transaction with unknown contract', async () => {
  const TRANSACTION = aTransaction()
    .withMsgs([
      createWasmExecuteMsg(PAIR_CONTRACT, {
        token: { contract: 'unknown', amount: 0 },
        currency: { denom: DEFAULT_COIN_DENOM, amount: 0 },
      }),
    ])
    .build();
  const FILTER = aTransactionFilter().build();

  await expect(checkTransaction([FILTER], [TRANSACTION])).resolves.toEqual([]);
});

it('should reject transaction without chosen coin', async () => {
  const FILTER = aTransactionFilter()
    .with('conditions', [{ denom: Denom.LUNA, greaterOrEqual: 100, buy: 10 }])
    .build();
  const TRANSACTION = aTransaction()
    .withMsgs([
      createWasmExecuteMsg(PAIR_CONTRACT, {
        token: { contract: FILTER.contractToSpy, amount: 0 },
        currency: { denom: Denom.USD, amount: 1000 },
      }),
    ])
    .build();

  await expect(checkTransaction([FILTER], [TRANSACTION])).resolves.toEqual([]);
});

it('should reject if coin amount is less than amount given in condition', async () => {
  const FILTER = aTransactionFilter()
    .with('conditions', [
      {
        denom: DEFAULT_COIN_DENOM,
        greaterOrEqual: toTerraFormat(10000),
        buy: toTerraFormat(10),
      },
    ])
    .build();
  const TRANSACTION = aTransaction()
    .withMsgs([
      createWasmExecuteMsg(PAIR_CONTRACT, {
        token: { contract: FILTER.contractToSpy, amount: 5000 },
        currency: { denom: DEFAULT_COIN_DENOM, amount: 1000 },
      }),
    ])
    .build();

  await expect(checkTransaction([FILTER], [TRANSACTION])).resolves.toEqual([]);
});

it('should accept the transaction with 2 acceptable messages', async () => {
  const FILTER = aTransactionFilter()
    .with('conditions', [
      {
        denom: DEFAULT_COIN_DENOM,
        greaterOrEqual: toTerraFormat(10000),
        buy: toTerraFormat(10000),
      },
      {
        denom: DEFAULT_COIN_DENOM,
        greaterOrEqual: toTerraFormat(10),
        buy: toTerraFormat(10),
      },
    ])
    .build();
  const SMALL_LIQUIDITY = createWasmExecuteMsg(PAIR_CONTRACT, {
    token: { contract: FILTER.contractToSpy, amount: 5000 },
    currency: { denom: DEFAULT_COIN_DENOM, amount: 1000 },
  });
  const BIG_LIQUIDITY = createWasmExecuteMsg(PAIR_CONTRACT, {
    token: { contract: FILTER.contractToSpy, amount: 5000 },
    currency: { denom: DEFAULT_COIN_DENOM, amount: 100000 },
  });
  const TRANSACTION = aTransaction().withMsgs([SMALL_LIQUIDITY, BIG_LIQUIDITY]).build();

  await expect(checkTransaction([FILTER], [TRANSACTION])).resolves.toEqual([
    {
      taskId: FILTER.taskId,
      satisfiedBuyCondition: {
        denom: DEFAULT_COIN_DENOM,
        greaterOrEqual: toTerraFormat(10),
        buy: toTerraFormat(10),
      },
      liquidity: {
        pairContract: PAIR_CONTRACT,
        token: {
          amount: toTerraFormat(5000),
          contract: FILTER.contractToSpy,
        },
        currency: { amount: toTerraFormat(1000), denom: DEFAULT_COIN_DENOM },
      },
    },
    {
      taskId: FILTER.taskId,
      satisfiedBuyCondition: {
        denom: DEFAULT_COIN_DENOM,
        greaterOrEqual: toTerraFormat(10000),
        buy: toTerraFormat(10000),
      },
      liquidity: {
        pairContract: PAIR_CONTRACT,
        token: {
          amount: toTerraFormat(5000),
          contract: FILTER.contractToSpy,
        },
        currency: { amount: toTerraFormat(100000), denom: DEFAULT_COIN_DENOM },
      },
    },
  ]);
});

it('should accept transaction which satisfies second filter', async () => {
  const ALTERNATIVE_FILTER = aTransactionFilter()
    .with('taskId', 'alternativeTaskId')
    .with('contractToSpy', 'alternative')
    .with('conditions', [
      {
        denom: DEFAULT_COIN_DENOM,
        greaterOrEqual: toTerraFormat(100000),
        buy: toTerraFormat(100000),
      },
    ])
    .build();

  const LIQUIDITY_MSG = createWasmExecuteMsg(PAIR_CONTRACT, {
    token: { contract: ALTERNATIVE_FILTER.contractToSpy, amount: 5000 },
    currency: { denom: DEFAULT_COIN_DENOM, amount: 100000 },
  });
  const TRANSACTION = aTransaction().withMsgs([LIQUIDITY_MSG]).build();

  await expect(
    checkTransaction([aTransactionFilter().build(), ALTERNATIVE_FILTER], [TRANSACTION]),
  ).resolves.toEqual([
    {
      taskId: 'alternativeTaskId',
      satisfiedBuyCondition: {
        denom: DEFAULT_COIN_DENOM,
        greaterOrEqual: toTerraFormat(100000),
        buy: toTerraFormat(100000),
      },
      liquidity: {
        pairContract: PAIR_CONTRACT,
        token: { amount: toTerraFormat(5000), contract: ALTERNATIVE_FILTER.contractToSpy },
        currency: { amount: toTerraFormat(100000), denom: DEFAULT_COIN_DENOM },
      },
    },
  ]);
});

test.only.each([
  [
    { greaterOrEqual: 10000, toBuy: 10000, maxTokenPrice: 20 },
    { token: 5000, currency: 100000 },
    { satisfiedConditionCount: 0 },
  ],
  [
    { greaterOrEqual: 10000, toBuy: 10000, maxTokenPrice: 23 },
    { token: 5000, currency: 100000 },
    { satisfiedConditionCount: 1 },
  ],
  [
    { greaterOrEqual: 10, toBuy: 10, maxTokenPrice: 1 },
    { token: 10, currency: 10 },
    { satisfiedConditionCount: 0 },
  ],
  [
    { greaterOrEqual: 10, toBuy: 10, maxTokenPrice: 2 },
    { token: 10, currency: 10 },
    { satisfiedConditionCount: 0 },
  ],
])('max token price with %s and %s', async (condition, liquidity, result) => {
  const FILTER = aTransactionFilter()
    .with('conditions', [
      {
        denom: Denom.USD,
        greaterOrEqual: toTerraFormat(condition.greaterOrEqual),
        buy: toTerraFormat(condition.toBuy),
      },
    ])
    .with('maxTokenPrice', condition.maxTokenPrice)
    .build();
  const TRANSACTION = aTransaction()
    .withMsgs([
      createWasmExecuteMsg(PAIR_CONTRACT, {
        token: { contract: FILTER.contractToSpy, amount: liquidity.token },
        currency: { denom: Denom.USD, amount: liquidity.currency },
      }),
    ])
    .build();

  const filtrationResult = await checkTransaction([FILTER], [TRANSACTION]);

  expect(filtrationResult).toHaveLength(result.satisfiedConditionCount);
});
