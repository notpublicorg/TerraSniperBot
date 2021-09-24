import { Denom, TxInfo } from '@terra-money/terra.js';
import { firstValueFrom, toArray } from 'rxjs';

import {
  BuyConditionsByDenom,
  smartContractWorkflow,
  TransactionFilter,
} from './smart-contract-workflow';
import { aTransaction, createWasmExecuteMsg } from './transaction-builder';

const DEFAULT_COIN_DENOM = Denom.LUNA;
const DEFAULT_CONDITIONS: BuyConditionsByDenom = {
  [DEFAULT_COIN_DENOM]: [{ greaterOrEqual: 100, buy: 10 }],
};

const DEFAULT_FILTER: TransactionFilter = {
  contractToSpy: 'knownSmartContractToken',
  chosenCoins: [DEFAULT_COIN_DENOM],
  conditions: DEFAULT_CONDITIONS,
};

function checkTransaction(transactionFilter: TransactionFilter[], transactions: TxInfo.Data[]) {
  const source = smartContractWorkflow(transactionFilter)(transactions).pipe(toArray());

  return firstValueFrom(source);
}

it('should reject non-execute transaction', async () => {
  const TRANSACTION = aTransaction().build();

  await expect(checkTransaction([DEFAULT_FILTER], [TRANSACTION])).resolves.toEqual([]);
});

it('should reject transaction with unknown contract', async () => {
  const TRANSACTION = aTransaction()
    .withMsgs([
      createWasmExecuteMsg({
        contract: 'unknown',
      }),
    ])
    .build();

  await expect(checkTransaction([DEFAULT_FILTER], [TRANSACTION])).resolves.toEqual([]);
});

it('should reject transaction without liquidity message', async () => {
  const TRANSACTION = aTransaction()
    .withMsgs([
      createWasmExecuteMsg({
        contract: DEFAULT_FILTER.contractToSpy,
        execute_msg: {},
      }),
    ])
    .build();

  await expect(checkTransaction([DEFAULT_FILTER], [TRANSACTION])).resolves.toEqual([]);
});

it('should reject transaction without chosen coin', async () => {
  const TRANSACTION = aTransaction()
    .withMsgs([
      createWasmExecuteMsg({
        contract: DEFAULT_FILTER.contractToSpy,
        execute_msg: {
          provide_liquidity: {
            assets: [{ amount: '1000', info: { native_token: { denom: Denom.USD } } }],
          },
        },
      }),
    ])
    .build();

  await expect(
    checkTransaction([{ ...DEFAULT_FILTER, chosenCoins: [Denom.LUNA] }], [TRANSACTION]),
  ).resolves.toEqual([]);
});

it('should reject if coin amount is less than amount given in condition', async () => {
  const TRANSACTION = aTransaction()
    .withMsgs([
      createWasmExecuteMsg({
        contract: DEFAULT_FILTER.contractToSpy,
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
      [
        {
          ...DEFAULT_FILTER,
          conditions: { [DEFAULT_COIN_DENOM]: [{ greaterOrEqual: 10000, buy: 10 }] },
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
        contract: DEFAULT_FILTER.contractToSpy,
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
      [
        {
          ...DEFAULT_FILTER,
          chosenCoins: [DEFAULT_COIN_DENOM],
          conditions: {
            [DEFAULT_COIN_DENOM]: [{ greaterOrEqual: 10000, buy: 10000 }],
          },
          maxTokenPrice: 20,
        },
      ],
      [TRANSACTION],
    ),
  ).resolves.toEqual([]);
});

it('should accept valid transaction which satisfies conditions and max token price', async () => {
  const LIQUIDITY_MSG = createWasmExecuteMsg({
    contract: DEFAULT_FILTER.contractToSpy,
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
  const NOT_APPLICABLE_TRANSACTION = aTransaction().build();

  await expect(
    checkTransaction(
      [
        {
          ...DEFAULT_FILTER,
          chosenCoins: [Denom.USD, DEFAULT_COIN_DENOM],
          conditions: {
            [Denom.USD]: [{ greaterOrEqual: 10, buy: 10 }],
            [DEFAULT_COIN_DENOM]: [{ greaterOrEqual: 10000, buy: 10000 }],
          },
          maxTokenPrice: 23,
        },
      ],
      [NOT_APPLICABLE_TRANSACTION, TRANSACTION],
    ),
  ).resolves.toEqual([
    {
      contract: DEFAULT_FILTER.contractToSpy,
      denom: DEFAULT_COIN_DENOM,
      toBuy: 10000,
      liquidity: { currency: '100000', token: '5000' },
    },
  ]);
});

it('should accept the transaction with 2 acceptable messages', async () => {
  const SMALL_LIQUIDITY = createWasmExecuteMsg({
    contract: DEFAULT_FILTER.contractToSpy,
    execute_msg: {
      provide_liquidity: {
        assets: [
          { amount: '5000', info: { token: { contract_addr: '' } } },
          { amount: '1000', info: { native_token: { denom: DEFAULT_COIN_DENOM } } },
        ],
      },
    },
  });
  const BIG_LIQUIDITY = createWasmExecuteMsg({
    contract: DEFAULT_FILTER.contractToSpy,
    execute_msg: {
      provide_liquidity: {
        assets: [
          { amount: '5000', info: { token: { contract_addr: '' } } },
          { amount: '100000', info: { native_token: { denom: DEFAULT_COIN_DENOM } } },
        ],
      },
    },
  });
  const TRANSACTION = aTransaction().withMsgs([SMALL_LIQUIDITY, BIG_LIQUIDITY]).build();

  await expect(
    checkTransaction(
      [
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
      ],
      [TRANSACTION],
    ),
  ).resolves.toEqual([
    {
      contract: DEFAULT_FILTER.contractToSpy,
      denom: DEFAULT_COIN_DENOM,
      toBuy: 10,
      liquidity: { currency: '1000', token: '5000' },
    },
    {
      contract: DEFAULT_FILTER.contractToSpy,
      denom: DEFAULT_COIN_DENOM,
      toBuy: 10000,
      liquidity: { currency: '100000', token: '5000' },
    },
  ]);
});

it('should accept transaction which satisfies second filter', async () => {
  const ALTERNATIVE_CONTRACT = 'alternative';

  const LIQUIDITY_MSG = createWasmExecuteMsg({
    contract: ALTERNATIVE_CONTRACT,
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
      [
        DEFAULT_FILTER,
        {
          contractToSpy: ALTERNATIVE_CONTRACT,
          chosenCoins: [DEFAULT_COIN_DENOM],
          conditions: {
            [DEFAULT_COIN_DENOM]: [{ greaterOrEqual: 10000, buy: 10000 }],
          },
        },
      ],
      [TRANSACTION],
    ),
  ).resolves.toEqual([
    {
      contract: ALTERNATIVE_CONTRACT,
      denom: DEFAULT_COIN_DENOM,
      toBuy: 10000,
      liquidity: { currency: '100000', token: '5000' },
    },
  ]);
});
