import { TendermintAPILocal } from './external/tendermintAPI';

export const getTimeoutHeight =
  (
    tendermintApi: TendermintAPILocal,
    { validBlockHeightOffset }: { validBlockHeightOffset: number | false },
  ) =>
  async () => {
    if (typeof validBlockHeightOffset !== 'number') return;

    const currentBlockHeight = await tendermintApi.getCurrentBlockHeight();

    return currentBlockHeight + 1 + validBlockHeightOffset;
  };
