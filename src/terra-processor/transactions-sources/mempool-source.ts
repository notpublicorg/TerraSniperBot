import { APIRequester } from '@terra-money/terra.js/dist/client/lcd/APIRequester';
import { Observable } from 'rxjs';

import { StatusResponse, UnconfirmedTxsResponse } from '../types/tendermint-responses';
import { TransactionMetaJournal } from '../utils/transaction-meta-journal';

export function createMempoolSource(deps: { tendermintApi: APIRequester }) {
  const $source = new Observable<{
    tx: string;
    metaJournal: TransactionMetaJournal;
  }>((subscriber) => {
    deps.tendermintApi
      .getRaw<UnconfirmedTxsResponse>('/unconfirmed_txs', { limit: 100 })
      .then(async ({ result }) => {
        const currentTerraStatus = await deps.tendermintApi.getRaw<StatusResponse>('/status');
        result.txs.forEach((tx) => {
          const metaJournal = new TransactionMetaJournal(
            'mempool',
            currentTerraStatus.result.sync_info.latest_block_height,
          );
          subscriber.next({
            tx,
            metaJournal,
          });
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
