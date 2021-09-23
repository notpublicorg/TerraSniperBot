import { TxInfo } from '@terra-money/terra.js';

export type BuyCondition = Record<string, { greaterOrEqual: number }>;

export function checkTransaction(
  filter: {
    contract: string;
    chosenCoins: string[];
    condition: BuyCondition;
  },
  transaction: TxInfo.Data,
) {
  if (
    transaction.tx.value.msg.some(
      (m) =>
        m.type === 'wasm/MsgExecuteContract' &&
        filter.contract === m.value.contract &&
        m.value.execute_msg &&
        Object.keys(
          JSON.parse(
            Buffer.from(m.value.execute_msg as unknown as string, 'base64').toString('utf8'),
          ),
        ).includes('provide_liquidity') &&
        m.value.coins.some(
          (c) =>
            filter.chosenCoins.includes(c.denom) &&
            filter.condition[c.denom] &&
            +c.amount >= filter.condition[c.denom].greaterOrEqual,
        ),
    )
  ) {
    return true;
  }
  return false;
}
