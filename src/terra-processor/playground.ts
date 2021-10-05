import { Coin, LCDClient, MnemonicKey } from '@terra-money/terra.js';
import { APIRequester } from '@terra-money/terra.js/dist/client/lcd/APIRequester';

import { swapTransactionCreator } from './transaction-creators/swap-transaction-creator';
import { NewTransactionInfo } from './types/new-transaction-info';
import { Denom } from './utils/denom';
import { MILLION } from './utils/terra-types-converter';

const configuration = {
  LCD_URL: 'https://bombay-lcd.terra.dev',
  LCD_CHAIN_ID: 'bombay-12',
  WALLET_MNEMONIC_KEY:
    'clown lawsuit shoe hurt feed daring ugly already smile art reveal rail impact alter home fresh gadget prevent code guitar unusual tape dizzy this',
  TENDERMINT_API_URL: 'http://162.55.245.183:26657',

  GAS_ADJUSTMENT: '1.5',
  DEFAULT_GAS_PRICE_DENOM: 'uusd',
  DEFAULT_GAS_PRICE: '100',
};

const transactionInfo: NewTransactionInfo = {
  taskId: 'taskId',
  isTaskActive: true,
  pairContract: 'terra13cnle7tv57pqpfzq2zr5kwp3dxmquyq7sxyssf',
  buyAmount: 1 * MILLION,
  buyDenom: Denom.USD,
};

const terra = new LCDClient({
  URL: configuration.LCD_URL,
  chainID: configuration.LCD_CHAIN_ID,
});
new MnemonicKey({
  mnemonic: configuration.WALLET_MNEMONIC_KEY,
});

const sendTransaction = swapTransactionCreator(
  {
    walletMnemonic: new MnemonicKey({
      mnemonic: configuration.WALLET_MNEMONIC_KEY,
    }),
    gasAdjustment: configuration.GAS_ADJUSTMENT,
  },
  {
    terra,
    gasPricesGetter: () => [
      new Coin(configuration.DEFAULT_GAS_PRICE_DENOM, configuration.DEFAULT_GAS_PRICE),
    ],
    tendermintApi: new APIRequester(configuration.TENDERMINT_API_URL),
  },
);

console.log('Ready to send!');
console.log('CONFIG: ', configuration);
console.log('TRANSACTION_INFO: ', transactionInfo);

process.stdin.on('data', async () => {
  try {
    const result = await sendTransaction(transactionInfo);
    console.log(result);
  } catch (e) {
    console.log(e);
  } finally {
    process.exit(0);
  }
});
