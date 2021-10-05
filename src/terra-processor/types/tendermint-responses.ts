export type WebsocketTxResponse = {
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
export type UnconfirmedTxsResponse = {
  id: number;
  jsonrpc: string;
  result: {
    n_txs: string; // '31';
    total: string; // '426';
    total_bytes: string; // '627810';
    txs: string[];
  };
};
export type BroadcastResultResponse = {
  jsonrpc: string;
  id: number;
  result: {
    code: number; // 0;
    data: string; // '';
    log: string; // '[]';
    codespace: string; // '';
    hash: string; // '4953170ADC6CBA9E37C7F08BFA05D7FC1ABC815C5DAF7EAF37372D5F54870348';
  };
};
