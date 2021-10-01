import { Coin, Coins, LCDClient, MnemonicKey, MsgExecuteContract } from '@terra-money/terra.js';
import { filter, map, pipe, tap } from 'rxjs';

import { SniperTask } from '../sniper-task';
import { TasksProcessorUpdateParams } from '../tasks-processor';
import { terraAmountConverter } from './terra-amount-converter';
import { NewTransactionCreationInfo, NewTransactionInfo } from './types/new-transaction-info';

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

export const createTransactionSender =
  (
    terra: LCDClient,
    config: { walletMnemonic: MnemonicKey; gasAdjustment: string; gasPrices: Coin.Data[] },
  ) =>
  async ({
    taskId,
    pairContract,
    buyAmount,
    buyDenom,
  }: NewTransactionInfo): Promise<NewTransactionCreationInfo> => {
    const wallet = terra.wallet(config.walletMnemonic);

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
      gasAdjustment: config.gasAdjustment,
      gasPrices: Coins.fromData(config.gasPrices),
    });

    const txBroadcastingInfo = await terra.tx.broadcastAsync(tx);

    return { taskId, info: txBroadcastingInfo };
  };
