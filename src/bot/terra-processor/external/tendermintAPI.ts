import { APIRequester } from '@terra-money/terra.js/dist/client/lcd/APIRequester';

import { StatusResponse, UnconfirmedTxsResponse } from '../types/tendermint-responses';

export class TendermintAPILocal {
  private api: APIRequester;

  constructor(url: string) {
    this.api = new APIRequester(url);
  }

  getUnconfirmedTxs() {
    return this.api.getRaw<UnconfirmedTxsResponse>('/unconfirmed_txs', { limit: 100 });
  }

  getStatus() {
    return this.api.getRaw<StatusResponse>('/status');
  }

  async getCurrentBlockHeight() {
    const statusResponse = await this.getStatus();
    const currentBlockHeight = +statusResponse.result.sync_info.latest_block_height;

    if (!currentBlockHeight)
      throw new Error(
        `Something wrong with getting block height - ${
          statusResponse.result.sync_info.latest_block_height
        }. Response = ${JSON.stringify(statusResponse)}`,
      );

    return currentBlockHeight;
  }
}
