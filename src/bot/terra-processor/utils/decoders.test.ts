import { StdTx } from '@terra-money/terra.js';
import { APIRequester } from '@terra-money/terra.js/dist/client/lcd/APIRequester';

import { decodeTransaction } from './decoders';

const lcdApi = new APIRequester('https://bombay-lcd.terra.dev');

const TEST_ENCODED_TX =
  'CtkLCs0LCiYvdGVycmEud2FzbS52MWJldGExLk1zZ0V4ZWN1dGVDb250cmFjdBKiCwosdGVycmExN240cXV2cGc2c2htM3gwODR2cHM5azg4NnJkdW13aGxyMnNrMGoSLHRlcnJhMTgzdXc2NjYwbHJwemZoMHJkZmEzcnJuMjRtM2tlN3FmZmdtZnJkGsMKeyJyZWxheSI6eyJzeW1ib2xzIjpbIkFBUEwiLCJBQk5CIiwiQU1DIiwiQU1EIiwiQU1aTiIsIkFOQyIsIkFSS0siLCJCQUJBIiwiQlRDIiwiQ09JTiIsIkRPR0UiLCJET1QiLCJFVEgiLCJGQiIsIkdNRSIsIkdPT0dMIiwiR1MiLCJIT09EIiwiSUFVIiwiTFVOQSIsIk1JUiIsIk1TRlQiLCJORkxYIiwiUVFRIiwiU0xWIiwiU1BZIiwiU1EiLCJUU0xBIiwiVFdUUiIsIlVTTyIsIlVTVCIsIlZJWFkiXSwicmF0ZXMiOlsiMTQyNTgwMDAwMDAwIiwiMTczNjAwMDAwMDAwIiwiMzgyMDAwMDAwMDAiLCIxMDI1MTAwMDAwMDAiLCIzMjgxMDAwMDAwMDAwIiwiMzM4MzE0NjAwMCIsIjExMTE3MDAwMDAwMCIsIjE0Mzk3MDAwMDAwMCIsIjQ3ODgwNjkwMjUwMDAwIiwiMjMxNTUwMDAwMDAwIiwiMjE5OTQxMzkwIiwiMzE5NDkyMDAwMDAiLCIzNDA2OTE5NjAwMDAwIiwiMzQyNTUwMDAwMDAwIiwiMTc2NzAwMDAwMDAwIiwiMjczMTAwMDAwMDAwMCIsIjM4MDAzMDAwMDAwMCIsIjQxOTMwMDAwMDAwIiwiMzM0OTAwMDAwMDAiLCI0MzIwMDAwMDAwMCIsIjMwMjk5MzEwMDAiLCIyODg1NTAwMDAwMDAiLCI2MTM0NTAwMDAwMDAiLCIzNjAyOTAwMDAwMDAiLCIyMDgzMDAwMDAwMCIsIjQzNDI0MDAwMDAwMCIsIjIzOTQyMDAwMDAwMCIsIjc3NTAwMDAwMDAwMCIsIjYyMDAwMDAwMDAwIiwiNTMyNjAwMDAwMDAiLCIxMDAyOTk5OTk5IiwiMjE5MzAwMDAwMDAiXSwicmVzb2x2ZV90aW1lcyI6WzE2MzMyNzc2ODAsMTYzMzI3NzY4MCwxNjMzMjc3NjgwLDE2MzMyNzc2ODAsMTYzMzI3NzY4MCwxNjMzMjc3NjgwLDE2MzMyNzc2ODAsMTYzMzI3NzY4MCwxNjMzMjc3NjgwLDE2MzMyNzc2ODAsMTYzMzI3NzY4MCwxNjMzMjc3NjgwLDE2MzMyNzc2ODAsMTYzMzI3NzY4MCwxNjMzMjc3NjgwLDE2MzMyNzc2ODAsMTYzMzI3NzY4MCwxNjMzMjc3NjgwLDE2MzMyNzc2ODAsMTYzMzI3NzY4MCwxNjMzMjc3NjgwLDE2MzMyNzc2ODAsMTYzMzI3NzY4MCwxNjMzMjc3NjgwLDE2MzMyNzc2ODAsMTYzMzI3NzY4MCwxNjMzMjc3NjgwLDE2MzMyNzc2ODAsMTYzMzI3NzY4MCwxNjMzMjc3NjgwLDE2MzMyNzc2ODAsMTYzMzI3NzY4MF0sInJlcXVlc3RfaWRzIjpbNTU0ODM5Myw1NTQ4MzkzLDU1NDgzOTMsNTU0ODM5Myw1NTQ4MzkzLDU1NDgzODksNTU0ODM5Myw1NTQ4MzkzLDU1NDgzODksNTU0ODM5Myw1NTQ4Mzg5LDU1NDgzODksNTU0ODM4OSw1NTQ4MzkzLDU1NDgzOTMsNTU0ODM5Myw1NTQ4MzkzLDU1NDgzOTMsNTU0ODM5Myw1NTQ4Mzg5LDU1NDgzODksNTU0ODM5Myw1NTQ4MzkzLDU1NDgzOTMsNTU0ODM5Myw1NTQ4MzkzLDU1NDgzOTMsNTU0ODM5Myw1NTQ4MzkzLDU1NDgzOTMsNTU0ODM4OSw1NTQ4MzkzXX19EgdSZWxheWVyEmkKUgpGCh8vY29zbW9zLmNyeXB0by5zZWNwMjU2azEuUHViS2V5EiMKIQIn/BEFrnTwqJWPEdACQ37z/E4Tfz8Q6a0QVH1wBETZ+hIECgIIfxiG6wgSEwoNCgV1bHVuYRIEMzE1NRCYyw4aQDviFp7JtcDWz99rkf01j4qM71BfJI2tqJpfPq23vj3+XYObRHx6QDK4zsoskakx16UQYcZe40cIXncdMi47vFw=';

const EXPECTED_DECODE_RESULT: StdTx.Data['value'] = {
  fee: {
    amount: [{ amount: '3155', denom: 'uluna' }],
    gas: '239000',
  },
  memo: 'Relayer',
  msg: expect.arrayContaining([
    {
      type: 'wasm/MsgExecuteContract',
      value: {
        coins: [],
        contract: 'terra183uw6660lrpzfh0rdfa3rrn24m3ke7qffgmfrd',
        execute_msg: expect.any(Object),
        sender: 'terra17n4quvpg6shm3x084vps9k886rdumwhlr2sk0j',
      },
    },
  ]),
  signatures: expect.any(Array),
  timeout_height: '0',
};

test('txs parsing with decode endpoint', async () => {
  const { result } = await lcdApi.postRaw<{ result: StdTx.Data['value'] }>('/txs/decode', {
    tx: TEST_ENCODED_TX,
  });

  expect(result).toEqual<StdTx.Data['value']>(EXPECTED_DECODE_RESULT);
});

test('txs parsing with proto decoding', async () => {
  const decodedTx = decodeTransaction(TEST_ENCODED_TX);

  expect(decodedTx?.toData().value).toEqual(EXPECTED_DECODE_RESULT);
});
