import {
  Coin,
  Denom,
  isTxError,
  LCDClient,
  MnemonicKey,
  MsgExecuteContract,
  StdFee,
} from '@terra-money/terra.js';

import { terraAmountConverter } from './terra-amount-converter';
import { FiltrationResult, NewTransactionResult } from './types/transaction-filter';

const WALLET_MNEMONIC = new MnemonicKey({
  mnemonic:
    'clown lawsuit shoe hurt feed daring ugly already smile art reveal rail impact alter home fresh gadget prevent code guitar unusual tape dizzy this',
});

export const sendTransaction =
  (terra: LCDClient) =>
  async ({
    taskId,
    satisfiedBuyCondition,
    liquidity,
  }: FiltrationResult): Promise<NewTransactionResult> => {
    const wallet = terra.wallet(WALLET_MNEMONIC);

    const execute = new MsgExecuteContract(
      wallet.key.accAddress,
      liquidity.pairContract,
      {
        swap: {
          offer_asset: {
            info: {
              native_token: {
                denom: satisfiedBuyCondition.denom,
              },
            },
            amount: terraAmountConverter.toTerraFormat(satisfiedBuyCondition.buy),
          },
        },
      },
      [
        new Coin(
          satisfiedBuyCondition.denom,
          terraAmountConverter.toTerraFormat(satisfiedBuyCondition.buy),
        ),
      ],
    );

    const tx = await wallet.createAndSignTx({
      msgs: [execute],
      fee: new StdFee(1000000, [new Coin(Denom.USD, terraAmountConverter.toTerraFormat(5))]),
    });

    const txResult = await terra.tx.broadcast(tx);

    return { taskId, success: !isTxError(txResult), txResult };
  };
