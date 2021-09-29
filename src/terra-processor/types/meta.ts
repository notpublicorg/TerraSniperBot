import { BlockTxBroadcastResult } from '@terra-money/terra.js';

export type TransactionMetaInfo = {
  source?: 'block' | 'mempool';
  receivedDateTime: string;
  newTransactionSendStartDateTime: string;
  newTransactionSendEndDateTime: string;
  newTransactionBroadcastResult: BlockTxBroadcastResult;
};
