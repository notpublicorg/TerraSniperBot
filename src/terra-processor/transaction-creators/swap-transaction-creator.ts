import { Coin, Coins, LCDClient, MnemonicKey, MsgExecuteContract } from '@terra-money/terra.js';

import { TransactionSender } from '../new-transaction-workflow';
import { TerraProcessorCoin } from '../types/coin';
import { NewTransactionCreationInfo, NewTransactionInfo } from '../types/new-transaction-info';
import { terraAmountConverter, terraCoinConverter } from '../utils/terra-types-converter';

export const swapTransactionCreator =
  (
    terra: LCDClient,
    config: { walletMnemonic: MnemonicKey; gasAdjustment: string; gasPrices: TerraProcessorCoin[] },
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
            amount: terraAmountConverter.toTerraFormat(buyAmount),
          },
        },
      },
      [new Coin(buyDenom, terraAmountConverter.toTerraFormat(buyAmount))],
    );

    const tx = await wallet.createAndSignTx({
      msgs: [execute],
      gasAdjustment: config.gasAdjustment,
      gasPrices: Coins.fromData(terraCoinConverter.toTerraFormat(config.gasPrices)),
    });

    const txBroadcastingInfo = await terra.tx.broadcastAsync(tx);

    return { taskId, info: txBroadcastingInfo };
  };
