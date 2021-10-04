import { WebSocketClient } from '@terra-money/terra.js';
import { filter, map, Observable } from 'rxjs';

import { TendermintTxResponse } from '../types/tendermint-response';
import { decodeTransaction } from '../utils/decoders';
import { TransactionMetaJournal } from '../utils/transaction-meta-journal';

export function createBlockSource(config: { websocketUrl: string }) {
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
    map(({ tx, metaJournal }) => {
      const decodedTx = decodeTransaction(tx);

      return decodedTx ? { txValue: decodedTx.toData().value, metaJournal } : null;
    }),
    filter(Boolean),
  );
}
