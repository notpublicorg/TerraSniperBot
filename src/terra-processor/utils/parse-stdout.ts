type TerraExecuteScriptResponse = {
  txhash?: string;
};

export function parseStdout(stdout: string) {
  return stdout.split('\n').reduce((parsed, currentRow) => {
    const [prop, value] = currentRow.split(': ');

    if (prop !== 'txhash') return parsed;

    parsed[prop as keyof TerraExecuteScriptResponse] = value;

    return parsed;
  }, {} as TerraExecuteScriptResponse);
}
