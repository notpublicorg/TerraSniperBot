import { StdTx } from '@terra-money/terra.js';
import { APIRequester } from '@terra-money/terra.js/dist/client/lcd/APIRequester';
import { Observable, repeat } from 'rxjs';

import { UnconfirmedTxsResponse } from '../types/mempool-response';
import { decodeTransaction } from '../utils/decoders';
import { TransactionMetaJournal } from '../utils/transaction-meta-journal';

export function createMempoolSource(deps: { tendermintApi: APIRequester }) {
  const $source = new Observable<{
    txValue: StdTx.Data['value'];
    metaJournal: TransactionMetaJournal;
  }>((subscriber) => {
    deps.tendermintApi
      .getRaw<UnconfirmedTxsResponse>('/unconfirmed_txs', { limit: 100 })
      .then(({ result }) => {
        result.txs.forEach((tx) => {
          const metaJournal = new TransactionMetaJournal('mempool');
          const decodedTx = decodeTransaction(tx);
          if (decodedTx) {
            subscriber.next({ txValue: decodedTx.toData().value, metaJournal });
          }
        });
        subscriber.complete();
      })
      .catch((e) => {
        console.error(e);
        subscriber.complete();
      });
  });

  return $source.pipe(repeat());
}
