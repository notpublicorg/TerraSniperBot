import { BlockTxBroadcastResult } from '@terra-money/terra.js';

export type NewTransactionInfo = {
  taskId: string;
  pairContract: string;
  buyAmount: number;
  buyDenom: string;
};

export type NewTransactionResult = {
  taskId: string;
  success: boolean;
  txResult: BlockTxBroadcastResult;
};
