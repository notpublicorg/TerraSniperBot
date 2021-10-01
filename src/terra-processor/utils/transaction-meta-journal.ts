import { FiltrationResult } from '../types/transaction-filter';

export class TransactionMetaJournal {
  public taskId = '';
  public history: string[] = [];

  constructor(public source: 'block' | 'mempool') {
    this.history.push(`receivedDateTime - ${new Date().toLocaleString()}`);
  }

  onFiltrationDone({ taskId }: FiltrationResult) {
    this.taskId = taskId;
    this.history.push(`filtrationDone - ${new Date().toLocaleString()}`);
  }

  onStartTransactionSending() {
    this.history.push(`startSendingTransaction - ${new Date().toLocaleString()}`);
  }
}
