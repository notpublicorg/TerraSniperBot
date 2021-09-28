import { APIRequester } from '@terra-money/terra.js/dist/client/lcd/APIRequester';
import { load } from 'protobufjs';

jest.setTimeout(10000);

// const terra = new LCDClient({
//   URL: 'https://bombay-lcd.terra.dev',
//   chainID: 'bombay-11',
// });

export type UnconfirmedTxsResponse = {
  id: number;
  jsonrpc: string;
  result: {
    n_txs: string; // '31';
    total: string; // '426';
    total_bytes: string; // '627810';
    txs: string[];
  };
};

const tendermintApi = new APIRequester('http://162.55.245.183:26657');
// const lcdApi = new APIRequester('https://bombay-lcd.terra.dev');

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
      txs: expect.arrayContaining([expect.any(String)]),
    },
  });
});

test('txs parsing', async () => {
  const root = await load('tx.proto');
  const msg = root.lookupType('transaction.MsgExecuteContract');
  // const data = await requestUnconfirmedTxs();

  // const tx = data.result.txs[0];
  const tx =
    'CsMBCsABCiYvdGVycmEud2FzbS52MWJldGExLk1zZ0V4ZWN1dGVDb250cmFjdBKVAQosdGVycmExZ3E4OGtrczZ1bTMzbmt6dDNmcGZ0dnl4Zjh1OXMycGVhZG41bTYSLHRlcnJhMWhmMGVraDc4bWhleDJqMHRkZmphd3B2ZzM3czQyZmV3cG5wN2V6Gjd7InN1Ym1pdCI6eyJyb3VuZF9pZCI6Nzk1NSwic3VibWlzc2lvbiI6IjE0Njk3MDAwMDAwIn19EmoKUgpGCh8vY29zbW9zLmNyeXB0by5zZWNwMjU2azEuUHViS2V5EiMKIQOQPvigPFN5HtjUaFhTqk92PoZfdOyOalCWtEdfrno8URIECgIIARi40wESFAoOCgV1bHVuYRIFNDUwMDAQ4KcSGkDJqe/rNqRFM4ZfFnDYmO5cO08v0YbQMwaAjbQM0pn/FladpxZVRb3RRji5MxpSwEu1iJPSuHdBWz0NHg127oZE';

  // const parsed = decodeTx(base64ToBytes(tx), false);
  // const parsed = decodeEventDataTx(Buffer.from(tx), true);
  // const parsed = decodeContent(Buffer.from(tx, 'base64'), true);
  // const parsed = unmarshalTx(base64ToBytes(tx), true);
  const parsed = msg.decode(Buffer.from(tx, 'base64'));
  // const decoded = decodeString(Buffer.from(tx));
  // const parsed = unmarshalTx(Buffer.from(decoded[0], 'base64'));

  expect(parsed).toEqual({});
});
