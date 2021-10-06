import { Coin, LCDClient, MnemonicKey, StdFee } from '@terra-money/terra.js';
import { APIRequester } from '@terra-money/terra.js/dist/client/lcd/APIRequester';

import { swapTransactionCreator } from './transaction-creators/swap-transaction-creator';
import { NewTransactionInfo } from './types/new-transaction-info';
import { Denom } from './utils/denom';
import { MILLION } from './utils/terra-types-converter';
import { TransactionMetaJournal } from './utils/transaction-meta-journal';

const configuration = {
  LCD_URL: 'https://bombay-lcd.terra.dev',
  LCD_CHAIN_ID: 'bombay-12',
  WALLET_MNEMONIC_KEY:
    'clown lawsuit shoe hurt feed daring ugly already smile art reveal rail impact alter home fresh gadget prevent code guitar unusual tape dizzy this',
  TENDERMINT_API_URL: 'http://162.55.245.183:26657',

  DEFAULT_FEE_DENOM: 'uusd',
  DEFAULT_FEE: '1000000',
  DEFAULT_GAS: 200000,
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
    fee: new StdFee(configuration.DEFAULT_GAS, [
      new Coin(configuration.DEFAULT_FEE_DENOM, configuration.DEFAULT_FEE),
    ]),
  },
  {
    terra,
    tendermintApi: new APIRequester(configuration.TENDERMINT_API_URL),
    metaJournal: new TransactionMetaJournal('mempool'),
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
