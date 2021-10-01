import { StdTx } from '@terra-money/terra.js';
import { APIRequester } from '@terra-money/terra.js/dist/client/lcd/APIRequester';
import { filter, mergeMap, Observable, repeat } from 'rxjs';

import { UnconfirmedTxsResponse } from '../types/mempool-response';
import { TransactionMetaJournal } from '../utils/transaction-meta-journal';

export function createMempoolSource(deps: { tendermintApi: APIRequester; lcdApi: APIRequester }) {
  const $source = new Observable<{ tx: string; metaJournal: TransactionMetaJournal }>(
    (subscriber) => {
      // TODO: handle request errors
      deps.tendermintApi
        .getRaw<UnconfirmedTxsResponse>('/unconfirmed_txs')
        .then((mempoolResponse) => {
          mempoolResponse.result.txs.forEach((tx) =>
            subscriber.next({ tx, metaJournal: new TransactionMetaJournal('mempool') }),
          );
          subscriber.complete();
        });
    },
  );

  return $source.pipe(
    mergeMap(({ tx, metaJournal }) =>
      deps.lcdApi
        .postRaw<{ result: StdTx.Data['value'] }>('/txs/decode', { tx })
        .then(({ result }) => ({
          txValue: result,
          metaJournal,
        }))
        .catch((e) => {
          console.log('ERROR on encoding tx: ', e.response?.data || e.message);
          return null;
        }),
    ),
    filter(Boolean),
    repeat(),
  );
}
