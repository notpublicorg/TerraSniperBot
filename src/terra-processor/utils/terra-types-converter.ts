import { Coin } from '@terra-money/terra.js';

import { TerraProcessorCoin } from '../types/coin';

const MILLION = 1000000;

export const terraAmountConverter = {
  toTerraFormat(amount: number) {
    return (amount * MILLION).toString();
  },

  toNumber(terraAmount: string) {
    return +terraAmount / MILLION;
  },
};

export const terraCoinConverter = {
  toTerraFormat(coins: TerraProcessorCoin[]): Coin.Data[] {
    return coins.map((c) => ({
      denom: c.denom,
      amount: terraAmountConverter.toTerraFormat(c.amount),
    }));
  },
  toAppFormat(coins: Coin.Data[]): TerraProcessorCoin[] {
    return coins.map<TerraProcessorCoin>((c) => ({
      denom: c.denom,
      amount: terraAmountConverter.toNumber(c.amount),
    }));
  },
};
