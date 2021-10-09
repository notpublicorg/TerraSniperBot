import { NewTransactionResult } from './new-transaction-info';

export type MetaJournalData = {
  taskId: string;
  history: string[];
  elapsedBeforeStartHandlingSeconds: number;
  elapsedDecodingSeconds: number;
  elapsedFiltrationSeconds: number;
  elapsedPreparationSeconds: number;
  elapsedCreatingAndSigningSeconds: number;
  elapsedEncodingSeconds: number;
};

export type TerraFlowSuccessResult = {
  result?: NewTransactionResult;
  stdout?: string;
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
