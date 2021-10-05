import { BroadcastResultResponse } from './tendermint-responses';

export type NewTransactionInfo = {
  taskId: string;
  isTaskActive: boolean;
  pairContract: string;
  buyAmount: number;
  buyDenom: string;
};

export type NewTransactionCreationInfo = {
  taskId: string;
  info: BroadcastResultResponse['result'];
};

export type NewTransactionResult = {
  taskId: string;
  success: boolean;
  txhash: string;
  height: number;
};
