export type TerraTasksProcessorConfig = {
  tendermintApiUrl: string;
  lcdUrl: string;
  lcdChainId: string;
  walletMnemonic: string;
  mempool: {
    defaultGas: number;
    defaultFeeDenom: string;
    defaultFee: number;
  };

  closeTaskAfterPurchase: boolean;
  timeoutHeightConstant: number;
};
