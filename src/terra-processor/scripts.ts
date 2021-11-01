import { StdFee } from '@terra-money/terra.js';

import { executeScript } from './utils/execute-script';
import { parseSendScriptStdout } from './utils/parse-stdout';

type TerraContractQueryScriptResponse = {
  query_result: {
    assets: Array<{
      amount: string;
    }>;
  };
};

export async function queryContractStore(
  walletPassword: string,
  pairContract: string,
): Promise<TerraContractQueryScriptResponse> {
  const script = `echo "${walletPassword}" | terrad query wasm contract-store ${pairContract} '{"pool":{}}' -o=json`;
  const stdout = await executeScript(script);
  return JSON.parse(stdout);
}

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
  const scriptArgs = `--from=${walletAlias} --chain-id=${chainId} --gas=${fee.gas} --fees=${fees} ${timeoutHeightArg} -y`;
  const execScript = `echo "${walletPassword}" | terrad tx wasm execute ${pairContract} '${executeMsg}' ${buyAmount}${buyDenom} ${scriptArgs}`;

  onStart(execScript);

  const stdout = await executeScript(execScript);
  return parseSendScriptStdout(stdout);
}
