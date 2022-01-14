import { executeScript } from '../utils/execute-script';

type TerraContractQueryScriptResponse = {
  query_result: {
    assets: Array<{
      amount: string;
    }>;
  };
};

export async function isLiquidityValid(
  walletPassword: string,
  pairContract: string,
): Promise<boolean> {
  const script = `echo "${walletPassword}" | terrad query wasm contract-store ${pairContract} '{"pool":{}}' -o=json`;
  const stdout = await executeScript(script);
  const response: TerraContractQueryScriptResponse = JSON.parse(stdout);
  return response.query_result.assets.every((a) => !a.amount || a.amount === '0');
}
