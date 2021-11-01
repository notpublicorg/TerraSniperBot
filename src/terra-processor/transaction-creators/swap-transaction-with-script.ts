import { StdFee } from '@terra-money/terra.js';
import { APIRequester } from '@terra-money/terra.js/dist/client/lcd/APIRequester';

import { TransactionSender } from '../new-transaction-workflow';
import { sendTransaction } from '../scripts';
import { StatusResponse } from '../types/tendermint-responses';
import { retryAction } from '../utils/retry-and-continue';
import { TransactionMetaJournal } from '../utils/transaction-meta-journal';

export const getTimeoutHeight =
  (
    tendermintApi: APIRequester,
    { validBlockHeightOffset }: { validBlockHeightOffset: number | false },
  ) =>
  async () => {
    if (typeof validBlockHeightOffset !== 'number') return;

    const statusResponse = await tendermintApi.getRaw<StatusResponse>('/status');
    const currentBlockHeight = +statusResponse.result.sync_info.latest_block_height;

    if (!currentBlockHeight)
      throw new Error(
        `Something wrong with getting block height - ${
          statusResponse.result.sync_info.latest_block_height
        }. Response = ${JSON.stringify(statusResponse)}`,
      );

    return currentBlockHeight + 1 + validBlockHeightOffset;
  };

export const swapTransactionWithScript =
  ({
    fee,
    validBlockHeightOffset,
    requestBlockHeigthRetryCount,
    chainId,
    walletAlias,
    walletPassword,
    tendermintApi,
  }: {
    fee: StdFee;
    validBlockHeightOffset: number | false;
    requestBlockHeigthRetryCount: number;
    chainId: string;
    walletAlias: string;
    walletPassword: string;
    tendermintApi: APIRequester;
  }) =>
  (metaJournal: TransactionMetaJournal): TransactionSender =>
  async ({ taskId, pairContract, buyAmount, buyDenom }) => {
    metaJournal.onBlockInfoFetchingStart();

    const timeoutHeight = await retryAction(
      getTimeoutHeight(tendermintApi, {
        validBlockHeightOffset,
      }),
      {
        retryCount: requestBlockHeigthRetryCount,
        errorLogger: console.log,
      },
    );

    const sendInfo = await sendTransaction({
      timeoutHeight,
      walletAlias,
      walletPassword,
      chainId,
      fee,
      pairContract,
      buyDenom,
      buyAmount,
      onStart: metaJournal.onScriptExecutingStart,
    });

    return { taskId, hash: sendInfo.txhash || '' };
  };
