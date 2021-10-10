import { NewTransactionResult } from './new-transaction-info';

export type MetaJournalData = {
  taskId: string;
  history: string[];
  execScript: string;
  elapsedBeforeStartHandlingSeconds: number;
  elapsedDecodingSeconds: number;
  elapsedFiltrationSeconds: number;
  elapsedPreparationSeconds: number;
};

export type TerraFlowSuccessResult = {
  result: NewTransactionResult;
  metaJournal: MetaJournalData;
};
export type TerraFlowErrorResult = {
  error: unknown;
  metaJournal: MetaJournalData;
};
export type TerraFlowResult = TerraFlowSuccessResult | TerraFlowErrorResult;

export type NewBlockInfo = {
  currentBlockHeight: string;
};
