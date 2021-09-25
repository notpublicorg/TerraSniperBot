import { WebSocketClient } from '@terra-money/terra.js';

const wsclient = new WebSocketClient('ws://162.55.245.183:26657/websocket');

wsclient.subscribe('Tx', {}, (response) => {
  console.log('---------------- <NEW RESPONSE> --------------');
  console.log('--------------------------------------------');
  console.log(JSON.stringify(response));
  console.log('--------------------------------------------');
  console.log('---------------- </NEW RESPONSE> --------------');
});

wsclient['start']();

process.stdin.on('data', () => {
  console.log(wsclient.isConnected);
  console.log('shutting ws connection');
  wsclient.destroy();
  process.exit(0);
});
