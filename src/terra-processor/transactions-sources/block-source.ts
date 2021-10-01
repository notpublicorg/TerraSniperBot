import { LCDClient, WebSocketClient } from '@terra-money/terra.js';
import { filter, mergeMap, Observable } from 'rxjs';

import { TendermintTxResponse } from '../types/tendermint-response';
import { TransactionMetaJournal } from '../utils/transaction-meta-journal';

export function createBlockSource(terra: LCDClient, config: { websocketUrl: string }) {
  const wsclient = new WebSocketClient(config.websocketUrl);

  const $source = new Observable<{ tx: string; metaJournal: TransactionMetaJournal }>(
    (subscriber) => {
      wsclient.subscribeTx({}, (response) => {
        subscriber.next({
          tx: (response as TendermintTxResponse).value.TxResult.txhash,
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
      terra.tx
        .txInfo(tx)
        .then((txInfo) => ({
          txValue: txInfo.toData().tx.value,
          metaJournal,
        }))
        .catch((e) => {
          console.log(e);
          return null;
        }),
    ),
    filter(Boolean),
  );
}
