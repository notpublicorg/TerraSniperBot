import { LCDClient, WebSocketClient } from '@terra-money/terra.js';
import { catchError, map, mergeMap, Observable } from 'rxjs';

import { TendermintTxResponse } from './types/tendermint-response';

export function createTerraTransactionsSource(
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

  const transactionsSource = source.pipe(
    mergeMap((txhash) => terra.tx.txInfo(txhash)),
    catchError((error, caught) => {
      logger.error(error);
      return caught;
    }),
    map((txInfo) => txInfo.toData()),
  );

  return transactionsSource;
}
