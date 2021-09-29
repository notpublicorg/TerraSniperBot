import { StdTx } from '@terra-money/terra.js';
import { APIRequester } from '@terra-money/terra.js/dist/client/lcd/APIRequester';
import { map, mergeMap, Observable, repeat } from 'rxjs';

import { UnconfirmedTxsResponse } from '../types/mempool-response';
import { TransactionMetaInfo } from '../types/meta';

export function createMempoolSource(config: { tendermintApiUrl: string; lcdApiUrl: string }) {
  const tendermintApi = new APIRequester(config.tendermintApiUrl);
  const lcdApi = new APIRequester(config.lcdApiUrl);

  const source = new Observable<string>((subscriber) => {
    // TODO: handle request errors
    tendermintApi.getRaw<UnconfirmedTxsResponse>('/unconfirmed_txs').then((mempoolResponse) => {
      mempoolResponse.result.txs.forEach((tx) => subscriber.next(tx));
      subscriber.complete();
    });
  });

  // TODO: handle decode error
  return source.pipe(
    map((tx) => ({
      tx,
      meta: {
        source: 'mempool',
        receivedDateTime: new Date().toLocaleString(),
      } as TransactionMetaInfo,
    })),
    mergeMap(({ tx, meta }) =>
      lcdApi
        .postRaw<{ result: StdTx.Data['value'] }>('/txs/decode', { tx })
        .then((response) => ({ tx: response.result, meta })),
    ),
    repeat(),
  );
}
