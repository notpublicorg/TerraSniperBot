export type TerraTasksProcessorConfig = {
  tendermintApiUrl: string;
  tendermintWebsocketUrl: string;
  lcdUrl: string;
  lcdChainId: string;
  walletMnemonic: string;
  mempool: {
    defaultGas: number;
    defaultFeeDenom: string;
    defaultFee: number;
  };

  closeTaskAfterPurchase: boolean;
  validBlockHeightOffset: number;
};
