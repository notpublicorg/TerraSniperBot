import { StdTx, WebSocketClient } from '@terra-money/terra.js';
import { APIRequester } from '@terra-money/terra.js/dist/client/lcd/APIRequester';
import { filter, mergeMap, Observable } from 'rxjs';

import { TendermintTxResponse } from '../types/tendermint-response';
import { TransactionMetaJournal } from '../utils/transaction-meta-journal';

export function createTransactionsSource(lcdApi: APIRequester, config: { websocketUrl: string }) {
  const wsclient = new WebSocketClient(config.websocketUrl);

  const $source = new Observable<{ tx: string; metaJournal: TransactionMetaJournal }>(
    (subscriber) => {
      wsclient.subscribeTx({}, (response) => {
        subscriber.next({
          tx: (response as TendermintTxResponse).value.TxResult.tx,
          metaJournal: new TransactionMetaJournal('block'),
        });
      });

      wsclient['start']();

      return () => {
        wsclient.destroy();
      };
    },
  );

  return $source.pipe(
    mergeMap(({ tx, metaJournal }) =>
      lcdApi
        .postRaw<{ result: StdTx.Data['value'] }>('/txs/decode', { tx })
        .then((response) => ({
          txValue: response.result,
          metaJournal,
        }))
        .catch((e) => {
          console.log('ERROR on decoding tx: ', e.response?.data || e.message);
          return null;
        }),
    ),
    filter(Boolean),
  );
}
