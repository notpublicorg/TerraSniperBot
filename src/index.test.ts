import { BlockInfo, LCDClient, TxInfo, WebSocketClient } from '@terra-money/terra.js';

const BLOCK: BlockInfo = {
  block_id: {
    hash: expect.any(String),
    parts: {
      hash: expect.any(String),
      total: expect.any(String),
    },
  },
  block: {
    header: {
      app_hash: expect.any(String),
      chain_id: 'columbus-4',
      consensus_hash: expect.any(String),
      data_hash: expect.any(String),
      evidence_hash: '',
      height: expect.any(String),
      last_block_id: {
        hash: expect.any(String),
        parts: {
          hash: expect.any(String),
          total: expect.any(String),
        },
      },
      last_commit_hash: expect.any(String),
      last_results_hash: expect.any(String),
      next_validators_hash: expect.any(String),
      proposer_address: expect.any(String),
      time: expect.any(String),
      validators_hash: expect.any(String),
      version: {
        app: '0',
        block: '10',
      },
    },
    data: {
      txs: expect.arrayContaining([expect.any(String)]), // base64 strings
    },
    evidence: {
      evidence: null,
    },
    last_commit: {
      block_id: {
        hash: expect.any(String),
        parts: {
          hash: expect.any(String),
          total: expect.any(String),
        },
      },
      height: expect.any(String),
      round: '0',
      signatures: expect.arrayContaining([
        {
          block_id_flag: 2,
          signature: expect.any(String),
          timestamp: expect.any(String),
          validator_address: expect.any(String),
        },
      ]),
    },
  },
};

const TRANSACTION: TxInfo.Data = {
  gas_used: '107686',
  gas_wanted: '154000',
  height: '4622906', // NOTE: height of the transaction's block
  logs: [
    {
      events: [
        {
          attributes: [
            {
              key: 'voter',
              value: 'terravaloper1kprce6kc08a6l03gzzh99hfpazfjeczfpzkkau',
            },
            {
              key: 'exchange_rates',
              value:
                '27.500000000000000000uusd,34070.000000000000000000ukrw,19.407960000000002765usdr,78079.039115000006859191umnt,23.442512499999999420ueur,20.158874999999998323ugbp,177.905832500000002483ucny,3012.116250000000036380ujpy,2032.731277500000032887uinr,35.199175000000003877ucad,25.379337499999998329uchf,214.110874999999992951uhkd,37.952694999999998515uaud,37.174637499999995782usgd,918.981387499999982538uthb,238.610350000000011050usek,174.317027499999994689udkk,391749.875000000000000000uidr,1382.703162499999962165uphp',
            },
            {
              key: 'feeder',
              value: 'terra1t0r8ugz3kdg4ucwurppx9vymwkldlexdfvzlyt',
            },
          ],
          type: 'aggregate_vote',
        },
        {
          attributes: [
            {
              key: 'action',
              value: 'aggregateexchangeratevote',
            },
            {
              key: 'module',
              value: 'oracle',
            },
          ],
          type: 'message',
        },
      ],
      log: '',
      msg_index: 0,
    },
    {
      events: [
        {
          attributes: [
            {
              key: 'voter',
              value: 'terravaloper1kprce6kc08a6l03gzzh99hfpazfjeczfpzkkau',
            },
            {
              key: 'feeder',
              value: 'terra1t0r8ugz3kdg4ucwurppx9vymwkldlexdfvzlyt',
            },
          ],
          type: 'aggregate_prevote',
        },
        {
          attributes: [
            {
              key: 'action',
              value: 'aggregateexchangerateprevote',
            },
            {
              key: 'module',
              value: 'oracle',
            },
          ],
          type: 'message',
        },
      ],
      log: '',
      msg_index: 1,
    },
  ],
  raw_log: expect.any(String),
  timestamp: expect.any(String),
  tx: {
    type: 'core/StdTx',
    value: {
      fee: {
        amount: [
          {
            amount: '0',
            denom: 'ukrw',
          },
        ],
        gas: '154000',
      },
      memo: '',
      msg: [
        {
          type: 'wasm/MsgExecuteContract',
          value: {
            coins: [],
            contract: 'terra1en087uygr8f57vdczvkhy9465t9y6su4ztq4u3',
            execute_msg: {},
            sender: 'terra1nfzgmsvfucalgpwq5s4wcq6cey3rrzcalvcf26',
          },
        },
      ],
      signatures: [
        {
          pub_key: {
            type: 'tendermint/PubKeySecp256k1',
            value: 'A4RDdgjQPNWfgJswEBNY59qEk6HUFGw17J9h7t/HhUCW',
          },
          signature:
            'C0cS4Df0HLft3AJhM81dK1/vWqqAW5bMEi2BXtaeYw9ub4/W/JJcHU120K9r+BClrv6k4wHJvp09jGNVoncU9Q==',
        },
      ],
      timeout_height: 'NaN',
    },
  },
  txhash: '6A217CAB31CF3E1D6F0FD8B981C01304FD924DDBF3EDD7B95A698453C27612B7',
};

it.skip('should connect to websocket', async () => {
  const wsclient = new WebSocketClient('ws://lcd.terra.dev/websocket');

  const subscription = new Promise((resolve) => {
    wsclient.subscribe('NewBlock', {}, (response) => {
      wsclient.destroy();

      resolve(response);
    });
  });

  await expect(subscription).resolves.toBeNull();
});

it.skip('should get latest blockInfo', async () => {
  const terra = new LCDClient({
    URL: 'https://lcd.terra.dev',
    chainID: 'tequila-0004',
  });

  const blockInfo = await terra.tendermint.blockInfo();

  expect(blockInfo).toEqual(BLOCK);
});

it.skip('should get transactions info', async () => {
  const terra = new LCDClient({
    URL: 'https://lcd.terra.dev',
    chainID: 'tequila-0004',
  });

  const transactions = await terra.tx.txInfosByHeight(undefined);

  expect(transactions[0].toData()).toEqual(TRANSACTION);
});
