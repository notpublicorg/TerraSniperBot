export type TerraTasksProcessorConfig = {
  tendermintApiUrl: string;
  lcdUrl: string;
  lcdChainId: string;
  mempool: {
    defaultGas: number;
    defaultFeeDenom: string;
    defaultFee: number;
  };

  walletAlias: string;
  walletPassword: string;

  closeTaskAfterPurchase: boolean;
  validBlockHeightOffset: number | false;
  requestBlockHeigthRetryCount: number;

  maxEncodedTransactionTextLength: number;
  liquidityCheckActivated: boolean;
};
