import { APIRequester } from '@terra-money/terra.js/dist/client/lcd/APIRequester';

import { UnconfirmedTxsResponse } from '../src/terra-processor/types/tendermint-responses';

jest.setTimeout(10000);

const tendermintApi = new APIRequester('http://162.55.245.183:26657');

const requestUnconfirmedTxs = () =>
  tendermintApi.getRaw<UnconfirmedTxsResponse>('/unconfirmed_txs');

test('unconfirmed_txs contract', async () => {
  const data = await requestUnconfirmedTxs();

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
