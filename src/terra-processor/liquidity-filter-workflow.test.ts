import { TxInfo } from '@terra-money/terra.js';
import { firstValueFrom, from, map, toArray } from 'rxjs';

import { createLiquidityFilterWorkflow } from './liquidity-filter-workflow';
import { BuyCondition, TransactionFilter } from './types/transaction-filter';
import { Denom } from './utils/denom';
import { aTransaction, createWasmExecuteMsg } from './utils/transaction-builder';

const PAIR_CONTRACT = 'pairContract';
const DEFAULT_COIN_DENOM = Denom.LUNA;
const DEFAULT_CONDITIONS: BuyCondition[] = [
  { denom: DEFAULT_COIN_DENOM, greaterOrEqual: 100, buy: 10 },
];
const DEFAULT_FILTER: TransactionFilter = {
  contractToSpy: 'knownSmartContractToken',
  taskId: 'defaultTaskId',
  conditions: DEFAULT_CONDITIONS,
};

function checkTransaction(transactionFilter: TransactionFilter[], transactions: TxInfo.Data[]) {
  return firstValueFrom(
    from(transactions).pipe(
      map((t) => t.tx.value),
      createLiquidityFilterWorkflow(() => from(transactionFilter)),
      toArray(),
    ),
  );
}

it('should reject non-execute transaction', async () => {
  const TRANSACTION = aTransaction().build();

  await expect(checkTransaction([DEFAULT_FILTER], [TRANSACTION])).resolves.toEqual([]);
});

it('should reject transaction without liquidity message', async () => {
  const TRANSACTION = aTransaction()
    .withMsgs([createWasmExecuteMsg(PAIR_CONTRACT)])
    .build();

  await expect(checkTransaction([DEFAULT_FILTER], [TRANSACTION])).resolves.toEqual([]);
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

  await expect(checkTransaction([DEFAULT_FILTER], [TRANSACTION])).resolves.toEqual([]);
});

it('should reject transaction without chosen coin', async () => {
  const TRANSACTION = aTransaction()
    .withMsgs([
      createWasmExecuteMsg(PAIR_CONTRACT, {
        token: { contract: DEFAULT_FILTER.contractToSpy, amount: 0 },
        currency: { denom: Denom.USD, amount: 1000 },
      }),
    ])
    .build();

  await expect(
    checkTransaction(
      [
        {
          ...DEFAULT_FILTER,
          conditions: [{ denom: Denom.LUNA, greaterOrEqual: 100, buy: 10 }],
        },
      ],
      [TRANSACTION],
    ),
  ).resolves.toEqual([]);
});

it('should reject if coin amount is less than amount given in condition', async () => {
  const TRANSACTION = aTransaction()
    .withMsgs([
      createWasmExecuteMsg(PAIR_CONTRACT, {
        token: { contract: DEFAULT_FILTER.contractToSpy, amount: 5000 },
        currency: { denom: DEFAULT_COIN_DENOM, amount: 1000 },
      }),
    ])
    .build();

  await expect(
    checkTransaction(
      [
        {
          ...DEFAULT_FILTER,
          conditions: [{ denom: DEFAULT_COIN_DENOM, greaterOrEqual: 10000, buy: 10 }],
        },
      ],
      [TRANSACTION],
    ),
  ).resolves.toEqual([]);
});

it("should reject if liquidity's average token price is bigger than given max token price", async () => {
  const TRANSACTION = aTransaction()
    .withMsgs([
      createWasmExecuteMsg(PAIR_CONTRACT, {
        token: { contract: DEFAULT_FILTER.contractToSpy, amount: 5000 },
        currency: { denom: DEFAULT_COIN_DENOM, amount: 100000 },
      }),
    ])
    .build();

  await expect(
    checkTransaction(
      [
        {
          ...DEFAULT_FILTER,
          conditions: [{ denom: DEFAULT_COIN_DENOM, greaterOrEqual: 10000, buy: 10000 }],
          maxTokenPrice: 20,
        },
      ],
      [TRANSACTION],
    ),
  ).resolves.toEqual([]);
});

