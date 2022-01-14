import { Msg, MsgExecuteContract, StdTx } from '@terra-money/terra.js';
import { filter, map, mergeMap, pipe } from 'rxjs';

import {
  LiquidityCurrencyAmount,
  LiquidityTokenAmount,
  ProvideLiquidityParam,
} from './types/liquidity';
import { ParsedLiquidity } from './types/workflow';

export const tryGetLiquidityMsgs = pipe(
  mergeMap((t: StdTx.Data['value']) => t.msg),
  filter(isValidSmartContract),
  map(parseLiquidityInfo),
  filter(Boolean),
);

function isValidSmartContract(msg: Msg.Data): msg is MsgExecuteContract.Data {
  return msg.type === 'wasm/MsgExecuteContract' && Boolean(msg.value.execute_msg);
}

function parseLiquidityInfo({ value }: MsgExecuteContract.Data): ParsedLiquidity | null {
  const parsed: ProvideLiquidityParam =
    typeof value.execute_msg === 'string'
      ? JSON.parse(Buffer.from(value.execute_msg as unknown as string, 'base64').toString('utf8'))
      : value.execute_msg;

  if (!parsed || !parsed.provide_liquidity || !parsed.provide_liquidity.assets) return null;

  const currencyInfo = parsed.provide_liquidity.assets.find(
    (a) => 'native_token' in a.info,
  ) as LiquidityCurrencyAmount;
  const tokenInfo = parsed.provide_liquidity.assets.find(
    (a) => 'token' in a.info,
  ) as LiquidityTokenAmount;

  if (!currencyInfo || !tokenInfo) return null;

  return {
    pairContract: value.contract,
    token: {
      amount: +tokenInfo.amount,
      contract: tokenInfo.info.token.contract_addr,
    },
    currency: {
      amount: +currencyInfo.amount,
      denom: currencyInfo.info.native_token.denom,
    },
  };
}
