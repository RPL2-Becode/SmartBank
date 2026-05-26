import { payments } from '../../data/mockData';
import type { PaymentRequest } from '../../types';
import { mockDelay } from './client';

export function getPayments() {
  return mockDelay(payments);
}

export function getPaymentByCode(paymentCode: string) {
  return mockDelay(payments.find((payment) => payment.paymentCode === paymentCode) ?? payments[0]);
}

export function createPayment(input: Partial<PaymentRequest>) {
  return mockDelay({
    ...payments[0],
    ...input,
    paymentCode: 'PAY-20260504-000010',
    status: 'PROCESSING' as const,
  });
}
