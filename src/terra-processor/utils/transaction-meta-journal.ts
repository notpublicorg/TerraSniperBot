import { FiltrationResult } from '../types/transaction-filter';

export class TransactionMetaJournal {
  public taskId = '';
  public history: string[] = [];

  public receivedTime = 0;
  public decodedTime = 0;
  public filtrationDoneTime = 0;
  public startSendingTime = 0;

  constructor(public source: 'block' | 'mempool') {
    this.history.push(`receivedDateTime - ${new Date().toLocaleString()}`);
    this.receivedTime = Date.now();
  }

  onDecodingDone = () => {
    this.decodedTime = Date.now();
  };

  onFiltrationDone = ({ taskId }: FiltrationResult) => {
    this.taskId = taskId;
    this.history.push(`filtrationDone - ${new Date().toLocaleString()}`);
    this.filtrationDoneTime = Date.now();
  };

  onStartTransactionSending = () => {
    this.history.push(`startSendingTransaction - ${new Date().toLocaleString()}`);
    this.startSendingTime = Date.now();
  };

  build = () => {
    return {
      taskId: this.taskId,
      history: this.history,
      elapsedDecodingSeconds: (this.decodedTime - this.receivedTime) / 1000,
      elapsedFiltrationSeconds: (this.filtrationDoneTime - this.decodedTime) / 1000,
      elapsedPreparationSeconds: (this.startSendingTime - this.filtrationDoneTime) / 1000,
    };
  };
}
