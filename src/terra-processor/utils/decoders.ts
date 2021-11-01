import { Coins, MsgExecuteContract, StdFee, StdTx } from '@terra-money/terra.js';
import { Tx as TxProto } from '@terra-money/terra.proto/cosmos/tx/v1beta1/tx';
import { MsgExecuteContract as MsgExecuteContractProto } from '@terra-money/terra.proto/terra/wasm/v1beta1/tx';

const SUPPORTED_MESSAGE_HANDLERS = new Map([
  [
    'MsgExecuteContract',
    {
      proto: MsgExecuteContractProto,
      mapper: (value: MsgExecuteContractProto) =>
        new MsgExecuteContract(
          value.sender || '',
          value.contract || '',
          JSON.parse(value.executeMsg.toString()),
          Coins.fromData(value.coins || []),
        ),
    },
  ],
]);
const checkExistence = <T>(val: T | null): val is T => !!val;

export function decodeTransaction(encodedTx: string) {
  try {
    const { authInfo, body } = TxProto.decode(Buffer.from(encodedTx, 'base64'));

    return body
      ? new StdTx(
          body.messages
            .map((message) => {
              const messageTypeParts = message.typeUrl.split('.');
              const messageType = messageTypeParts[messageTypeParts.length - 1];

              const msgHandler = SUPPORTED_MESSAGE_HANDLERS.get(messageType);

              if (!msgHandler) return null;

              const decodedMessage = msgHandler.proto.decode(message.value);

              return msgHandler.mapper(decodedMessage);
            })
            .filter(checkExistence),
          authInfo?.fee
            ? new StdFee(authInfo.fee.gasLimit.toNumber(), Coins.fromData(authInfo.fee.amount))
            : new StdFee(0, []),
          [], // NOTE: also can be parsed with protos if needed
          body.memo,
          body.timeoutHeight.toNumber(),
        )
      : null;
  } catch (e) {
    console.log('ERROR on decoding: ', encodedTx);
    console.error(e);
    return null;
  }
}
