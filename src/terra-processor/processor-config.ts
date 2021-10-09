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

  walletAlias: string;
  walletPassword: string;

  closeTaskAfterPurchase: boolean;
  validBlockHeightOffset: number;
};
