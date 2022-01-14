import { IdGenerator } from './cache/id-generator';

export const generateIdFromDate: IdGenerator = () => `${Date.now()}-id-${Math.random()}`;
