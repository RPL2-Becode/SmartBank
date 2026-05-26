import { ledgerEntries } from '../../data/mockData';
import { mockDelay } from './client';

export function getLedgerEntries() {
  return mockDelay(ledgerEntries);
}
