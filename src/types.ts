export type Role = 'nasabah' | 'admin' | 'teller' | 'manager';

export type BackendRole = 'NASABAH' | 'ADMIN' | 'TELLER' | 'MANAGER';

export type Status = 'SUCCESS' | 'PENDING' | 'PROCESSING' | 'FAILED' | 'CANCELED' | 'REVERSED';

export type LedgerDirection = 'DEBIT' | 'CREDIT';

export type SourceApp =
  | 'MARKETPLACE'
  | 'POS'
  | 'SUPPLIERHUB'
  | 'LOGISTIKITA'
  | 'UMKM_INSIGHT'
  | 'API_GATEWAY';

export type PaymentChannel =
  | 'MARKETPLACE_CHECKOUT'
  | 'POS_PAYMENT'
  | 'SUPPLIER_PAYMENT'
  | 'LOGISTICS_PAYMENT'
  | 'INSIGHT_SUBSCRIPTION'
  | 'P2P_TRANSFER'
  | 'SMARTQR';

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  accountCode: string;
};

export type Account = {
  code: string;
  ownerName: string;
  role: Role | 'SYSTEM';
  currency: 'SMART_COIN';
  balance: number;
  tokenizedAccount: string;
  status: 'ACTIVE' | 'FROZEN' | 'CLOSED';
  openedAt: string;
};

export type Transaction = {
  code: string;
  paymentCode?: string;
  accountCode: string;
  counterparty: string;
  direction: LedgerDirection;
  amount: number;
  fee: number;
  status: Status;
  channel: PaymentChannel;
  description: string;
  createdAt: string;
};

export type FeeBreakdown = {
  baseAmount: number;
  marketplaceFee: number;
  bankFee: number;
  gatewayFee: number;
  systemTax: number;
  totalDebit: number;
};

export type PaymentRequest = {
  paymentCode: string;
  sourceApp: SourceApp;
  channel: PaymentChannel;
  externalReference: string;
  debtorAccount: string;
  creditorAccount: string;
  amount: number;
  totalDebit: number;
  status: Status;
  idempotencyKey: string;
  requestId: string;
  clientId: string;
  signatureStatus: 'VALID' | 'INVALID' | 'SKIPPED';
  feeBreakdown: FeeBreakdown;
  createdAt: string;
};

export type LedgerEntry = {
  id: string;
  transactionCode: string;
  accountCode: string;
  direction: LedgerDirection;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  entryHash: string;
  previousHash: string;
  createdAt: string;
};

export type FeeRule = {
  id: string;
  channel: PaymentChannel;
  feeName: string;
  calculationType: 'PERCENTAGE' | 'FIXED';
  value: number;
  targetAccount: string;
  active: boolean;
  updatedAt: string;
};

export type WebhookDelivery = {
  eventId: string;
  eventType: string;
  targetApplication: SourceApp;
  paymentCode: string;
  status: Status;
  attempts: number;
  lastError: string;
  nextRetryAt: string;
  signatureStatus: 'VALID' | 'INVALID' | 'PENDING';
};

export type AuditLog = {
  requestId: string;
  clientId: string;
  user: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  responseStatus: number;
  ipAddress: string;
  createdAt: string;
};

export type Loan = {
  loanCode: string;
  borrowerAccount: string;
  principal: number;
  interestRate: number;
  totalDue: number;
  status: Status;
  dueDate: string;
};

export type Mandate = {
  mandateCode: string;
  application: SourceApp;
  amount: number;
  frequency: 'WEEKLY' | 'MONTHLY';
  nextChargeDate: string;
  status: Status;
};

export type DeveloperApplication = {
  appName: string;
  clientId: string;
  maskedSecret: string;
  allowedChannels: PaymentChannel[];
  webhookUrl: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DRAFT';
  createdAt: string;
};

export type IdempotencyRecord = {
  clientId: string;
  idempotencyKey: string;
  requestHash: string;
  status: Status | 'CONFLICT';
  createdAt: string;
  updatedAt: string;
};

export type TimelineEvent = {
  title: string;
  description: string;
  status: Status;
  timestamp: string;
};
