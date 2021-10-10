import { Coin, LCDClient, MnemonicKey, MsgExecuteContract, StdFee } from '@terra-money/terra.js';
import { APIRequester } from '@terra-money/terra.js/dist/client/lcd/APIRequester';

import { TransactionSender } from '../new-transaction-workflow';
import { BroadcastResultResponse } from '../types/tendermint-responses';
import { TransactionMetaJournal } from '../utils/transaction-meta-journal';

export const swapTransactionCreator =
  (
    config: { walletMnemonic: MnemonicKey; fee: StdFee; validBlockHeightOffset: number },
    deps: {
      terra: LCDClient;
      tendermintApi: APIRequester;
    },
  ) =>
  (metaJournal: TransactionMetaJournal): TransactionSender =>
  async ([{ taskId, pairContract, buyAmount, buyDenom }, { currentBlockHeight }]) => {
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

    const tx = await wallet.createAndSignTx({
      msgs: [execute],
      fee: config.fee,
      timeout_height: (+currentBlockHeight || 0) + 1 + config.validBlockHeightOffset,
    });
    metaJournal.onNewTransactionSigned();

    const encodedTx = await deps.terra.tx.encode(tx);
    metaJournal.onNewTransactionEncoded();

    const txBroadcastingResponse = await deps.tendermintApi.postRaw<BroadcastResultResponse>('/', {
      jsonrpc: '2.0',
      id: 1,
      method: 'broadcast_tx_sync',
      params: { tx: encodedTx },
    });

    // TODO: broadcast info (при успехе code=0, а не undefined. Проверять и то, и то ?

    return { taskId, hash: txBroadcastingResponse.result.hash };
  };
