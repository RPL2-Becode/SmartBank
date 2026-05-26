import { developerApplications, idempotencyRecords } from '../../data/mockData';
import { mockDelay } from './client';

export function getDeveloperApplications() {
  return mockDelay(developerApplications);
}

export function getIdempotencyRecords() {
  return mockDelay(idempotencyRecords);
}
