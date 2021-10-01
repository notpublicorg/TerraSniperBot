export type TerraTasksProcessorConfig = {
  tendermintWebsocketUrl: string;
  tendermintApiUrl: string;
  lcdUrl: string;
  lcdChainId: string;
  walletMnemonic: string;
  gasAdjustment: string;
  block: {
    defaultGasPriceDenom: string;
    defaultGasPrice: number;
  };
  mempool: {
    defaultGasPriceDenom: string;
    defaultGasPrice: number;
    minUusdPrice: number;
    minLunaPrice: number;
  };
};
