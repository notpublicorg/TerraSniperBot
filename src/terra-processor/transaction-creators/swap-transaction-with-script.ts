import { StdFee } from '@terra-money/terra.js';
import { exec } from 'child_process';

import { TransactionSender } from '../new-transaction-workflow';

export const swapTransactionWithScript =
  ({
    fee,
    validBlockHeightOffset,
    chainId,
    walletAlias,
    walletPassword,
  }: {
    fee: StdFee;
    validBlockHeightOffset: number;
    chainId: string;
    walletAlias: string;
    walletPassword: string;
  }): TransactionSender =>
  ([{ taskId, pairContract, buyAmount, buyDenom }, { currentBlockHeight }]) => {
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
    const timeout_height = (+currentBlockHeight || 0) + 1 + validBlockHeightOffset;

    const scriptArgs = `--from=${walletAlias} --chain-id=${chainId} --gas=${fee.gas} --fees=${fees} --timeout-height=${timeout_height} -y`;

    return new Promise((resolve, reject) =>
      exec(
        `echo "${walletPassword}" | terrad tx wasm execute ${pairContract} '${executeMsg}' ${buyAmount}${buyDenom} ${scriptArgs}`,
        (error, stdout, stderr) => {
          if (error) {
            reject(error);
            return;
          }
          if (stderr) {
            reject(stderr);
            return;
          }

          resolve({ taskId, stdout });
        },
      ),
    );
  };
