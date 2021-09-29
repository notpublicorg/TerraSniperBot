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
import { TransactionMetaInfo } from './types/meta';
import { NewTransactionInfo, NewTransactionResult } from './types/new-transaction-info';

const WALLET_MNEMONIC = new MnemonicKey({
  mnemonic:
    'clown lawsuit shoe hurt feed daring ugly already smile art reveal rail impact alter home fresh gadget prevent code guitar unusual tape dizzy this',
});

export const sendTransaction =
  (terra: LCDClient, meta: TransactionMetaInfo) =>
  async ({
    taskId,
    pairContract,
    buyAmount,
    buyDenom,
  }: NewTransactionInfo): Promise<NewTransactionResult> => {
    meta.newTransactionSendStartDateTime = new Date().toLocaleString();
    const wallet = terra.wallet(WALLET_MNEMONIC);

    const execute = new MsgExecuteContract(
      wallet.key.accAddress,
      pairContract,
      {
        swap: {
          offer_asset: {
            info: {
              native_token: {
                denom: buyDenom,
              },
            },
            amount: terraAmountConverter.toTerraFormat(buyAmount),
          },
        },
      },
      [new Coin(buyDenom, terraAmountConverter.toTerraFormat(buyAmount))],
    );

    const tx = await wallet.createAndSignTx({
      msgs: [execute],
      fee: new StdFee(1000000, [new Coin(Denom.USD, terraAmountConverter.toTerraFormat(5))]),
    });

    const txResult = await terra.tx.broadcast(tx);

    meta.newTransactionSendEndDateTime = new Date().toLocaleString();

    return { taskId, success: !isTxError(txResult), txResult };
  };
