export const MILLION = 1000000;

export const terraAmountConverter = {
  toTerraFormat(amount: number) {
    return amount * MILLION;
  },

  toNumber(terraAmount: string) {
    return +terraAmount / MILLION;
  },
};
