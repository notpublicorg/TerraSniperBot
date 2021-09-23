import { Denom } from '@terra-money/terra.js';

import { aTransaction, createWasmExecuteMsg } from './transaction-builder';
import { BuyConditionsByDenom, checkTransaction, TransactionFilter } from './transaction-checker';

const DEFAULT_COIN_DENOM = Denom.LUNA;
const DEFAULT_CONDITIONS: BuyConditionsByDenom = {
  [DEFAULT_COIN_DENOM]: [{ greaterOrEqual: 100 }],
};

const DEFAULT_FILTER: TransactionFilter = {
  contract: 'knownSmartContractToken',
  chosenCoins: [DEFAULT_COIN_DENOM],
  conditions: DEFAULT_CONDITIONS,
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
        execute_msg: {
          provide_liquidity: {
            assets: [{ amount: '1000', info: { native_token: { denom: Denom.USD } } }],
          },
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
        execute_msg: {
          provide_liquidity: {
            assets: [{ amount: '1000', info: { native_token: { denom: DEFAULT_COIN_DENOM } } }],
          },
        },
      }),
    ])
    .build();

  expect(
    checkTransaction(
      {
        ...DEFAULT_FILTER,
        conditions: { [DEFAULT_COIN_DENOM]: [{ greaterOrEqual: 10000 }] },
      },
      TRANSACTION,
    ),
  ).toBe(false);
});

it('should accept valid transaction which satisfies first condition', () => {
  const TRANSACTION = aTransaction()
    .withMsgs([
      createWasmExecuteMsg({
        contract: DEFAULT_FILTER.contract,
        execute_msg: {
          provide_liquidity: {
            assets: [{ amount: '1000', info: { native_token: { denom: DEFAULT_COIN_DENOM } } }],
          },
        },
      }),
    ])
    .build();

  expect(
    checkTransaction(
      {
        ...DEFAULT_FILTER,
        chosenCoins: [Denom.USD, DEFAULT_COIN_DENOM],
        conditions: {
          [Denom.USD]: [{ greaterOrEqual: 10 }],
          [DEFAULT_COIN_DENOM]: [{ greaterOrEqual: 10 }],
        },
      },
      TRANSACTION,
    ),
  ).toBe(true);
});

it('should accept the transaction which satisfies second condition', () => {
  const TRANSACTION = aTransaction()
    .withMsgs([
      createWasmExecuteMsg({
        contract: DEFAULT_FILTER.contract,
        execute_msg: {
          provide_liquidity: {
            assets: [{ amount: '1000', info: { native_token: { denom: DEFAULT_COIN_DENOM } } }],
          },
        },
      }),
    ])
    .build();

  expect(
    checkTransaction(
      {
        ...DEFAULT_FILTER,
        chosenCoins: [DEFAULT_COIN_DENOM],
        conditions: {
          [DEFAULT_COIN_DENOM]: [{ greaterOrEqual: 10000 }, { greaterOrEqual: 10 }],
        },
      },
      TRANSACTION,
    ),
  ).toBe(true);
});
