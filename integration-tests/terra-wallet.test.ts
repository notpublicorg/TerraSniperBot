import {
  Coin,
  Denom,
  isTxError,
  LCDClient,
  MnemonicKey,
  MsgExecuteContract,
  StdFee,
} from '@terra-money/terra.js';

jest.setTimeout(20000);

function toBase64(obj: unknown) {
  return Buffer.from(JSON.stringify(obj)).toString('base64');
}

async function queryNativeTokenBalance(account: string, denom = 'uusd') {
  const balance = (await terra.bank.balance(account)).get(denom)?.amount.toString();
  if (balance) {
    return balance;
  } else {
    return '0';
  }
}

async function queryTokenBalance(account: string, tokenContract: string) {
  const balanceResponse = await terra.wasm.contractQuery<{ balance: string }>(tokenContract, {
    balance: { address: account },
  });
  return balanceResponse.balance;
}

const terra = new LCDClient({
  URL: 'https://bombay-lcd.terra.dev',
  chainID: 'bombay-12',
});

const WALLET_MNEMONIC = new MnemonicKey({
  mnemonic:
    'clown lawsuit shoe hurt feed daring ugly already smile art reveal rail impact alter home fresh gadget prevent code guitar unusual tape dizzy this',
});
const WALLET_ADDRESS = 'terra1lx6873f5rnvuc2l9eu74qr3l58gl28n728aujy';
const TOKEN_CONTRACT = 'terra1gttan8dr7ry9p0qjmycvnq6k75sd8dg2pwuude';
const PAIR_CONTRACT = 'terra18njmwjlr0jc57rg0nc29z3g7lvjwd9594e7p2q';

test.skip('wallet mnemonic', () => {
  const wallet = terra.wallet(WALLET_MNEMONIC);
  expect(wallet.key.accAddress).toEqual(WALLET_ADDRESS);
});

test.skip('wallet acc', async () => {
  const balance = {
    lunaBalance: await queryNativeTokenBalance(WALLET_ADDRESS, Denom.LUNA),
    usdBalance: await queryNativeTokenBalance(WALLET_ADDRESS, Denom.USD),
    tokenBalance: await queryTokenBalance(WALLET_ADDRESS, TOKEN_CONTRACT),
  };

  expect(balance).toEqual({
    lunaBalance: '1000240673',
    usdBalance: '88973198',
    tokenBalance: '1000001000000',
  });
});

test.skip('pair contract balance', async () => {
  const nativeTokenBalance = await queryNativeTokenBalance(PAIR_CONTRACT, Denom.USD);
  expect(nativeTokenBalance).toEqual('99999902');

  const tokenBalance = await queryTokenBalance(PAIR_CONTRACT, TOKEN_CONTRACT);
  expect(tokenBalance).toEqual('1000001000000');
});

test.skip("swap tokens to dollars/luna (depends on what's in pair)", async () => {
  const wallet = terra.wallet(WALLET_MNEMONIC);

  const execute = new MsgExecuteContract(wallet.key.accAddress, TOKEN_CONTRACT, {
    send: {
      amount: '1000000',
      contract: PAIR_CONTRACT,
      msg: toBase64({
        swap: {},
      }),
    },
  });

  const tx = await wallet.createAndSignTx({
    msgs: [execute],
    fee: new StdFee(30000000, [new Coin(Denom.LUNA, 4500000), new Coin(Denom.USD, 4500000)]),
  });

  const txResult = await terra.tx.broadcast(tx);

  console.log(JSON.stringify(txResult));

  expect(isTxError(txResult)).toBeFalsy();
});

test.skip("swap dollars/luna (depends on what's in pair) to tokens", async () => {
  const wallet = terra.wallet(WALLET_MNEMONIC);

  const execute = new MsgExecuteContract(
    wallet.key.accAddress,
    PAIR_CONTRACT,
    {
      swap: {
        offer_asset: {
          info: {
            native_token: {
              denom: Denom.USD,
            },
          },
          amount: '1000000',
        },
      },
    },
    [new Coin(Denom.USD, 1000000)],
  );

  const tx = await wallet.createAndSignTx({
    msgs: [execute],
    fee: new StdFee(30000000, [new Coin(Denom.LUNA, 4500000), new Coin(Denom.USD, 4500000)]),
  });

  const txResult = await terra.tx.broadcast(tx);

  console.log(JSON.stringify(txResult));

  expect(isTxError(txResult)).toBeFalsy();
});
