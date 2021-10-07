import { FiltrationResult } from '../types/transaction-filter';

export type MetaJournalData = {
  taskId: string;
  history: string[];
  elapsedStatusReceivingSeconds: number;
  elapsedDecodingSeconds: number;
  elapsedFiltrationSeconds: number;
  elapsedPreparationSeconds: number;
  elapsedCreatingAndSigningSeconds: number;
  elapsedEncodingSeconds: number;
};

export class TransactionMetaJournal {
  public taskId = '';
  public history: string[] = [];
  public currentBlockHeight = '';

  public receivedTime = 0;
  public statusRecivedTime = 0;
  public decodedTime = 0;
  public filtrationDoneTime = 0;
  public newTransactionPreparedDoneTime = 0;
  public newTransactionSignedTime = 0;
  public newTransactionEncodedTime = 0;

  constructor(public source: 'block' | 'mempool') {
    this.history.push(`receivedDateTime - ${new Date().toLocaleString()}`);
    this.receivedTime = Date.now();
  }

  onStatusReceived = (currentBlockHeight: string) => {
    this.currentBlockHeight = currentBlockHeight;
    this.statusRecivedTime = Date.now();
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
  onNewTransactionSigned = () => {
    this.newTransactionSignedTime = Date.now();
  };
  onNewTransactionEncoded = () => {
    this.newTransactionEncodedTime = Date.now();
  };

  build = (): MetaJournalData => {
    return {
      taskId: this.taskId,
      history: this.history,
      elapsedStatusReceivingSeconds: (this.statusRecivedTime - this.receivedTime) / 1000,
      elapsedDecodingSeconds: (this.decodedTime - this.statusRecivedTime) / 1000,
      elapsedFiltrationSeconds: (this.filtrationDoneTime - this.decodedTime) / 1000,
      elapsedPreparationSeconds:
        (this.newTransactionPreparedDoneTime - this.filtrationDoneTime) / 1000,
      elapsedCreatingAndSigningSeconds:
        (this.newTransactionSignedTime - this.newTransactionPreparedDoneTime) / 1000,
      elapsedEncodingSeconds:
        (this.newTransactionEncodedTime - this.newTransactionSignedTime) / 1000,
    };
  };
}
