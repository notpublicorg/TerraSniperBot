import { MetaJournalData } from '../types/terra-flow';
import { FiltrationResult, ParsedLiquidity } from '../types/transaction-filter';

export class TransactionMetaJournal {
  public taskId = '';
  public liquidity: ParsedLiquidity | null = null;
  public history: string[] = [];
  public execScript = '';

  public receivedTime = 0;
  public startHandlingTime = 0;
  public decodedTime = 0;
  public filtrationDoneTime = 0;
  public newTransactionPreparedDoneTime = 0;
  public newTransactionBlockInfoFetchingStartTime = 0;
  public newTransactionScriptExecutionStartTime = 0;

  constructor(public source: 'block' | 'mempool') {
    this.history.push(`receivedDateTime - ${new Date().toLocaleString()}`);
    this.receivedTime = Date.now();
  }

  onStartHandling = () => {
    this.startHandlingTime = Date.now();
  };
  onDecodingDone = () => {
    this.decodedTime = Date.now();
  };
  onFiltrationDone = ({ taskId, liquidity }: FiltrationResult) => {
    this.taskId = taskId;
    this.liquidity = liquidity;
    this.filtrationDoneTime = Date.now();
  };
  onNewTransactionPrepared = () => {
    this.newTransactionPreparedDoneTime = Date.now();
  };
  onBlockInfoFetchingStart = () => {
    this.newTransactionBlockInfoFetchingStartTime = Date.now();
  };
  onScriptExecutingStart = (execScript: string) => {
    this.newTransactionScriptExecutionStartTime = Date.now();
    this.execScript = execScript;
  };

  build = (): MetaJournalData => {
    return {
      taskId: this.taskId,
      liquidity: this.liquidity,
      history: this.history,
      execScript: this.execScript,
      elapsedBeforeStartHandlingSeconds: (this.startHandlingTime - this.receivedTime) / 1000,
      elapsedDecodingSeconds: (this.decodedTime - this.startHandlingTime) / 1000,
      elapsedFiltrationSeconds: (this.filtrationDoneTime - this.decodedTime) / 1000,
      elapsedPreparationSeconds:
        (this.newTransactionPreparedDoneTime - this.filtrationDoneTime) / 1000,
      elapsedBlockFetcingSeconds:
        (this.newTransactionScriptExecutionStartTime -
          this.newTransactionBlockInfoFetchingStartTime) /
        1000,
    };
  };
}
