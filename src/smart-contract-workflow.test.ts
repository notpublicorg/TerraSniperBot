import { Denom, TxInfo } from '@terra-money/terra.js';
import { firstValueFrom, from, toArray } from 'rxjs';

import { createSmartContractWorkflow } from './smart-contract-workflow';
import { aTransaction, createWasmExecuteMsg } from './transaction-builder';
import { BuyCondition, TransactionFilter } from './types/transaction-filter';

const DEFAULT_COIN_DENOM = Denom.LUNA;
const DEFAULT_CONDITIONS: BuyCondition[] = [
  { denom: DEFAULT_COIN_DENOM, greaterOrEqual: 100, buy: 10 },
];
const DEFAULT_FILTER: TransactionFilter = {
  contractToSpy: 'knownSmartContractToken',
  conditions: DEFAULT_CONDITIONS,
};

function checkTransaction(transactionFilter: TransactionFilter[], transactions: TxInfo.Data[]) {
  return firstValueFrom(
    createSmartContractWorkflow(transactionFilter)(from(transactions)).pipe(toArray()),
  );
}

it('should reject non-execute transaction', async () => {
  const TRANSACTION = aTransaction().build();

  await expect(checkTransaction([DEFAULT_FILTER], [TRANSACTION])).resolves.toEqual([]);
});

it('should reject transaction without liquidity message', async () => {
  const TRANSACTION = aTransaction().withMsgs([createWasmExecuteMsg()]).build();

  await expect(checkTransaction([DEFAULT_FILTER], [TRANSACTION])).resolves.toEqual([]);
});

it('should reject transaction with unknown contract', async () => {
  const TRANSACTION = aTransaction()
    .withMsgs([
      createWasmExecuteMsg({
        token: { contract: 'unknown', amount: '' },
        currency: { denom: DEFAULT_COIN_DENOM, amount: '' },
      }),
    ])
    .build();

  await expect(checkTransaction([DEFAULT_FILTER], [TRANSACTION])).resolves.toEqual([]);
});

it('should reject transaction without chosen coin', async () => {
  const TRANSACTION = aTransaction()
    .withMsgs([
      createWasmExecuteMsg({
        token: { contract: DEFAULT_FILTER.contractToSpy, amount: '' },
        currency: { denom: Denom.USD, amount: '1000' },
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
      createWasmExecuteMsg({
        token: { contract: DEFAULT_FILTER.contractToSpy, amount: '5000' },
        currency: { denom: DEFAULT_COIN_DENOM, amount: '1000' },
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
      createWasmExecuteMsg({
        token: { contract: DEFAULT_FILTER.contractToSpy, amount: '5000' },
        currency: { denom: DEFAULT_COIN_DENOM, amount: '100000' },
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
  const LIQUIDITY_MSG = createWasmExecuteMsg({
    token: { contract: DEFAULT_FILTER.contractToSpy, amount: '5000' },
    currency: { denom: DEFAULT_COIN_DENOM, amount: '100000' },
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
      satisfiedBuyCondition: { denom: DEFAULT_COIN_DENOM, greaterOrEqual: 10000, buy: 10000 },
      liquidity: {
        token: { amount: '5000', contract: DEFAULT_FILTER.contractToSpy },
        currency: { amount: '100000', denom: DEFAULT_COIN_DENOM },
      },
    },
  ]);
});

it('should accept the transaction with 2 acceptable messages', async () => {
  const SMALL_LIQUIDITY = createWasmExecuteMsg({
    token: { contract: DEFAULT_FILTER.contractToSpy, amount: '5000' },
    currency: { denom: DEFAULT_COIN_DENOM, amount: '1000' },
  });
  const BIG_LIQUIDITY = createWasmExecuteMsg({
    token: { contract: DEFAULT_FILTER.contractToSpy, amount: '5000' },
    currency: { denom: DEFAULT_COIN_DENOM, amount: '100000' },
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
      satisfiedBuyCondition: { denom: DEFAULT_COIN_DENOM, greaterOrEqual: 10, buy: 10 },
      liquidity: {
        token: { amount: '5000', contract: DEFAULT_FILTER.contractToSpy },
        currency: { amount: '1000', denom: DEFAULT_COIN_DENOM },
      },
    },
    {
      satisfiedBuyCondition: { denom: DEFAULT_COIN_DENOM, greaterOrEqual: 10000, buy: 10000 },
      liquidity: {
        token: { amount: '5000', contract: DEFAULT_FILTER.contractToSpy },
        currency: { amount: '100000', denom: DEFAULT_COIN_DENOM },
      },
    },
  ]);
});

it('should accept transaction which satisfies second filter', async () => {
  const ALTERNATIVE_CONTRACT = 'alternative';

  const LIQUIDITY_MSG = createWasmExecuteMsg({
    token: { contract: ALTERNATIVE_CONTRACT, amount: '5000' },
    currency: { denom: DEFAULT_COIN_DENOM, amount: '100000' },
  });
  const TRANSACTION = aTransaction().withMsgs([LIQUIDITY_MSG]).build();

  await expect(
    checkTransaction(
      [
        DEFAULT_FILTER,
        {
          contractToSpy: ALTERNATIVE_CONTRACT,
          conditions: [{ denom: DEFAULT_COIN_DENOM, greaterOrEqual: 10000, buy: 10000 }],
        },
      ],
      [TRANSACTION],
    ),
  ).resolves.toEqual([
    {
      satisfiedBuyCondition: { denom: DEFAULT_COIN_DENOM, greaterOrEqual: 10000, buy: 10000 },
      liquidity: {
        token: { amount: '5000', contract: ALTERNATIVE_CONTRACT },
        currency: { amount: '100000', denom: DEFAULT_COIN_DENOM },
      },
    },
  ]);
});
