import { LCDClient, WebSocketClient } from '@terra-money/terra.js';

// const ws = new WebSocket('ws://162.55.245.183:26657/websocket');
// ws.onerror = (e) => {
//   console.log(e);
// };

// const terra = new LCDClient({
//   URL: 'https://lcd.terra.dev',
//   chainID: 'tequila-0004',
// });

// const transactions = await terra.tx.txInfosByHeight(undefined);

const terra = new LCDClient({
  URL: 'https://162.55.245.183:26657',
  chainID: 'tequila-0004',
});

terra.tendermint.blockInfo().then((r) => console.log(r));

const wsclient = new WebSocketClient('ws://162.55.245.183:26657/websocket');
wsclient.on('error', () => {
  console.log('error');
});

console.log(wsclient.isConnected);

wsclient.once('connection', () => console.log('ready to go'));

wsclient.subscribeTx({}, (response) => {
  console.log('---------------- <NEW RESPONSE> --------------');
  console.log('--------------------------------------------');
  console.log(JSON.stringify(response));
  console.log('--------------------------------------------');
  console.log('---------------- </NEW RESPONSE> --------------');
});

process.stdin.on('data', () => {
  console.log(wsclient.isConnected);
  console.log('shutting ws connection');
  wsclient.destroy();
  process.exit(0);
});
