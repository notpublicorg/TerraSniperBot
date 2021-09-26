export type TendermintTxResponse = {
  type: 'tendermint/event/Tx';
  value: {
    TxResult: {
      height: string;
      result: Record<string, unknown>;
      tx: string;
      txhash: string;
    };
  };
};
