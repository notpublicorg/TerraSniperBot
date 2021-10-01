import { Denom, StdFee } from '@terra-money/terra.js';

import { TerraProcessorCoin } from '../types/coin';
import { terraCoinConverter } from './terra-types-converter';

export function createGasPriceCalculator(options: {
  defaultDenom: string;
  defaultPrice: number;
  minUusdPrice: number;
  minLunaPrice: number;
}) {
  const minimalPricesMap: Record<string, number> = {
    [Denom.USD]: options.minUusdPrice,
    [Denom.LUNA]: options.minLunaPrice,
  };

  return (liquidityFee: StdFee.Data): TerraProcessorCoin[] => {
    const feeCoins = liquidityFee?.amount
      ? terraCoinConverter.toAppFormat(
          liquidityFee.amount.filter((c) => [Denom.USD, Denom.LUNA].includes(c.denom)),
        )
      : [];

    if (!feeCoins.length)
      return [
        {
          denom: options.defaultDenom,
          amount: options.defaultPrice,
        },
      ];

    const maxGas = +liquidityFee.gas;

    const gasPrices = feeCoins.map((c) => {
      const calculatedPrice = (c.amount / maxGas) * 0.94;
      const minimalPrice = minimalPricesMap[c.denom];

      return {
        denom: c.denom,
        amount:
          minimalPrice === undefined || minimalPrice < calculatedPrice
            ? calculatedPrice
            : minimalPrice,
      };
    });

    return gasPrices;
  };
}
