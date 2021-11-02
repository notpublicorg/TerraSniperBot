import { TxInfo } from '@terra-money/terra.js';
import { catchError, map, mergeMap, of, tap } from 'rxjs';

import {
  SendingInProgressTransaction,
  SuccessfullySentTransaction,
  ValidatedAndEnrichedNewTransactionData,
} from './types/workflow';
import { retryAndContinue } from './utils/retry-and-continue';

export type TransactionSender = (
  data: ValidatedAndEnrichedNewTransactionData,
) => Promise<SendingInProgressTransaction>;
export type TxInfoGetter = (hash: string) => Promise<TxInfo>;

export const createTransactionSenderSource =
  (transactionSender: TransactionSender) => (data: ValidatedAndEnrichedNewTransactionData) =>
    of(data).pipe(
      mergeMap(transactionSender),
      retryAndContinue({ retryCount: 2 }),
      catchError((error) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorData = (error as { response: { data: any } }).response?.data || error.message;
        throw new Error(`ERROR on sending transaction: ${errorData}`);
      }),
    );

export const createTransactionCheckerSource =
  (txInfoGetter: TxInfoGetter) =>
  ({ taskId, hash }: SendingInProgressTransaction) =>
    of(hash).pipe(
      mergeMap((txhash) => txInfoGetter(txhash)),
      retryAndContinue({ retryCount: 7, delay: 1000 }),
      catchError((error) => {
        const errorData =
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (error as { response: { data: any } }).response?.data || error.message;
        throw new Error(`ERROR on checking is transaction in block: ${errorData}`);
      }),
      tap((v) => console.log('INFO from checking is transaction in block: ', v)),
      map(
        (txInfo): SuccessfullySentTransaction => ({
          taskId,
          success: txInfo.code === undefined,
          txhash: txInfo.txhash,
          height: txInfo.height,
        }),
      ),
    );
