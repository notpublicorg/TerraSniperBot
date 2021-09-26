import { Msg, MsgExecuteContract, TxInfo } from '@terra-money/terra.js';

import { ProvideLiquidityParam } from './types/liquidity';
import { ParsedLiquidity } from './types/transaction-filter';

export const createWasmExecuteMsg = (liquidity?: ParsedLiquidity): MsgExecuteContract.Data => {
  const execute_msg: ProvideLiquidityParam | undefined = liquidity && {
    provide_liquidity: {
      assets: [
        {
          amount: liquidity.token.amount,
          info: { token: { contract_addr: liquidity.token.contract } },
        },
        {
          amount: liquidity.currency.amount,
          info: { native_token: { denom: liquidity.currency.denom } },
        },
      ],
      slippage_tolerance: '0.01',
    },
  };

  return {
    type: 'wasm/MsgExecuteContract',
    value: {
      coins: [],
      contract: 'terra1en087uygr8f57vdczvkhy9465t9y6su4ztq4u3',
      // eslint-disable-next-line @typescript-eslint/ban-types
      execute_msg: execute_msg || {},
      sender: 'terra1nfzgmsvfucalgpwq5s4wcq6cey3rrzcalvcf26',
    },
  };
};

class TransactionBuilder {
  private msgs: Msg.Data[] = [
    {
      type: 'market/MsgSwap',
      value: {
        trader: 'terra1kr8ym0ll5jnffl8tmakl3vqhh9f49u2ccq0w55',
        offer_coin: { denom: 'usdr', amount: '100000000' },
        ask_denom: 'ukrw',
      },
    },
  ];

  withMsgs(msgs: Msg.Data[]) {
    this.msgs = msgs;
    return this;
  }

  build(): TxInfo.Data {
    return {
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
      raw_log: '',
      timestamp: '',
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
          msg: this.msgs,
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
  }
}

export const aTransaction = () => new TransactionBuilder();
