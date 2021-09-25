import { LCDClient, WebSocketClient } from '@terra-money/terra.js';

type WebsocketTxResponse = {
  type: 'tendermint/event/Tx';
  value: {
    TxResult: {
      height: string;
      result: Record<string, unknown>;
      tx: string;
      txhash: string;
    };
  };
};

const wsclient = new WebSocketClient('ws://162.55.245.183:26657/websocket');

const terra = new LCDClient({
  URL: 'https://bombay-lcd.terra.dev',
  chainID: 'bombay-11',
});

function getWsResponse() {
  return new Promise<WebsocketTxResponse>((resolve) => {
    wsclient.subscribeTx({}, (response) => {
      wsclient.destroy();

      resolve(response as WebsocketTxResponse);
    });

    wsclient['start']();
  });
}

function getTransaction(txHash: string) {
  return terra.tx.txInfo(txHash);
}

test.skip('ws contract', async () => {
  const EXPECTED_TX_RESPONSE = {
    type: 'tendermint/event/Tx',
    value: {
      TxResult: {
        height: expect.any(String), // '5963173',
        result: expect.anything(),
        tx: expect.any(String), // 'CsQBCsEBCiYvdGVycmEud2FzbS52MWJldGExLk1zZ0V4ZWN1dGVDb250cmFjdBKWAQosdGVycmExeHo4eDlkNjR1YTJ0dGZ5djV1Nmw0eHNqd3MybjByZnJjOXQ5dHASLHRlcnJhMXc1bTMwZWY3ZW1sOGdnNXBybHF6Nnl3dXF1cjk0eXd5a2FzcmE2Gjh7InN1Ym1pdCI6eyJyb3VuZF9pZCI6ODUwNywic3VibWlzc2lvbiI6IjI4NDU2MjAwMDAwMCJ9fRJqClIKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiEChNwXMh0XvWkQ/4g+dz9EAy4XqdmDjlmA9GN0bBADohISBAoCCAEYm+QBEhQKDgoFdWx1bmESBTQ1MDAwEOCnEhpAvjRws8Iy3qpYxLGEX2Uptf83szD7TMQsCIglJyOBW3kDR0Y/1jDbpXKO3g15hWEW65l0KdbtJ2BxQMMXnUfXQQ==',
        txhash: expect.any(String), // '325A1FCA86052755EE3D837EB0B113347F7FB68F1A96CA975C3EA0590F07F523',
      },
    },
  };

  const response = await getWsResponse();
  expect(response).toEqual(EXPECTED_TX_RESPONSE);
});

test('getting tx', async () => {
  const response = await getWsResponse();

  const transaction = await getTransaction(response.value.TxResult.txhash);

  expect(transaction.txhash).toEqual(response.value.TxResult.txhash);
});
