import {
  Coin,
  Denom,
  isTxError,
  LCDClient,
  MnemonicKey,
  MsgExecuteContract,
  StdFee,
} from '@terra-money/terra.js';
import { filter, map, pipe, tap } from 'rxjs';

import { SniperTask } from '../sniper-task';
import { TasksProcessorUpdateParams } from '../tasks-processor';
import { terraAmountConverter } from './terra-amount-converter';
import { NewTransactionInfo, NewTransactionResult } from './types/new-transaction-info';

export const createNewTransactionPreparationFlow = (
  getTasks: () => SniperTask[],
  updateTask: (params: TasksProcessorUpdateParams) => void,
) =>
  pipe(
    map(
      ({ taskId, satisfiedBuyCondition, liquidity }): NewTransactionInfo => ({
        taskId,
        isTaskActive: getTasks().find((t) => t.id === taskId)?.status === 'active',
        buyDenom: satisfiedBuyCondition.denom,
        buyAmount: satisfiedBuyCondition.buy,
        pairContract: liquidity.pairContract,
      }),
    ),
    filter(({ isTaskActive }) => isTaskActive),
    tap(({ taskId }) => updateTask({ taskId, newStatus: 'blocked' })),
  );

export const sendTransaction =
  (terra: LCDClient, walletMnemonic: MnemonicKey) =>
  async ({
    taskId,
    pairContract,
    buyAmount,
    buyDenom,
  }: NewTransactionInfo): Promise<NewTransactionResult> => {
    const wallet = terra.wallet(walletMnemonic);

    const execute = new MsgExecuteContract(
      wallet.key.accAddress,
      pairContract,
      {
        swap: {
          offer_asset: {
            info: {
              native_token: {
                denom: buyDenom,
              },
            },
            amount: terraAmountConverter.toTerraFormat(buyAmount),
          },
        },
      },
      [new Coin(buyDenom, terraAmountConverter.toTerraFormat(buyAmount))],
    );

    const tx = await wallet.createAndSignTx({
      msgs: [execute],
      fee: new StdFee(1000000, [new Coin(Denom.USD, terraAmountConverter.toTerraFormat(5))]),
    });

    const txResult = await terra.tx.broadcast(tx);

    return { taskId, success: !isTxError(txResult), txResult };
  };
