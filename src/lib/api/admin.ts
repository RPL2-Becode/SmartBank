import { auditLogs, feeRules, reconciliationMismatches } from '../../data/mockData';
import { mockDelay } from './client';

export function getAuditLogs() {
  return mockDelay(auditLogs);
}

export function getFeeRules() {
  return mockDelay(feeRules);
}

export function getReconciliationMismatches() {
  return mockDelay(reconciliationMismatches);
}

export function getAdminDashboard() {
  return mockDelay({
    totalMoneySupply: 12450000,
    bankReserve: 4200000,
    circulatingBalance: 8070000,
    taxSink: 180000,
    dailyTransactionVolume: 118,
    failedPaymentRate: 2.4,
  });
}
