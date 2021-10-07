import { Coins, MsgExecuteContract, StdFee, StdTx } from '@terra-money/terra.js';
import {
  protobufPackage as cosmosCryptoSecp256k1Package,
  PubKey as PubKeyProto,
} from '@terra-money/terra.proto/cosmos/crypto/secp256k1/keys';
import { Tx as TxProto } from '@terra-money/terra.proto/cosmos/tx/v1beta1/tx';
import {
  MsgExecuteContract as MsgExecuteContractProto,
  protobufPackage as terraWasmTxPacakge,
} from '@terra-money/terra.proto/terra/wasm/v1beta1/tx';

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

export function encodeTransaction(tx: StdTx) {
  const msg = tx.msg[0].toData().value as MsgExecuteContract.Data['value'];
  const msgInProtoType = MsgExecuteContractProto.fromJSON({
    sender: msg.sender,
    contract: msg.contract,
    coins: msg.coins,
    executeMsg: Buffer.from(JSON.stringify(msg.execute_msg)).toString('base64'),
  });
  const encodedMsg = MsgExecuteContractProto.encode(msgInProtoType).finish();

  const pubKey = tx.signatures[0].pub_key.toData().value as string;
  const pubKeyInProtoType = PubKeyProto.fromJSON({
    key: pubKey,
  });
  const encodedPubKey = PubKeyProto.encode(pubKeyInProtoType).finish();

  const txInProtoType = TxProto.fromJSON({
    body: {
      messages: [
        {
          typeUrl: `/${terraWasmTxPacakge}.MsgExecuteContract`,
          value: Buffer.from(encodedMsg).toString('base64'),
        },
      ],
      memo: tx.memo,
      timeoutHeight: tx.timeout_height.toString(),
    },
    signatures: tx.signatures.map((s) => s.signature),
    authInfo: {
      signerInfos: [
        {
          publicKey: {
            typeUrl: `/${cosmosCryptoSecp256k1Package}.PubKey`,
            value: Buffer.from(encodedPubKey).toString('base64'),
          },
        },
      ],
      fee: {
        amount: tx.fee.amount.toData(),
        gasLimit: tx.fee.gas.toString(),
      },
    },
  });
  const encodedTx = TxProto.encode(txInProtoType).finish();

  return Buffer.from(encodedTx).toString('base64');
}
