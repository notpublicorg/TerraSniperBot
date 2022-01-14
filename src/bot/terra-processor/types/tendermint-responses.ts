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
export type StatusResponse = {
  jsonrpc: string;
  id: number;
  result: {
    sync_info: {
      latest_block_hash: string; // '33BB28DA5FCCF1A565FA7FD37F20C8EF871419F32DDBDFAAA89C8A4DED98E1F9';
      latest_app_hash: string; // '151461D667AC7257964599C0915BACB13DAF1111C6FC6891FA964BE14DBB6CFB';
      latest_block_height: string; // '6037377';
      latest_block_time: string; // '2021-10-07T17:00:20.566565366Z';
      earliest_block_hash: string; // 'E88E3641A488EBA3D402FC072879C6399AA2CDC7B6CC5A3061E5A64D9FFD3BDE';
      earliest_app_hash: string; // 'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855';
      earliest_block_height: string; // '5900001';
      earliest_block_time: string; // '2021-09-28T09:00:00Z';
      catching_up: boolean; // false;
    };
  };
};
