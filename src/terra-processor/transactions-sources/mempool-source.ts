import { StdTx } from '@terra-money/terra.js';
import { APIRequester } from '@terra-money/terra.js/dist/client/lcd/APIRequester';
import { filter, mergeMap, Observable, pipe } from 'rxjs';

import { UnconfirmedTxsResponse } from '../types/mempool-response';

export function createMempoolSource(tendermintApi: APIRequester) {
  const $source = new Observable<string>((subscriber) => {
    // TODO: handle request errors
    tendermintApi.getRaw<UnconfirmedTxsResponse>('/unconfirmed_txs').then((mempoolResponse) => {
      mempoolResponse.result.txs.forEach((tx) => subscriber.next(tx));
      subscriber.complete();
    });
  });

  return $source;
}

export const createTxFromEncoded = (lcdApi: APIRequester) =>
  pipe(
    mergeMap((tx) =>
      lcdApi.postRaw<{ result: StdTx.Data['value'] }>('/txs/decode', { tx }).catch((e) => {
        console.log(e);
        return null;
      }),
    ),
    filter(Boolean),
  );
