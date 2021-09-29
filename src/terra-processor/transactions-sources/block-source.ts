import { LCDClient, WebSocketClient } from '@terra-money/terra.js';
import { catchError, map, mergeMap, Observable } from 'rxjs';

import { TransactionMetaInfo } from '../types/meta';
import { TendermintTxResponse } from '../types/tendermint-response';

export function createBlockSource(
  config: {
    websocketUrl: string;
    lcdUrl: string;
    lcdChainId: string;
  },
  logger: { info: (data: unknown) => void; error: (error: Error) => void },
) {
  const wsclient = new WebSocketClient(config.websocketUrl);

  const source = new Observable<string>((subscriber) => {
    wsclient.subscribeTx({}, (response) => {
      subscriber.next((response as TendermintTxResponse).value.TxResult.txhash);
    });

    wsclient['start']();

    return () => {
      wsclient.destroy();
    };
  });

  const terra = new LCDClient({
    URL: config.lcdUrl,
    chainID: config.lcdChainId,
  });

  const transactionsBlockSource = source.pipe(
    map((tx) => ({
      tx,
      meta: {
        source: 'block',
        receivedDateTime: new Date().toLocaleString(),
      } as TransactionMetaInfo,
    })),
    mergeMap(({ tx, meta }) => terra.tx.txInfo(tx).then((response) => ({ response, meta }))),
    catchError((error, caught) => {
      logger.error(error);
      return caught;
    }),
    map(({ response, meta }) => ({ tx: response.toData().tx.value, meta })),
  );

  return { terra, transactionsBlockSource };
}
