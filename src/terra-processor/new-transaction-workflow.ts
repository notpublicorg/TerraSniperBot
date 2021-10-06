import { TxInfo } from '@terra-money/terra.js';
import { map, mergeMap, of, pipe, tap } from 'rxjs';

import { TasksProcessorUpdater } from '../core/tasks-processor';
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
  taskUpdater: TasksProcessorUpdater,
) =>
  pipe(
    mergeMap((transactionInfo: NewTransactionInfo) =>
      of(transactionInfo).pipe(
        tap((params) => console.log(params)),
        mergeMap(transactionSender),
        retryAndContinue({
          retryCount: 2,
          onError: (e) => {
            console.log(
              'ERROR on sending transaction: ',
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (e as unknown as { response: { data: any } }).response?.data || e.message,
            );
            taskUpdater({ taskId: transactionInfo.taskId, newStatus: 'active' });
          },
        }),
      ),
    ),
    tap((v) => console.log('Send transaction result', v)),
    mergeMap(({ taskId, info }) =>
      of(info.hash).pipe(
        mergeMap((txhash) => txInfoGetter(txhash)),
        retryAndContinue({
          retryCount: 7,
          delay: 1000,
          onError: (e) => {
            console.log(
              'ERROR on checking is transaction in block: ',
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (e as unknown as { response: { data: any } }).response?.data || e.message,
            );
            taskUpdater({ taskId, newStatus: 'active' });
          },
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
