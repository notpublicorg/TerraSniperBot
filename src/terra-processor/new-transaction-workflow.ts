import { TxInfo } from '@terra-money/terra.js';
import { catchError, map, mergeMap, of, pipe, tap } from 'rxjs';

import {
  NewTransactionCreationInfo,
  NewTransactionInfo,
  NewTransactionResult,
} from './types/new-transaction-info';
import { retryAndContinue } from './utils/retry-and-continue';

export type TransactionSender = (info: NewTransactionInfo) => Promise<NewTransactionCreationInfo>;
export type TxInfoGetter = (hash: string) => Promise<TxInfo>;

export const newTransactionWorkflow = (
  transactionSender: TransactionSender,
  txInfoGetter: TxInfoGetter,
) =>
  pipe(
    mergeMap((transactionInfo: NewTransactionInfo) =>
      of(transactionInfo).pipe(
        mergeMap(transactionSender),
        retryAndContinue({ retryCount: 2 }),
        catchError((error) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const errorData = (error as { response: { data: any } }).response?.data || error.message;
          throw new Error(`ERROR on sending transaction: ${errorData}`);
        }),
      ),
    ),
    tap((v) => console.log('Send transaction result', v)),
    mergeMap(({ taskId, info }) =>
      of(info.hash).pipe(
        mergeMap((txhash) => txInfoGetter(txhash)),
        retryAndContinue({ retryCount: 7, delay: 1000 }),
        catchError((error) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const errorData = (error as { response: { data: any } }).response?.data || error.message;
          throw new Error(`ERROR on checking is transaction in block: ${errorData}`);
        }),
        tap((v) => console.log('INFO from checking is transaction in block: ', v)),
        map(
          (txInfo): NewTransactionResult => ({
            taskId,
            success: txInfo.code === undefined,
            txhash: txInfo.txhash,
            height: txInfo.height,
          }),
        ),
      ),
    ),
  );
