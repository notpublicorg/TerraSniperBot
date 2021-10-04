import { Coins, MsgExecuteContract, StdFee, StdSignature, StdTx } from '@terra-money/terra.js';
import { APIRequester } from '@terra-money/terra.js/dist/client/lcd/APIRequester';
import { Tx } from '@terra-money/terra.proto/cosmos/tx/v1beta1/tx';
import { MsgExecuteContract as MsgExecuteContractProto } from '@terra-money/terra.proto/terra/wasm/v1beta1/tx';

import { UnconfirmedTxsResponse } from '../src/terra-processor/types/mempool-response';

jest.setTimeout(10000);

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
      txs: expect.any(Array),
    },
  });
});

const TEST_ENCODED_TX =
  'CtkLCs0LCiYvdGVycmEud2FzbS52MWJldGExLk1zZ0V4ZWN1dGVDb250cmFjdBKiCwosdGVycmExN240cXV2cGc2c2htM3gwODR2cHM5azg4NnJkdW13aGxyMnNrMGoSLHRlcnJhMTgzdXc2NjYwbHJwemZoMHJkZmEzcnJuMjRtM2tlN3FmZmdtZnJkGsMKeyJyZWxheSI6eyJzeW1ib2xzIjpbIkFBUEwiLCJBQk5CIiwiQU1DIiwiQU1EIiwiQU1aTiIsIkFOQyIsIkFSS0siLCJCQUJBIiwiQlRDIiwiQ09JTiIsIkRPR0UiLCJET1QiLCJFVEgiLCJGQiIsIkdNRSIsIkdPT0dMIiwiR1MiLCJIT09EIiwiSUFVIiwiTFVOQSIsIk1JUiIsIk1TRlQiLCJORkxYIiwiUVFRIiwiU0xWIiwiU1BZIiwiU1EiLCJUU0xBIiwiVFdUUiIsIlVTTyIsIlVTVCIsIlZJWFkiXSwicmF0ZXMiOlsiMTQyNTgwMDAwMDAwIiwiMTczNjAwMDAwMDAwIiwiMzgyMDAwMDAwMDAiLCIxMDI1MTAwMDAwMDAiLCIzMjgxMDAwMDAwMDAwIiwiMzM4MzE0NjAwMCIsIjExMTE3MDAwMDAwMCIsIjE0Mzk3MDAwMDAwMCIsIjQ3ODgwNjkwMjUwMDAwIiwiMjMxNTUwMDAwMDAwIiwiMjE5OTQxMzkwIiwiMzE5NDkyMDAwMDAiLCIzNDA2OTE5NjAwMDAwIiwiMzQyNTUwMDAwMDAwIiwiMTc2NzAwMDAwMDAwIiwiMjczMTAwMDAwMDAwMCIsIjM4MDAzMDAwMDAwMCIsIjQxOTMwMDAwMDAwIiwiMzM0OTAwMDAwMDAiLCI0MzIwMDAwMDAwMCIsIjMwMjk5MzEwMDAiLCIyODg1NTAwMDAwMDAiLCI2MTM0NTAwMDAwMDAiLCIzNjAyOTAwMDAwMDAiLCIyMDgzMDAwMDAwMCIsIjQzNDI0MDAwMDAwMCIsIjIzOTQyMDAwMDAwMCIsIjc3NTAwMDAwMDAwMCIsIjYyMDAwMDAwMDAwIiwiNTMyNjAwMDAwMDAiLCIxMDAyOTk5OTk5IiwiMjE5MzAwMDAwMDAiXSwicmVzb2x2ZV90aW1lcyI6WzE2MzMyNzc2ODAsMTYzMzI3NzY4MCwxNjMzMjc3NjgwLDE2MzMyNzc2ODAsMTYzMzI3NzY4MCwxNjMzMjc3NjgwLDE2MzMyNzc2ODAsMTYzMzI3NzY4MCwxNjMzMjc3NjgwLDE2MzMyNzc2ODAsMTYzMzI3NzY4MCwxNjMzMjc3NjgwLDE2MzMyNzc2ODAsMTYzMzI3NzY4MCwxNjMzMjc3NjgwLDE2MzMyNzc2ODAsMTYzMzI3NzY4MCwxNjMzMjc3NjgwLDE2MzMyNzc2ODAsMTYzMzI3NzY4MCwxNjMzMjc3NjgwLDE2MzMyNzc2ODAsMTYzMzI3NzY4MCwxNjMzMjc3NjgwLDE2MzMyNzc2ODAsMTYzMzI3NzY4MCwxNjMzMjc3NjgwLDE2MzMyNzc2ODAsMTYzMzI3NzY4MCwxNjMzMjc3NjgwLDE2MzMyNzc2ODAsMTYzMzI3NzY4MF0sInJlcXVlc3RfaWRzIjpbNTU0ODM5Myw1NTQ4MzkzLDU1NDgzOTMsNTU0ODM5Myw1NTQ4MzkzLDU1NDgzODksNTU0ODM5Myw1NTQ4MzkzLDU1NDgzODksNTU0ODM5Myw1NTQ4Mzg5LDU1NDgzODksNTU0ODM4OSw1NTQ4MzkzLDU1NDgzOTMsNTU0ODM5Myw1NTQ4MzkzLDU1NDgzOTMsNTU0ODM5Myw1NTQ4Mzg5LDU1NDgzODksNTU0ODM5Myw1NTQ4MzkzLDU1NDgzOTMsNTU0ODM5Myw1NTQ4MzkzLDU1NDgzOTMsNTU0ODM5Myw1NTQ4MzkzLDU1NDgzOTMsNTU0ODM4OSw1NTQ4MzkzXX19EgdSZWxheWVyEmkKUgpGCh8vY29zbW9zLmNyeXB0by5zZWNwMjU2azEuUHViS2V5EiMKIQIn/BEFrnTwqJWPEdACQ37z/E4Tfz8Q6a0QVH1wBETZ+hIECgIIfxiG6wgSEwoNCgV1bHVuYRIEMzE1NRCYyw4aQDviFp7JtcDWz99rkf01j4qM71BfJI2tqJpfPq23vj3+XYObRHx6QDK4zsoskakx16UQYcZe40cIXncdMi47vFw=';

