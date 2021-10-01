import { Denom } from '@terra-money/terra.js';

export type TerraProcessorCoin = {
  denom: Denom;
  amount: number;
};
