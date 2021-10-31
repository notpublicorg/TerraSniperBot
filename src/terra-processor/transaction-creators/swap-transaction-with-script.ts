import { StdFee } from '@terra-money/terra.js';
import { APIRequester } from '@terra-money/terra.js/dist/client/lcd/APIRequester';
import { exec } from 'child_process';

import { TransactionSender } from '../new-transaction-workflow';
import { StatusResponse } from '../types/tendermint-responses';
import { parseStdout } from '../utils/parse-stdout';
import { retryAction } from '../utils/retry-and-continue';
import { TransactionMetaJournal } from '../utils/transaction-meta-journal';

export const getTimeoutHeight =
  (
    tendermintApi: APIRequester,
    { validBlockHeightOffset }: { validBlockHeightOffset: number | false },
  ) =>
  async () => {
    if (typeof validBlockHeightOffset !== 'number') return;

    const statusResponse = await tendermintApi.getRaw<StatusResponse>('/status');
    const currentBlockHeight = +statusResponse.result.sync_info.latest_block_height;

    if (!currentBlockHeight)
      throw new Error(
        `Something wrong with getting block height - ${
          statusResponse.result.sync_info.latest_block_height
        }. Response = ${JSON.stringify(statusResponse)}`,
      );

    return currentBlockHeight + 1 + validBlockHeightOffset;
  };

export const swapTransactionWithScript =
  ({
    fee,
    validBlockHeightOffset,
    requestBlockHeigthRetryCount,
    chainId,
    walletAlias,
    walletPassword,
    tendermintApi,
  }: {
    fee: StdFee;
    validBlockHeightOffset: number | false;
    requestBlockHeigthRetryCount: number;
    chainId: string;
    walletAlias: string;
    walletPassword: string;
    tendermintApi: APIRequester;
  }) =>
  (metaJournal: TransactionMetaJournal): TransactionSender =>
  async ({ taskId, pairContract, buyAmount, buyDenom }) => {
    const executeMsg = JSON.stringify({
      swap: {
        offer_asset: {
          info: {
            native_token: {
              denom: buyDenom,
            },
          },
          amount: buyAmount.toString(),
        },
      },
    });
    const fees = fee.amount.map((c) => c.toString()).join(',');

    metaJournal.onBlockInfoFetchingStart();

    const timeoutHeight = await retryAction(
      getTimeoutHeight(tendermintApi, {
        validBlockHeightOffset,
      }),
      {
        retryCount: requestBlockHeigthRetryCount,
        errorLogger: console.log,
      },
    );

    const timeoutHeightArg = timeoutHeight ? `--timeout-height=${timeoutHeight}` : '';
    const scriptArgs = `--from=${walletAlias} --chain-id=${chainId} --gas=${fee.gas} --fees=${fees} ${timeoutHeightArg} -y`;
    const execScript = `echo "${walletPassword}" | terrad tx wasm execute ${pairContract} '${executeMsg}' ${buyAmount}${buyDenom} ${scriptArgs}`;

    metaJournal.onScriptExecutingStart(execScript);

    return new Promise((resolve, reject) =>
      exec(execScript, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        if (stderr) {
          reject(stderr);
          return;
        }

        const parsedInfo = parseStdout(stdout);

        resolve({ taskId, hash: parsedInfo.txhash || '' });
      }),
    );
  };
