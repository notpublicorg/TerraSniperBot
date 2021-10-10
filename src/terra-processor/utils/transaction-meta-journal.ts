import { MetaJournalData } from '../types/terra-flow';
import { FiltrationResult } from '../types/transaction-filter';

export class TransactionMetaJournal {
  public taskId = '';
  public history: string[] = [];
  public execScript = '';

  public receivedTime = 0;
  public startHandlingTime = 0;
  public decodedTime = 0;
  public filtrationDoneTime = 0;
  public newTransactionPreparedDoneTime = 0;

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
  onFiltrationDone = ({ taskId }: FiltrationResult) => {
    this.taskId = taskId;
    this.filtrationDoneTime = Date.now();
  };
  onNewTransactionPrepared = () => {
    this.newTransactionPreparedDoneTime = Date.now();
  };

  onScriptExecutingStart = (execScript: string) => {
    this.execScript = execScript;
  };

  build = (): MetaJournalData => {
    return {
      taskId: this.taskId,
      history: this.history,
      execScript: this.execScript,
      elapsedBeforeStartHandlingSeconds: (this.startHandlingTime - this.receivedTime) / 1000,
      elapsedDecodingSeconds: (this.decodedTime - this.startHandlingTime) / 1000,
      elapsedFiltrationSeconds: (this.filtrationDoneTime - this.decodedTime) / 1000,
      elapsedPreparationSeconds:
        (this.newTransactionPreparedDoneTime - this.filtrationDoneTime) / 1000,
    };
  };
}
