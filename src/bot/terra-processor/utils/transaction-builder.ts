import { Msg, MsgExecuteContract, TxInfo } from '@terra-money/terra.js';

import { ProvideLiquidityParam } from '../types/liquidity';
import { terraAmountConverter } from './terra-types-converter';

export const createWasmExecuteMsg = (
  contract: string,
  liquidity?: {
    token: { amount: number; contract: string };
    currency: { amount: number; denom: string };
  },
): MsgExecuteContract.Data => {
  const execute_msg: ProvideLiquidityParam | undefined = liquidity && {
    provide_liquidity: {
      assets: [
        {
          amount: terraAmountConverter.toTerraFormat(liquidity.token.amount).toString(),
          info: { token: { contract_addr: liquidity.token.contract } },
        },
        {
          amount: terraAmountConverter.toTerraFormat(liquidity.currency.amount).toString(),
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
      contract: contract || 'terra1en087uygr8f57vdczvkhy9465t9y6su4ztq4u3',
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
      logs: [],
      raw_log: '',
      timestamp: '',
      tx: {
        type: 'core/StdTx',
        value: {
          fee: {
            amount: [{ amount: '0', denom: 'ukrw' }],
            gas: '154000',
          },
          memo: '',
          msg: this.msgs,
          signatures: [],
          timeout_height: 'NaN',
        },
      },
      txhash: '6A217CAB31CF3E1D6F0FD8B981C01304FD924DDBF3EDD7B95A698453C27612B7',
    };
  }
}

export const aTransaction = () => new TransactionBuilder();
