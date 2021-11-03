import { StdFee } from '@terra-money/terra.js';

import { executeScript } from '../utils/execute-script';

type TerraSendScriptResponse = {
  txhash?: string;
};

export async function sendTransaction({
  timeoutHeight,
  walletAlias,
  walletPassword,
  chainId,
  fee,
  pairContract,
  buyDenom,
  buyAmount,
  onStart,
}: {
  timeoutHeight: number | undefined;
  walletAlias: string;
  walletPassword: string;
  chainId: string;
  fee: StdFee;
  pairContract: string;
  buyDenom: string;
  buyAmount: number;
  onStart: (scriptText: string) => void;
}) {
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
  const timeoutHeightArg = timeoutHeight ? `--timeout-height=${timeoutHeight}` : '';
  const scriptArgs = `--from=${walletAlias} --chain-id=${chainId} --gas=${fee.gas} --fees=${fees} ${timeoutHeightArg} -y -o=json`;
  const execScript = `echo "${walletPassword}" | terrad tx wasm execute ${pairContract} '${executeMsg}' ${buyAmount}${buyDenom} ${scriptArgs}`;

  onStart(execScript);

  const stdout = await executeScript(execScript);
  const response: TerraSendScriptResponse = JSON.parse(stdout);

  return response;
}
