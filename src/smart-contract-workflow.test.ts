import { Denom, TxInfo } from '@terra-money/terra.js';
import { firstValueFrom, of, toArray } from 'rxjs';

import { smartContractWorkflow } from './smart-contract-workflow';
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
    smartContractWorkflow(transactionFilter)(of(...transactions)).pipe(toArray()),
  );
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
      contract: DEFAULT_FILTER.contractToSpy,
      satisfiedBuyCondition: { denom: DEFAULT_COIN_DENOM, greaterOrEqual: 10000, buy: 10000 },
      liquidity: {
        token: { amount: '5000' },
        currency: { amount: '100000', denom: DEFAULT_COIN_DENOM },
      },
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
      contract: DEFAULT_FILTER.contractToSpy,
      satisfiedBuyCondition: { denom: DEFAULT_COIN_DENOM, greaterOrEqual: 10, buy: 10 },
      liquidity: {
        token: { amount: '5000' },
        currency: { amount: '1000', denom: DEFAULT_COIN_DENOM },
      },
    },
    {
      contract: DEFAULT_FILTER.contractToSpy,
      satisfiedBuyCondition: { denom: DEFAULT_COIN_DENOM, greaterOrEqual: 10000, buy: 10000 },
      liquidity: {
        token: { amount: '5000' },
        currency: { amount: '100000', denom: DEFAULT_COIN_DENOM },
      },
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
          conditions: [{ denom: DEFAULT_COIN_DENOM, greaterOrEqual: 10000, buy: 10000 }],
        },
      ],
      [TRANSACTION],
    ),
  ).resolves.toEqual([
    {
      contract: ALTERNATIVE_CONTRACT,
      satisfiedBuyCondition: { denom: DEFAULT_COIN_DENOM, greaterOrEqual: 10000, buy: 10000 },
      liquidity: {
        token: { amount: '5000' },
        currency: { amount: '100000', denom: DEFAULT_COIN_DENOM },
      },
    },
  ]);
});
