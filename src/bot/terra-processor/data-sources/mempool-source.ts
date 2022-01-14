import { Observable } from 'rxjs';

import { TendermintAPILocal } from '../external/tendermintAPI';
import { TransactionMetaJournal } from '../transaction-meta-journal';

export function createMempoolSource(deps: { tendermintApi: TendermintAPILocal }) {
  const $source = new Observable<{
    tx: string;
    metaJournal: TransactionMetaJournal;
  }>((subscriber) => {
    deps.tendermintApi
      .getUnconfirmedTxs()
      .then(({ result }) => {
        result.txs.forEach((tx) => {
          subscriber.next({ tx, metaJournal: new TransactionMetaJournal('mempool') });
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
