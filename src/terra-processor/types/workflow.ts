import { BuyCondition } from './transaction-filter';

export type ParsedLiquidity = {
  pairContract: string;
  token: { amount: number; contract: string };
  currency: { amount: number; denom: string };
};

export type FiltrationResult = {
  taskId: string;
  satisfiedBuyCondition: BuyCondition;
  liquidity: ParsedLiquidity;
};

export type NewTransactionData = {
  taskId: string;
  isTaskActive: boolean;
  pairContract: string;
  buyAmount: number;
  buyDenom: string;
};

export type ValidatedAndEnrichedNewTransactionData = NewTransactionData & {
  timeoutHeight: number | undefined;
};

export type SendingInProgressTransaction = {
  taskId: string;
  hash: string;
};

export type SuccessfullySentTransaction = {
  taskId: string;
  success: boolean;
  txhash: string;
  height: number;
};

export type MetaJournalData = {
  pairContract?: string;
  liquidityToken?: ParsedLiquidity['token'];
  liquidityCurrency?: ParsedLiquidity['currency'];
  taskId: string;
  history: string[];
  execScript: string;
  elapsedBeforeStartHandlingSeconds: number;
  elapsedDecodingSeconds: number;
  elapsedFiltrationSeconds: number;
  elapsedPreparationSeconds: number;
  elapsedValidationAndEnrichingSeconds: number;
};

export type TerraFlowSuccessResult = {
  result: SuccessfullySentTransaction;
  metaJournal: MetaJournalData;
};
export type TerraFlowErrorResult = {
  error: unknown;
  metaJournal: MetaJournalData;
};
export type TerraFlowResult = TerraFlowSuccessResult | TerraFlowErrorResult;
