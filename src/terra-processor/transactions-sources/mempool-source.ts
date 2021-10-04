import { APIRequester } from '@terra-money/terra.js/dist/client/lcd/APIRequester';
import { filter, map, Observable, repeat } from 'rxjs';

import { UnconfirmedTxsResponse } from '../types/mempool-response';
import { decodeTransaction } from '../utils/decoders';
import { TransactionMetaJournal } from '../utils/transaction-meta-journal';

export function createMempoolSource(deps: { tendermintApi: APIRequester }) {
  const $source = new Observable<{ tx: string; metaJournal: TransactionMetaJournal }>(
    (subscriber) => {
      deps.tendermintApi
        .getRaw<UnconfirmedTxsResponse>('/unconfirmed_txs', { limit: 100 })
        .then((mempoolResponse) => {
          mempoolResponse.result.txs.forEach((tx) =>
            subscriber.next({ tx, metaJournal: new TransactionMetaJournal('mempool') }),
          );
          subscriber.complete();
        })
        .catch((e) => {
          console.error(e);
          subscriber.complete();
        });
    },
  );

  return $source.pipe(
    map(({ tx, metaJournal }) => {
      const decodedTx = decodeTransaction(tx);

      return decodedTx ? { txValue: decodedTx.toData().value, metaJournal } : null;
    }),
    filter(Boolean),
    repeat(),
  );
}
