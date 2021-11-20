import { StdFee } from '@terra-money/terra.js';

import { sendTransaction } from './external/send-transaction';
import { TransactionSender } from './new-transaction-workflow';
import { TransactionMetaJournal } from './transaction-meta-journal';

export const swapTransactionWithScript =
  ({
    fee,
    chainId,
    walletAlias,
    walletPassword,
  }: {
    fee: StdFee;
    chainId: string;
    walletAlias: string;
    walletPassword: string;
  }) =>
  (metaJournal: TransactionMetaJournal): TransactionSender =>
  async ({ taskId, pairContract, buyAmount, buyDenom, timeoutHeight, maxSpread }) => {
    const sendInfo = await sendTransaction({
      timeoutHeight,
      walletAlias,
      walletPassword,
      chainId,
      fee,
      pairContract,
      buyDenom,
      buyAmount,
      maxSpread,
      onStart: metaJournal.onScriptExecutingStart,
    });

    return { taskId, hash: sendInfo.txhash || '' };
  };
