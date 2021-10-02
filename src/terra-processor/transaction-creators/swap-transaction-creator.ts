import { Coin, LCDClient, MnemonicKey, MsgExecuteContract, StdFee } from '@terra-money/terra.js';

import { TransactionSender } from '../new-transaction-workflow';
import { NewTransactionCreationInfo, NewTransactionInfo } from '../types/new-transaction-info';

export const swapTransactionCreator =
  (
    terra: LCDClient,
    config: { walletMnemonic: MnemonicKey; gasAdjustment: string },
    gasPricesGetter: () => Coin[],
  ): TransactionSender =>
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
            amount: buyAmount,
          },
        },
      },
      [new Coin(buyDenom, buyAmount)],
    );

    console.log(gasPricesGetter());
    const tx = await wallet.createAndSignTx({
      msgs: [execute],
      gasAdjustment: config.gasAdjustment,
      fee: new StdFee(20000, [new Coin('uusd', 1000000)]),
    });

    const txBroadcastingInfo = await terra.tx.broadcastSync(tx);

    // TODO: ориентироваться на code если он success то тогда искать
    console.log(txBroadcastingInfo);

    return { taskId, info: txBroadcastingInfo };
  };
