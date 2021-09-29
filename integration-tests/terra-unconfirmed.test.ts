import { StdTx } from '@terra-money/terra.js';
import { APIRequester } from '@terra-money/terra.js/dist/client/lcd/APIRequester';

jest.setTimeout(10000);

// const terra = new LCDClient({
//   URL: 'https://bombay-lcd.terra.dev',
//   chainID: 'bombay-12',
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
const lcdApi = new APIRequester('https://bombay-lcd.terra.dev');

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
  const data = await requestUnconfirmedTxs();

  const tx = data.result.txs[0];

  const { result } = await lcdApi.postRaw<{ result: StdTx.Data['value'] }>('/txs/decode', { tx });

  expect(result).toEqual<StdTx.Data['value']>({
    fee: {
      amount: expect.any(Array) /* ([
        {
          amount: expect.any(String), //  "26583",
          denom: expect.any(String), // "uusd",
        },
      ]), */,
      gas: expect.any(String), // "177215",
    },
    memo: expect.any(String), // '',
    msg: expect.arrayContaining([
      {
        type: expect.any(String), // 'wasm/MsgExecuteContract',
        value: expect.any(Object) /* {
          coins: [],
          contract: 'terra1hf0ekh78mhex2j0tdfjawpvg37s42fewpnp7ez',
          execute_msg: {
            submit: {
              round_id: 7955,
              submission: '14697000000',
            },
          },
          sender: 'terra1gq88kks6um33nkzt3fpftvyxf8u9s2peadn5m6',
        }, */,
      },
    ]),
    signatures: expect.any(Array), // [],
    timeout_height: expect.any(String), // '0',
  });
});
