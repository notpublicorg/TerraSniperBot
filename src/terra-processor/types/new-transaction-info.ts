export type NewTransactionInfo = {
  taskId: string;
  isTaskActive: boolean;
  pairContract: string;
  buyAmount: number;
  buyDenom: string;
};

export type NewTransactionCreationInfo = {
  taskId: string;
  hash: string;
};

export type NewTransactionResult = {
  taskId: string;
  success: boolean;
  txhash: string;
  height: number;
};
