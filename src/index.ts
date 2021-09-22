import { LCDClient, MsgExecuteContract } from '@terra-money/terra.js';

const data = {
  infos: [],
};

const intervalId = setInterval(async () => {
  const terra = new LCDClient({
    URL: 'https://lcd.terra.dev',
    chainID: 'tequila-0004',
  });

  try {
    const transactions = await terra.tx.txInfosByHeight(undefined);
    const contractInfo = transactions
      .filter((txInfo) =>
        txInfo.tx.toData().value.msg.some((m) => {
          if (m.type === 'wasm/MsgExecuteContract') {
            const executeMsg = JSON.parse(
              Buffer.from(m.value.execute_msg as unknown as string, 'base64').toString('utf8'),
            );
            return Object.keys(executeMsg).includes('provide_liquidity');
          }

          return false;
        }),
      )
      .map((txInfo) =>
        txInfo.tx.toData().value.msg.map((m: MsgExecuteContract.Data) => ({
          ...m,
          value: {
            ...m.value,
            execute_msg:
              m.value.execute_msg &&
              JSON.parse(
                Buffer.from(m.value.execute_msg as unknown as string, 'base64').toString('utf8'),
              ),
          },
        })),
      );

    if (contractInfo.length) {
      data.infos.push(contractInfo);
    }

    if (data.infos.length > 5) {
      clearInterval(intervalId);
      console.log(JSON.stringify(data));
    }
  } catch (e) {}
}, 5000);
