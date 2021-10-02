import { Coin, StdFee } from '@terra-money/terra.js';

import { createGasPriceCalculator } from './calculate-gas-prices';
import { Denom } from './denom';

const OPTIONS = {
  defaultDenom: Denom.USD,
  defaultPrice: 2.9,
  minUusdPrice: 0.2,
  minLunaPrice: 0.015,
};

const calculateGasPrices = createGasPriceCalculator(OPTIONS);

it('should return default gas price if there is fee', () => {
  const gasPrices = calculateGasPrices({
    gas: '30000',
    amount: [],
  });

  expect(gasPrices).toEqual([new Coin(OPTIONS.defaultDenom, OPTIONS.defaultPrice)]);
});

it('should calculate gas price for LUNA and USD', () => {
  const MAX_GAS = 3;
  const USD_FEE_AMOUNT = 3;
  const LUNA_FEE_AMOUNT = 6;

  const LIQUIDITY_FEE: StdFee.Data = {
    gas: MAX_GAS.toString(),
    amount: [
      {
        denom: Denom.USD,
        amount: USD_FEE_AMOUNT.toString(),
      },
      { denom: Denom.LUNA, amount: LUNA_FEE_AMOUNT.toString() },
      { denom: Denom.EUR, amount: '10000000' },
    ],
  };

  const gasPrices = calculateGasPrices(LIQUIDITY_FEE);

  expect(gasPrices).toEqual([
    new Coin(Denom.USD, (USD_FEE_AMOUNT / MAX_GAS) * 0.94),
    new Coin(Denom.LUNA, (LUNA_FEE_AMOUNT / MAX_GAS) * 0.94),
  ]);
});

it('should set minimal values if result of calculation is lower', () => {
  const MAX_GAS = 3;
  const USD_FEE_AMOUNT = OPTIONS.minUusdPrice;
  const LUNA_FEE_AMOUNT = OPTIONS.minLunaPrice;

  const LIQUIDITY_FEE: StdFee.Data = {
    gas: MAX_GAS.toString(),
    amount: [
      {
        denom: Denom.USD,
        amount: USD_FEE_AMOUNT.toString(),
      },
      { denom: Denom.LUNA, amount: LUNA_FEE_AMOUNT.toString() },
      { denom: Denom.EUR, amount: '10000000' },
    ],
  };

  const gasPrices = calculateGasPrices(LIQUIDITY_FEE);

  expect(gasPrices).toEqual([
    new Coin(Denom.USD, OPTIONS.minUusdPrice),
    new Coin(Denom.LUNA, OPTIONS.minLunaPrice),
  ]);
});
