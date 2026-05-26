import { webhookDeliveries } from '../../data/mockData';
import { mockDelay } from './client';

export function getWebhookDeliveries() {
  return mockDelay(webhookDeliveries);
}
