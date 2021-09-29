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
