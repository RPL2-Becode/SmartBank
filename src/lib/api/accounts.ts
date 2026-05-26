import { accounts, transactions } from '../../data/mockData';
import { mockDelay } from './client';

export function getMyBalance() {
  return mockDelay(accounts[0]);
}

export function getMyTransactions() {
  return mockDelay(transactions);
}
