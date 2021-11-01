import { parseSendScriptStdout } from './parse-stdout';

it('should get txhash from stdout string', () => {
  const STDOUT =
    'code: 0\n' +
    'codespace: ""\n' +
    'data: ""\n' +
    'gas_used: "0"\n' +
    'gas_wanted: "0"\n' +
    'height: "0"\n' +
    'info: ""\n' +
    'logs: []\n' +
    "raw_log: '[]'\n" +
    'timestamp: ""\n' +
    'tx: null\n' +
    'txhash: 550B73C2E14F0CB24CCB14D6ADA7DDFA0F78EB361A026ADC792F7BEF55E6F322\n';

  const parsed = parseSendScriptStdout(STDOUT);

  expect(parsed).toEqual({
    txhash: '550B73C2E14F0CB24CCB14D6ADA7DDFA0F78EB361A026ADC792F7BEF55E6F322',
  });
});
