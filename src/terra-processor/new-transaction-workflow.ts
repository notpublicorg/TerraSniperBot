import { TxInfo } from '@terra-money/terra.js';
import { filter, map, mergeMap, of, pipe, tap } from 'rxjs';

import { SniperTask } from '../sniper-task';
import { TasksProcessorUpdateParams, TasksProcessorUpdater } from '../tasks-processor';
import {
  NewTransactionCreationInfo,
  NewTransactionInfo,
  NewTransactionResult,
} from './types/new-transaction-info';
import { retryAndContinue } from './utils/retry-and-continue';

export type TransactionSender = (info: NewTransactionInfo) => Promise<NewTransactionCreationInfo>;
export type TxInfoGetter = (hash: string) => Promise<TxInfo>;

export const createNewTransactionPreparationFlow = (
  tasksGetter: () => SniperTask[],
  taskUpdater: (params: TasksProcessorUpdateParams) => void,
) =>
  pipe(
    map(
      ({ taskId, satisfiedBuyCondition, liquidity }): NewTransactionInfo => ({
        taskId,
        isTaskActive: tasksGetter().find((t) => t.id === taskId)?.status === 'active',
        buyDenom: satisfiedBuyCondition.denom,
        buyAmount: satisfiedBuyCondition.buy,
        pairContract: liquidity.pairContract,
      }),
    ),
    filter(({ isTaskActive }) => isTaskActive),
    tap(({ taskId }) => taskUpdater({ taskId, newStatus: 'blocked' })),
  );

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
          onError: (err) => {
            console.log(err);
            taskUpdater({ taskId: transactionInfo.taskId, newStatus: 'active' });
          },
        }),
      ),
    ),
    mergeMap(({ taskId, info }) =>
      of(info.txhash).pipe(
        mergeMap((txhash) => txInfoGetter(txhash)),
        retryAndContinue({
          retryCount: 7,
          delay: 1000,
          onError: (err) => {
            console.log(err);
            taskUpdater({ taskId, newStatus: 'active' });
          },
        }),
        map(
          (txInfo): NewTransactionResult => ({
            taskId,
            success: txInfo.code !== undefined,
            txhash: txInfo.txhash,
            height: txInfo.height,
          }),
        ),
      ),
    ),
    tap(({ taskId, success }) => taskUpdater({ taskId, newStatus: success ? 'closed' : 'active' })),
  );
