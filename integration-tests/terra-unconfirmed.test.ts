import { APIRequester } from '@terra-money/terra.js/dist/client/lcd/APIRequester';

import {
  StatusResponse,
  UnconfirmedTxsResponse,
} from '../src/terra-processor/types/tendermint-responses';

jest.setTimeout(10000);

const tendermintApi = new APIRequester('http://135.181.130.99:26657');

test('unconfirmed_txs contract', async () => {
  const data = await tendermintApi.getRaw<UnconfirmedTxsResponse>('/unconfirmed_txs');

  expect(data).toEqual<UnconfirmedTxsResponse>({
    id: expect.any(Number),
    jsonrpc: '2.0',
    result: {
      n_txs: expect.any(String),
      total: expect.any(String),
      total_bytes: expect.any(String),
      txs: expect.any(Array),
    },
  });
});

test('status contract', async () => {
  const data = await tendermintApi.getRaw<StatusResponse>('/status');

  expect(+data.result.sync_info.latest_block_height).not.toBeNaN();
});
