import { IdGenerator } from './id-generator';

export const generateIdFromDate: IdGenerator = () => `${Date.now()}-id`;
