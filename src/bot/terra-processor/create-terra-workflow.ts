import { Coin, LCDClient, StdFee } from '@terra-money/terra.js';
import {
  catchError,
  concatMap,
  filter,
  map,
  mergeMap,
  Observable,
  of,
  repeat,
  take,
  tap,
} from 'rxjs';

import { SniperTask } from '../core/sniper-task';
import { TasksProcessorUpdater } from '../core/tasks-processor';
import { createMempoolSource } from './data-sources/mempool-source';
import { TendermintAPILocal } from './external/tendermintAPI';
import { isLiquidityValid } from './external/validate-liquidity';
import { filterLiquidity } from './filter-liquidity';
import { getTimeoutHeight } from './get-timeout-height';
import {
  createTransactionCheckerSource,
  createTransactionSenderSource,
  TxInfoGetter,
} from './new-transaction-workflow';
import { tryGetLiquidityMsgs } from './parse-liquidity';
import { TerraTasksProcessorConfig } from './processor-config';
import { swapTransactionWithScript } from './swap-transaction-with-script';
import { TransactionMetaJournal } from './transaction-meta-journal';
import { TransactionFilter } from './types/transaction-filter';
import {
  NewTransactionData,
  TerraFlowErrorResult,
  TerraFlowSuccessResult,
  ValidatedAndEnrichedNewTransactionData,
} from './types/workflow';
import { decodeTransaction } from './utils/decoders';
import { retryAction } from './utils/retry-and-continue';

export type TerraWorflowFactoryDeps = {
  getFiltersSource: () => Observable<TransactionFilter>;
  getTasks: () => SniperTask[];
  updateTask: TasksProcessorUpdater;
};

export function createTerraWorkflow(
  {
    lcdUrl,
    lcdChainId,
    walletAlias,
    walletPassword,
    tendermintApiUrl,
    mempool,
    validBlockHeightOffset,
    requestBlockHeigthRetryCount,
    closeTaskAfterPurchase,
    maxEncodedTransactionTextLength,
    liquidityCheckActivated,
  }: TerraTasksProcessorConfig,
  deps: TerraWorflowFactoryDeps,
) {
  const terra = new LCDClient({
    URL: lcdUrl,
    chainID: lcdChainId,
  });
  const tendermintApi = new TendermintAPILocal(tendermintApiUrl);

  const getTx: TxInfoGetter = (txHash) => terra.tx.txInfo(txHash);
  const sendTransaction = swapTransactionWithScript({
    fee: new StdFee(mempool.defaultGas, [new Coin(mempool.defaultFeeDenom, mempool.defaultFee)]),
    chainId: lcdChainId,
    walletAlias,
    walletPassword,
  });

  const $mempoolSource = createMempoolSource({
    tendermintApi,
  }).pipe(
    filter(({ tx }) => tx.length <= maxEncodedTransactionTextLength),
    concatMap(({ tx, metaJournal }) =>
      of(tx)
        .pipe(
          tap(metaJournal.onStartHandling),
          map((tx) => decodeTransaction(tx)),
          filter(Boolean),
          tap(metaJournal.onDecodingDone),
          map((tx) => tx.toData().value),
          tryGetLiquidityMsgs,
          mergeMap((l) => deps.getFiltersSource().pipe(filterLiquidity(l))),
          tap(metaJournal.onFiltrationDone),
        )
        .pipe(
          map(
            ({
              taskId,
              satisfiedBuyCondition,
              liquidity,
            }): { info: NewTransactionData; metaJournal: TransactionMetaJournal } => {
              const currentTask = deps.getTasks().find((t) => t.id === taskId);

              return {
                info: {
                  taskId,
                  isTaskActive: currentTask?.status === 'active',
                  maxSpread: currentTask?.maxSpread || '1',
                  buyDenom: satisfiedBuyCondition.denom,
                  buyAmount: satisfiedBuyCondition.buy,
                  pairContract: liquidity.pairContract,
                },
                metaJournal,
              };
            },
          ),
          filter(({ info: { isTaskActive } }) => isTaskActive),
          tap(({ info: { taskId } }) => deps.updateTask({ taskId, newStatus: 'blocked' })),
          tap(metaJournal.onNewTransactionPrepared),
        ),
    ),
    take(1),
    mergeMap(({ info, metaJournal }) =>
      of(info).pipe(
        tap(metaJournal.onNewTransactionValidationAndEnrichingStart),
        mergeMap(
          validateAndEnrichNewTransaction({
            tendermintApi,
            validBlockHeightOffset,
            requestBlockHeigthRetryCount,
            walletPassword,
            liquidityCheckActivated,
          }),
        ),
        filter(Boolean),
        mergeMap(createTransactionSenderSource(sendTransaction(metaJournal))),
        tap((v) => console.log('Send transaction result', v)),
        mergeMap(createTransactionCheckerSource(getTx)),
        tap(({ taskId, success }) =>
          deps.updateTask({
            taskId,
            newStatus: success && closeTaskAfterPurchase ? 'closed' : 'active',
          }),
        ),
        map((result): TerraFlowSuccessResult => ({ result, metaJournal: metaJournal.build() })),
        catchError((error): Observable<TerraFlowErrorResult> => {
          deps.updateTask({ taskId: info.taskId, newStatus: 'active' });
          return of({ error, metaJournal: metaJournal.build() });
        }),
      ),
    ),
    repeat(),
  );

  return $mempoolSource;
}

function validateAndEnrichNewTransaction({
  tendermintApi,
  validBlockHeightOffset,
  requestBlockHeigthRetryCount,
  walletPassword,
  liquidityCheckActivated,
}: {
  tendermintApi: TendermintAPILocal;
  validBlockHeightOffset: number | false;
  requestBlockHeigthRetryCount: number;
  walletPassword: string;
  liquidityCheckActivated: boolean;
}) {
  return async (
    data: NewTransactionData,
  ): Promise<ValidatedAndEnrichedNewTransactionData | null> => {
    try {
      const [timeoutHeight] = await Promise.all([
        retryAction(
          getTimeoutHeight(tendermintApi, {
            validBlockHeightOffset,
          }),
          {
            retryCount: requestBlockHeigthRetryCount,
            errorLogger: console.log,
          },
        ),
        liquidityCheckActivated
          ? isLiquidityValid(walletPassword, data.pairContract).then((isValid) => {
              if (!isValid) throw new Error('Liquidity check failed!');
            })
          : null,
      ]);

      return { ...data, timeoutHeight };
    } catch (e) {
      return null;
    }
  };
}