const EXPECTED_DECODE_RESULT: StdTx.Data['value'] = {
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
};

test('txs parsing with decode endpoint', async () => {
  const { result } = await lcdApi.postRaw<{ result: StdTx.Data['value'] }>('/txs/decode', {
    tx: TEST_ENCODED_TX,
  });

  expect(result).toEqual<StdTx.Data['value']>(EXPECTED_DECODE_RESULT);
});

test('txs parsing with proto decoding', async () => {
  const decodedTx = Tx.decode(Buffer.from(TEST_ENCODED_TX, 'base64'));

  expect(decodedTx.authInfo?.fee).toEqual({
    amount: [{ amount: '3155', denom: 'uluna' }],
    gasLimit: { high: 0, low: 239000, unsigned: true },
    granter: '',
    payer: '',
  });
  expect(decodedTx.authInfo?.fee?.gasLimit.toString()).toEqual('239000');

  const decodedMessages =
    decodedTx.body?.messages
      .map((message) => {
        const messageTypeParts = message.typeUrl.split('.');
        const messageType = messageTypeParts[messageTypeParts.length - 1] as
          | 'MsgExecuteContract'
          | string;

        if (messageType !== 'MsgExecuteContract') return null;

        const decodedMessage = MsgExecuteContractProto.decode(message.value);

        return {
          ...message,
          value: {
            ...decodedMessage,
            executeMsg: JSON.parse(decodedMessage.executeMsg.toString()),
          },
        };
      })
      .filter((val) => !!val) || [];

  expect(decodedMessages).toEqual([
    {
      typeUrl: '/terra.wasm.v1beta1.MsgExecuteContract',
      value: {
        coins: [],
        contract: 'terra183uw6660lrpzfh0rdfa3rrn24m3ke7qffgmfrd',
        executeMsg: expect.any(Object),
        sender: 'terra17n4quvpg6shm3x084vps9k886rdumwhlr2sk0j',
      },
    },
  ]);

  const stdTx = new StdTx(
    decodedMessages.map(
      (m) =>
        new MsgExecuteContract(
          m?.value.sender || '',
          m?.value.contract || '',
          m?.value.executeMsg,
          Coins.fromData(m?.value.coins || []),
        ),
    ),
    new StdFee(
      decodedTx.authInfo?.fee?.gasLimit.toNumber() || 0,
      Coins.fromData(decodedTx.authInfo?.fee?.amount || []),
    ),
    [], // NOTE: can be parsed a MSG objects if needed
    decodedTx.body?.memo,
    decodedTx.body?.timeoutHeight.toNumber() || 0,
  );

  expect(stdTx.toData().value).toEqual(EXPECTED_DECODE_RESULT);
});
