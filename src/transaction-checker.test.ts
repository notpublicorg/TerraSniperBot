import { Denom } from '@terra-money/terra.js';

import { aTransaction, createWasmExecuteMsg } from './transaction-builder';
import { BuyConditionsByDenom, checkTransaction, TransactionFilter } from './transaction-checker';

const DEFAULT_COIN_DENOM = Denom.LUNA;
const DEFAULT_CONDITIONS: BuyConditionsByDenom = {
  [DEFAULT_COIN_DENOM]: [{ greaterOrEqual: 100, buy: 10 }],
};

const DEFAULT_FILTER: TransactionFilter = {
  contract: 'knownSmartContractToken',
  chosenCoins: [DEFAULT_COIN_DENOM],
  conditions: DEFAULT_CONDITIONS,
};

it('should reject non-execute transaction', async () => {
  const TRANSACTION = aTransaction().build();

  await expect(checkTransaction(DEFAULT_FILTER, TRANSACTION)).resolves.toEqual([]);
});

it('should reject transaction with unknown contract', async () => {
  const TRANSACTION = aTransaction()
    .withMsgs([
      createWasmExecuteMsg({
        contract: 'unknown',
      }),
    ])
    .build();

  await expect(checkTransaction(DEFAULT_FILTER, TRANSACTION)).resolves.toEqual([]);
});

it('should reject transaction without liquidity message', async () => {
  const TRANSACTION = aTransaction()
    .withMsgs([
      createWasmExecuteMsg({
        contract: DEFAULT_FILTER.contract,
        execute_msg: {},
      }),
    ])
    .build();

  await expect(checkTransaction(DEFAULT_FILTER, TRANSACTION)).resolves.toEqual([]);
});

it('should reject transaction without chosen coin', async () => {
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

  await expect(
    checkTransaction(
      {
        ...DEFAULT_FILTER,
        chosenCoins: [Denom.LUNA],
      },
      TRANSACTION,
    ),
  ).resolves.toEqual([]);
});

it('should reject if coin amount is less than amount given in condition', async () => {
  const TRANSACTION = aTransaction()
    .withMsgs([
      createWasmExecuteMsg({
        contract: DEFAULT_FILTER.contract,
        execute_msg: {
          provide_liquidity: {
            assets: [
              { amount: '5000', info: { token: { contract_addr: '' } } },
              { amount: '1000', info: { native_token: { denom: DEFAULT_COIN_DENOM } } },
            ],
          },
        },
      }),
    ])
    .build();

  await expect(
    checkTransaction(
      {
        ...DEFAULT_FILTER,
        conditions: { [DEFAULT_COIN_DENOM]: [{ greaterOrEqual: 10000, buy: 10 }] },
      },
      TRANSACTION,
    ),
  ).resolves.toEqual([]);
});

it("should reject if liquidity's average token price is bigger than given max token price", async () => {
  const TRANSACTION = aTransaction()
    .withMsgs([
      createWasmExecuteMsg({
        contract: DEFAULT_FILTER.contract,
        execute_msg: {
          provide_liquidity: {
            assets: [
              { amount: '100000', info: { native_token: { denom: DEFAULT_COIN_DENOM } } },
              { amount: '5000', info: { token: { contract_addr: '' } } },
            ],
          },
        },
      }),
    ])
    .build();

  await expect(
    checkTransaction(
      {
        ...DEFAULT_FILTER,
        chosenCoins: [DEFAULT_COIN_DENOM],
        conditions: {
          [DEFAULT_COIN_DENOM]: [{ greaterOrEqual: 10000, buy: 10000 }],
        },
        maxTokenPrice: 20,
      },
      TRANSACTION,
    ),
  ).resolves.toEqual([]);
});

it('should accept valid transaction which satisfies conditions and max token price', async () => {
  const LIQUIDITY_MSG = createWasmExecuteMsg({
    contract: DEFAULT_FILTER.contract,
    execute_msg: {
      provide_liquidity: {
        assets: [
          {
            amount: '100000',
            info: {
              native_token: { denom: DEFAULT_COIN_DENOM },
            },
          },
          {
            amount: '5000',
            info: {
              token: {
                contract_addr: '',
              },
            },
          },
        ],
      },
    },
  });
  const TRANSACTION = aTransaction().withMsgs([LIQUIDITY_MSG]).build();

  await expect(
    checkTransaction(
      {
        ...DEFAULT_FILTER,
        chosenCoins: [Denom.USD, DEFAULT_COIN_DENOM],
        conditions: {
          [Denom.USD]: [{ greaterOrEqual: 10, buy: 10 }],
          [DEFAULT_COIN_DENOM]: [{ greaterOrEqual: 10000, buy: 10000 }],
        },
        maxTokenPrice: 23,
      },
      TRANSACTION,
    ),
  ).resolves.toEqual([
    {
      contract: DEFAULT_FILTER.contract,
      denom: DEFAULT_COIN_DENOM,
      toBuy: 10000,
      liquidity: { currency: '100000', token: '5000' },
    },
  ]);
});

it('should accept the transaction with 2 acceptable messages', async () => {
  const LIQUIDITY_MSG = createWasmExecuteMsg({
    contract: DEFAULT_FILTER.contract,
    execute_msg: {
      provide_liquidity: {
        assets: [
          { amount: '5000', info: { token: { contract_addr: '' } } },
          { amount: '1000', info: { native_token: { denom: DEFAULT_COIN_DENOM } } },
        ],
      },
    },
  });
  const LIQUIDITY_MSG_2 = createWasmExecuteMsg({
    contract: DEFAULT_FILTER.contract,
    execute_msg: {
      provide_liquidity: {
        assets: [
          { amount: '5000', info: { token: { contract_addr: '' } } },
          { amount: '100000', info: { native_token: { denom: DEFAULT_COIN_DENOM } } },
        ],
      },
    },
  });
  const TRANSACTION = aTransaction().withMsgs([LIQUIDITY_MSG, LIQUIDITY_MSG_2]).build();

  await expect(
    checkTransaction(
      {
        ...DEFAULT_FILTER,
        chosenCoins: [DEFAULT_COIN_DENOM],
        conditions: {
          [DEFAULT_COIN_DENOM]: [
            { greaterOrEqual: 10000, buy: 10000 },
            { greaterOrEqual: 10, buy: 10 },
          ],
        },
      },
      TRANSACTION,
    ),
  ).resolves.toEqual([
    {
      contract: DEFAULT_FILTER.contract,
      denom: DEFAULT_COIN_DENOM,
      toBuy: 10,
      liquidity: { currency: '1000', token: '5000' },
    },
    {
      contract: DEFAULT_FILTER.contract,
      denom: DEFAULT_COIN_DENOM,
      toBuy: 10000,
      liquidity: { currency: '100000', token: '5000' },
    },
  ]);
});
