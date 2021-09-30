import { LCDClient, WebSocketClient } from '@terra-money/terra.js';
import { filter, map, mergeMap, Observable, pipe } from 'rxjs';

import { TendermintTxResponse } from '../types/tendermint-response';

export function createBlockSource(config: { websocketUrl: string }) {
  const wsclient = new WebSocketClient(config.websocketUrl);

  const $source = new Observable<string>((subscriber) => {
    wsclient.subscribeTx({}, (response) => {
      subscriber.next((response as TendermintTxResponse).value.TxResult.txhash);
    });

    wsclient['start']();

    return () => {
      wsclient.destroy();
    };
  });

  return $source;
}

export const createTxFromHashFlow = (terra: LCDClient) =>
  pipe(
    mergeMap((txHash: string) =>
      terra.tx.txInfo(txHash).catch((e) => {
        console.log(e);
        return null;
      }),
    ),
    filter(Boolean),
    map((tx) => tx.toData().tx.value),
  );
