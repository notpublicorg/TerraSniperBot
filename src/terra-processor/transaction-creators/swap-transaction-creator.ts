import { Coin, LCDClient, MnemonicKey, MsgExecuteContract } from '@terra-money/terra.js';

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
            amount: buyAmount.toString(),
          },
        },
      },
      [new Coin(buyDenom, buyAmount)],
    );

    const gasPrices = gasPricesGetter();
    const tx = await wallet.createAndSignTx({
      msgs: [execute],
      gasAdjustment: config.gasAdjustment,
      gasPrices: gasPrices,
      feeDenoms: gasPrices.map((p) => p.denom),
    });

    const txBroadcastingInfo = await terra.tx.broadcastSync(tx);

    console.log(txBroadcastingInfo);
    // TODO: что-то он неправильно вычисляет походу

    // if (isTxError(txBroadcastingInfo))
    //   throw new Error(`${txBroadcastingInfo.txhash} - ${txBroadcastingInfo.raw_log}`);

    return { taskId, info: txBroadcastingInfo };
  };
