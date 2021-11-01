import { LCDClient } from '@terra-money/terra.js';

const terra = new LCDClient({
  URL: 'https://lcd.terra.dev',
  chainID: 'columbus-5',
});

const CONTRACT_ADDRESS = 'terra1yjmpu9c3dzknf8axtp6k74nvkwrd457u7p2sdr';

test('contract querying', async () => {
  const response = await terra.wasm.contractQuery(CONTRACT_ADDRESS, { pool: {} });

  expect(response).toEqual({
    assets: [
      {
        amount: expect.any(String), // '2742043764632',
        info: {
          token: {
            contract_addr: 'terra1u2k0nkenw0p25ljsr4ksh7rxm65y466vkdewwj',
          },
        },
      },
      {
        amount: expect.any(String), // '3883657402928',
        info: {
          native_token: {
            denom: 'uusd',
          },
        },
      },
    ],
    total_share: expect.any(String),
  });
});
