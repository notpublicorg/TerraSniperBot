import { Denom } from '@terra-money/terra.js';

import { aTransaction, createWasmExecuteMsg } from './transaction-builder';
import { BuyCondition, checkTransaction } from './transaction-checker';

const DEFAULT_COIN_DENOM = Denom.LUNA;
const DEFAULT_CONDITION: BuyCondition = {
  [DEFAULT_COIN_DENOM]: { greaterOrEqual: 100 },
};

const DEFAULT_FILTER = {
  contract: 'knownSmartContractToken',
  chosenCoins: [DEFAULT_COIN_DENOM],
  condition: DEFAULT_CONDITION,
};

it('should reject non-execute transaction', () => {
  const TRANSACTION = aTransaction().build();

  expect(checkTransaction(DEFAULT_FILTER, TRANSACTION)).toBe(false);
});

it('should reject transaction with unknown contract', () => {
  const TRANSACTION = aTransaction()
    .withMsgs([
      createWasmExecuteMsg({
        contract: 'unknown',
      }),
    ])
    .build();

  expect(checkTransaction(DEFAULT_FILTER, TRANSACTION)).toBe(false);
});

it('should reject transaction without liquidity message', () => {
  const TRANSACTION = aTransaction()
    .withMsgs([
      createWasmExecuteMsg({
        contract: DEFAULT_FILTER.contract,
        execute_msg: {},
      }),
    ])
    .build();

  expect(checkTransaction(DEFAULT_FILTER, TRANSACTION)).toBe(false);
});

it('should reject transaction without chosen coin', () => {
  const TRANSACTION = aTransaction()
    .withMsgs([
      createWasmExecuteMsg({
        contract: DEFAULT_FILTER.contract,
        coins: [{ amount: '1000', denom: Denom.USD }],
        execute_msg: {
          provide_liquidity: {},
        },
      }),
    ])
    .build();

  expect(
    checkTransaction(
      {
        ...DEFAULT_FILTER,
        chosenCoins: [Denom.LUNA],
      },
      TRANSACTION,
    ),
  ).toBe(false);
});

it('should reject if coin amount is less than amount given in condition', () => {
  const TRANSACTION = aTransaction()
    .withMsgs([
      createWasmExecuteMsg({
        contract: DEFAULT_FILTER.contract,
        coins: [{ amount: '1000', denom: DEFAULT_COIN_DENOM }],
        execute_msg: {
          provide_liquidity: {},
        },
      }),
    ])
    .build();

  expect(
    checkTransaction(
      {
        ...DEFAULT_FILTER,
        condition: { [DEFAULT_COIN_DENOM]: { greaterOrEqual: 10000 } },
      },
      TRANSACTION,
    ),
  ).toBe(false);
});

it('should accept valid transaction with 1 matching coin', () => {
  const TRANSACTION = aTransaction()
    .withMsgs([
      createWasmExecuteMsg({
        contract: DEFAULT_FILTER.contract,
        coins: [{ amount: '1000', denom: DEFAULT_COIN_DENOM }],
        execute_msg: {
          provide_liquidity: {},
        },
      }),
    ])
    .build();

  expect(
    checkTransaction(
      {
        ...DEFAULT_FILTER,
        chosenCoins: [Denom.USD, DEFAULT_COIN_DENOM],
        condition: {
          [Denom.USD]: { greaterOrEqual: 10 },
          [DEFAULT_COIN_DENOM]: { greaterOrEqual: 10 },
        },
      },
      TRANSACTION,
    ),
  ).toBe(true);
});

it('should accept the transaction with both chosen coins but only second one satisfies the condition', () => {
  const TRANSACTION = aTransaction()
    .withMsgs([
      createWasmExecuteMsg({
        contract: DEFAULT_FILTER.contract,
        coins: [
          { amount: '5000', denom: Denom.USD },
          { amount: '1000', denom: DEFAULT_COIN_DENOM },
        ],
        execute_msg: {
          provide_liquidity: {},
        },
      }),
    ])
    .build();

  expect(
    checkTransaction(
      {
        ...DEFAULT_FILTER,
        chosenCoins: [Denom.USD, DEFAULT_COIN_DENOM],
        condition: {
          [Denom.USD]: { greaterOrEqual: 100000000 },
          [DEFAULT_COIN_DENOM]: { greaterOrEqual: 10 },
        },
      },
      TRANSACTION,
    ),
  ).toBe(true);
});
