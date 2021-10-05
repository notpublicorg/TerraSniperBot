export type TerraTasksProcessorConfig = {
  tendermintApiUrl: string;
  lcdUrl: string;
  lcdChainId: string;
  walletMnemonic: string;
  gasAdjustment: string;
  mempool: {
    defaultGasPriceDenom: string;
    defaultGasPrice: number;
    minUusdPrice: number;
    minLunaPrice: number;
  };
};