it('should accept valid transaction which satisfies conditions and max token price', async () => {
  const LIQUIDITY_MSG = createWasmExecuteMsg(PAIR_CONTRACT, {
    token: { contract: DEFAULT_FILTER.contractToSpy, amount: 5000 },
    currency: { denom: DEFAULT_COIN_DENOM, amount: 100000 },
  });
  const TRANSACTION = aTransaction().withMsgs([LIQUIDITY_MSG]).build();
  const NOT_APPLICABLE_TRANSACTION = aTransaction().build();

  await expect(
    checkTransaction(
      [
        {
          ...DEFAULT_FILTER,
          conditions: [
            { denom: Denom.USD, greaterOrEqual: 10, buy: 10 },
            { denom: DEFAULT_COIN_DENOM, greaterOrEqual: 10000, buy: 10000 },
          ],
          maxTokenPrice: 23,
        },
      ],
      [NOT_APPLICABLE_TRANSACTION, TRANSACTION],
    ),
  ).resolves.toEqual([
    {
      taskId: DEFAULT_FILTER.taskId,
      satisfiedBuyCondition: { denom: DEFAULT_COIN_DENOM, greaterOrEqual: 10000, buy: 10000 },
      liquidity: {
        pairContract: PAIR_CONTRACT,
        token: { amount: 5000, contract: DEFAULT_FILTER.contractToSpy },
        currency: { amount: 100000, denom: DEFAULT_COIN_DENOM },
      },
    },
  ]);
});

it('should accept the transaction with 2 acceptable messages', async () => {
  const SMALL_LIQUIDITY = createWasmExecuteMsg(PAIR_CONTRACT, {
    token: { contract: DEFAULT_FILTER.contractToSpy, amount: 5000 },
    currency: { denom: DEFAULT_COIN_DENOM, amount: 1000 },
  });
  const BIG_LIQUIDITY = createWasmExecuteMsg(PAIR_CONTRACT, {
    token: { contract: DEFAULT_FILTER.contractToSpy, amount: 5000 },
    currency: { denom: DEFAULT_COIN_DENOM, amount: 100000 },
  });
  const TRANSACTION = aTransaction().withMsgs([SMALL_LIQUIDITY, BIG_LIQUIDITY]).build();

  await expect(
    checkTransaction(
      [
        {
          ...DEFAULT_FILTER,
          conditions: [
            { denom: DEFAULT_COIN_DENOM, greaterOrEqual: 10000, buy: 10000 },
            { denom: DEFAULT_COIN_DENOM, greaterOrEqual: 10, buy: 10 },
          ],
        },
      ],
      [TRANSACTION],
    ),
  ).resolves.toEqual([
    {
      taskId: DEFAULT_FILTER.taskId,
      satisfiedBuyCondition: { denom: DEFAULT_COIN_DENOM, greaterOrEqual: 10, buy: 10 },
      liquidity: {
        pairContract: PAIR_CONTRACT,
        token: { amount: 5000, contract: DEFAULT_FILTER.contractToSpy },
        currency: { amount: 1000, denom: DEFAULT_COIN_DENOM },
      },
    },
    {
      taskId: DEFAULT_FILTER.taskId,
      satisfiedBuyCondition: { denom: DEFAULT_COIN_DENOM, greaterOrEqual: 10000, buy: 10000 },
      liquidity: {
        pairContract: PAIR_CONTRACT,
        token: { amount: 5000, contract: DEFAULT_FILTER.contractToSpy },
        currency: { amount: 100000, denom: DEFAULT_COIN_DENOM },
      },
    },
  ]);
});

it('should accept transaction which satisfies second filter', async () => {
  const ALTERNATIVE_CONTRACT = 'alternative';

  const LIQUIDITY_MSG = createWasmExecuteMsg(PAIR_CONTRACT, {
    token: { contract: ALTERNATIVE_CONTRACT, amount: 5000 },
    currency: { denom: DEFAULT_COIN_DENOM, amount: 100000 },
  });
  const TRANSACTION = aTransaction().withMsgs([LIQUIDITY_MSG]).build();

  await expect(
    checkTransaction(
      [
        DEFAULT_FILTER,
        {
          taskId: 'alternativeTaskId',
          contractToSpy: ALTERNATIVE_CONTRACT,
          conditions: [{ denom: DEFAULT_COIN_DENOM, greaterOrEqual: 10000, buy: 10000 }],
        },
      ],
      [TRANSACTION],
    ),
  ).resolves.toEqual([
    {
      taskId: 'alternativeTaskId',
      satisfiedBuyCondition: { denom: DEFAULT_COIN_DENOM, greaterOrEqual: 10000, buy: 10000 },
      liquidity: {
        pairContract: PAIR_CONTRACT,
        token: { amount: 5000, contract: ALTERNATIVE_CONTRACT },
        currency: { amount: 100000, denom: DEFAULT_COIN_DENOM },
      },
    },
  ]);
});
