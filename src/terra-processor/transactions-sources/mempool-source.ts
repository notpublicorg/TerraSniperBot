import { APIRequester } from '@terra-money/terra.js/dist/client/lcd/APIRequester';
import { Observable } from 'rxjs';

import { UnconfirmedTxsResponse } from '../types/tendermint-responses';
import { TransactionMetaJournal } from '../utils/transaction-meta-journal';

export function createMempoolSource(deps: { tendermintApi: APIRequester }) {
  const $source = new Observable<{
    tx: string;
    metaJournal: TransactionMetaJournal;
  }>((subscriber) => {
    deps.tendermintApi
      .getRaw<UnconfirmedTxsResponse>('/unconfirmed_txs', { limit: 100 })
      .then(({ result }) => {
        result.txs.forEach((tx) => {
          const metaJournal = new TransactionMetaJournal('mempool');
          subscriber.next({ tx, metaJournal });
        });
        subscriber.complete();
      })
      .catch((e) => {
        console.error(e);
        subscriber.complete();
      });
  });

  return $source;
}
