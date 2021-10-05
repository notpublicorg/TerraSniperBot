import { StdTx } from '@terra-money/terra.js';
import { APIRequester } from '@terra-money/terra.js/dist/client/lcd/APIRequester';
import { map, Observable, repeat } from 'rxjs';

import { UnconfirmedTxsResponse } from '../types/mempool-response';
import { decodeTransaction } from '../utils/decoders';
import { TransactionMetaJournal } from '../utils/transaction-meta-journal';

export function createMempoolSource(deps: { tendermintApi: APIRequester }) {
  const $source = new Observable<{ tx: StdTx; metaJournal: TransactionMetaJournal }>(
    (subscriber) => {
      deps.tendermintApi
        .getRaw<UnconfirmedTxsResponse>('/unconfirmed_txs', { limit: 100 })
        .then(({ result }) => {
          const receivedTime = Date.now();
          console.log(`Received transactions count=${result.txs.length}, time=${receivedTime}`);
          let decodedCount = 0;
          result.txs.forEach((tx) => {
            const metaJournal = new TransactionMetaJournal('mempool');
            const decodedTx = decodeTransaction(tx);
            if (decodedTx) {
              decodedCount++;
              subscriber.next({ tx: decodedTx, metaJournal });
            }
          });
          const decodingEndTime = Date.now();
          console.log(
            `Decoding done! Count=${decodedCount}, time=${decodingEndTime}, elapsed seconds = ${
              (decodingEndTime - receivedTime) / 1000
            }`,
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
    map(({ tx, metaJournal }) => ({ txValue: tx.toData().value, metaJournal })),
    repeat(),
  );
}
