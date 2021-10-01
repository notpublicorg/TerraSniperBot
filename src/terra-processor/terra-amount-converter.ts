const MILLION = 1000000;

export const terraAmountConverter = {
  toTerraFormat(amount: number | string) {
    return (+amount * MILLION).toString();
  },

  toNumber(terraAmount: string) {
    return +terraAmount / MILLION;
  },
};
