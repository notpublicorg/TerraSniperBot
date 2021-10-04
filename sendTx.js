const { Coin, LCDClient, MsgExecuteContract, MnemonicKey } = require('@terra-money/terra.js');
const fetch = require('node-fetch');

(async () => {
  try {
    const terra = new LCDClient({
      URL: 'https://bombay-lcd.terra.dev',
      chainID: 'bombay-12',
    });
    const walletMnemonicKey = new MnemonicKey({
      mnemonic:
        'clown lawsuit shoe hurt feed daring ugly already smile art reveal rail impact alter home fresh gadget prevent code guitar unusual tape dizzy this',
    });
    const wallet = terra.wallet(walletMnemonicKey);
    const execute = new MsgExecuteContract(
      wallet.key.accAddress,
      'terra156v8s539wtz0sjpn8y8a8lfg8fhmwa7fy22aff',
      {
        swap: {
          offer_asset: {
            info: {
              native_token: {
                denom: 'uusd',
              },
            },
            amount: '10000000',
          },
        },
      },
      [new Coin('uusd', '10000000')],
    );
    const gasPr = [new Coin('uusd', '2.9')];
    const tx = await wallet.createAndSignTx({
      msgs: [execute],
      gasAdjustment: '1.5',
      gasPrices: gasPr,
      feeDenoms: gasPr.map((p) => p.denom),
    });
    const data = await terra.tx.encode(tx);
    console.log(await tx.toJSON());
    const apiRes = await fetch('http://162.55.245.183:26657', {
      method: 'POST',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'broadcast_tx_sync',
        params: { tx: data },
      }),
    });
    console.log(await apiRes.json());
  } catch (e) {
    console.error(e);
  }
})();
