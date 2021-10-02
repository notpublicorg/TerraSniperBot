import { Coin, StdFee } from '@terra-money/terra.js';

import { Denom } from '../utils/denom';

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

  return (liquidityFee: StdFee.Data): Coin[] => {
    const feeCoins = liquidityFee?.amount
      ? liquidityFee.amount.filter((c) => [Denom.USD, Denom.LUNA].includes(c.denom))
      : [];

    if (!feeCoins.length) return [new Coin(options.defaultDenom, options.defaultPrice)];

    const maxGas = +liquidityFee.gas;

    const gasPrices = feeCoins.map((c) => {
      const calculatedPrice = (+c.amount / maxGas) * 0.94;
      const minimalPrice = minimalPricesMap[c.denom];

      return new Coin(
        c.denom,
        minimalPrice === undefined || minimalPrice < calculatedPrice
          ? calculatedPrice
          : minimalPrice,
      );
    });

    return gasPrices;
  };
}
