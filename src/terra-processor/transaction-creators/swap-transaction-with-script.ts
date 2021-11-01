import { StdFee } from '@terra-money/terra.js';

import { sendTransaction } from '../external/send-transaction';
import { TendermintAPILocal } from '../external/tendermintAPI';
import { TransactionSender } from '../new-transaction-workflow';
import { retryAction } from '../utils/retry-and-continue';
import { TransactionMetaJournal } from '../utils/transaction-meta-journal';

export const getTimeoutHeight =
  (
    tendermintApi: TendermintAPILocal,
    { validBlockHeightOffset }: { validBlockHeightOffset: number | false },
  ) =>
  async () => {
    if (typeof validBlockHeightOffset !== 'number') return;

    const currentBlockHeight = await tendermintApi.getCurrentBlockHeight();

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
    tendermintApi: TendermintAPILocal;
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
