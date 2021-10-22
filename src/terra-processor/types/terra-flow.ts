import { NewTransactionResult } from './new-transaction-info';

export type MetaJournalData = {
  encodedTx: string;
  taskId: string;
  history: string[];
  execScript: string;
  elapsedBeforeStartHandlingSeconds: number;
  elapsedDecodingSeconds: number;
  elapsedFiltrationSeconds: number;
  elapsedPreparationSeconds: number;
  elapsedBlockFetcingSeconds: number;
};

export type TerraFlowSuccessResult = {
  result?: NewTransactionResult;
  metaJournal: MetaJournalData;
};
export type TerraFlowErrorResult = {
  error: unknown;
  metaJournal: MetaJournalData;
};
export type TerraFlowResult = TerraFlowSuccessResult | TerraFlowErrorResult;
