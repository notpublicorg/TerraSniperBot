import { StdFee } from '@terra-money/terra.js';
import { APIRequester } from '@terra-money/terra.js/dist/client/lcd/APIRequester';
import { exec } from 'child_process';

import { TransactionSender } from '../new-transaction-workflow';
import { StatusResponse } from '../types/tendermint-responses';
import { parseStdout } from '../utils/parse-stdout';
import { TransactionMetaJournal } from '../utils/transaction-meta-journal';

export const swapTransactionWithScript =
  ({
    fee,
    validBlockHeightOffset,
    chainId,
    walletAlias,
    walletPassword,
    tendermintApi,
  }: {
    fee: StdFee;
    validBlockHeightOffset: number;
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

    const statusResponse = await tendermintApi.getRaw<StatusResponse>('/status');
    const currentBlockHeight = statusResponse.result.sync_info.latest_block_height;
    const timeout_height = (+currentBlockHeight || 0) + 1 + validBlockHeightOffset;

    const scriptArgs = `--from=${walletAlias} --chain-id=${chainId} --gas=${fee.gas} --fees=${fees} --timeout-height=${timeout_height} -y`;
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
