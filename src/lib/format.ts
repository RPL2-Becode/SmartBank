import type { Status } from '../types';

export function formatMoney(value: number): string {
  return `SMART_COIN ${new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(value)}`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(value);
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(value));
}

export function maskMiddle(value: string, visibleStart = 6, visibleEnd = 4): string {
  if (value.length <= visibleStart + visibleEnd) return value;
  return `${value.slice(0, visibleStart)}...${value.slice(-visibleEnd)}`;
}

export function statusLabel(status: Status | 'CONFLICT'): string {
  const labels: Record<Status | 'CONFLICT', string> = {
    SUCCESS: 'Success',
    PENDING: 'Pending',
    PROCESSING: 'Processing',
    FAILED: 'Failed',
    CANCELED: 'Canceled',
    REVERSED: 'Reversed',
    CONFLICT: 'Conflict',
  };

  return labels[status];
}
