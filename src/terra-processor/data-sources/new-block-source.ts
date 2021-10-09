import { WebSocketClient } from '@terra-money/terra.js';
import { APIRequester } from '@terra-money/terra.js/dist/client/lcd/APIRequester';
import { BehaviorSubject, connectable, Observable } from 'rxjs';

import { StatusResponse, WebsocketNewBlockResponse } from '../types/tendermint-responses';
import { NewBlockInfo } from '../types/terra-flow';

export function createNewBlockSource(websocketUrl: string, tendermintApi: APIRequester) {
  const wsclient = new WebSocketClient(websocketUrl);

  const $source = new Observable<NewBlockInfo>((subscriber) => {
    tendermintApi.getRaw<StatusResponse>('/status').then((response) =>
      subscriber.next({
        currentBlockHeight: response.result.sync_info.latest_block_height,
      }),
    );
    wsclient.subscribe('NewBlock', {}, (response) => {
      subscriber.next({
        currentBlockHeight: (response as WebsocketNewBlockResponse).value.block.header.height,
      });
    });

    wsclient['start']();

    return () => {
      wsclient.destroy();
    };
  });

  return connectable($source, { connector: () => new BehaviorSubject({ currentBlockHeight: '' }) });
}
