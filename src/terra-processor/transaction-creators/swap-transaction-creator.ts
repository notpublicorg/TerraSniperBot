import { Coin, LCDClient, MnemonicKey, MsgExecuteContract } from '@terra-money/terra.js';
import { APIRequester } from '@terra-money/terra.js/dist/client/lcd/APIRequester';

import { TransactionSender } from '../new-transaction-workflow';
import { NewTransactionCreationInfo, NewTransactionInfo } from '../types/new-transaction-info';
import { BroadcastResultResponse } from '../types/tendermint-responses';

export const swapTransactionCreator =
  (
    config: { walletMnemonic: MnemonicKey; gasAdjustment: string },
    deps: {
      terra: LCDClient;
      gasPricesGetter: () => Coin[];
      tendermintApi: APIRequester;
    },
  ): TransactionSender =>
  async ({
    taskId,
    pairContract,
    buyAmount,
    buyDenom,
  }: NewTransactionInfo): Promise<NewTransactionCreationInfo> => {
    const wallet = deps.terra.wallet(config.walletMnemonic);

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

    const gasPrices = deps.gasPricesGetter();
    const tx = await wallet.createAndSignTx({
      msgs: [execute],
      gasAdjustment: config.gasAdjustment,
      gasPrices: gasPrices,
      feeDenoms: gasPrices.map((p) => p.denom),
    });

    const encodedTx = await deps.terra.tx.encode(tx);
    const txBroadcastingResponse = await deps.tendermintApi.postRaw<BroadcastResultResponse>('/', {
      jsonrpc: '2.0',
      id: 1,
      method: 'broadcast_tx_sync',
      params: { tx: encodedTx },
    });

    // TODO: broadcast info (при успехе code=0, а не undefined. Проверять и то, и то ?

    return { taskId, info: txBroadcastingResponse.result };
  };
