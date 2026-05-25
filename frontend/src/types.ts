export type UserRole = "user" | "admin" | "developer" | "insight_readonly";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "blocked";
  createdAt: string;
};

export type SourceApp =
  | "marketplace"
  | "pos"
  | "supplierhub"
  | "logistikita"
  | "manual_transfer"
  | "loan";

export type PaymentRequestStatus =
  | "pending"
  | "validating"
  | "processing"
  | "success"
  | "failed";

export type PaymentRequest = {
  id: string;
  sourceApp: SourceApp;
  fromUserId: string;
  toUserId?: string;
  toService?: string;
  amount: number;
  feeTotal: number;
  taxTotal: number;
  totalDebit: number;
  status: PaymentRequestStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
  processedAt?: string | null;
  failureReason?: string | null;
};

export type LedgerEntryType =
  | "debit"
  | "credit"
  | "fee"
  | "tax"
  | "loan"
  | "repayment"
  | "stimulus";

export type LedgerEntry = {
  id: string;
  transactionId: string;
  paymentRequestId?: string;
  type: LedgerEntryType;
  accountId: string;
  accountName?: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  sourceApp: SourceApp;
  createdAt: string;
};

export type IntegrationStatus = {
  service:
    | "gateway"
    | "marketplace"
    | "pos"
    | "supplierhub"
    | "logistikita"
    | "umkm_insight";
  status: "online" | "warning" | "offline" | "readonly";
  lastRequestAt?: string;
  errorRate: number;
  averageLatencyMs: number;
};

export type Loan = {
  id: string;
  userId: string;
  principal: number;
  interestRate: number;
  interestAmount: number;
  totalRepayment: number;
  status: "draft" | "active" | "paid" | "overdue" | "rejected";
  createdAt: string;
  dueDate?: string;
};

export type FeeBreakdown = {
  principalAmount: number;
  appFee: number;
  gatewayFee: number;
  bankFee: number;
  tax: number;
  logisticsFee: number;
  totalFee: number;
  totalDebit: number;
};

export type LoginResponse = {
  token: string;
  user: User;
};

export type RegisterResponse = {
  token: string;
  user: User;
};

export type BackendLoan = {
  id: number | string;
  userId: string;
  amount: number | string;
  interestRate: number | string;
  totalDue: number | string;
  status: "PENDING" | "APPROVED" | "PAID" | "REJECTED";
  createdAt: string;
  dueDate?: string | null;
  installmentId?: number | null;
  installmentStatus?: string | null;
  amountDue?: number | string | null;
  penaltyAmount?: number | string | null;
  paidAt?: string | null;
};

export type BackendTransaction = {
  id: number;
  refId: string;
  type: string;
  fromUserId: string;
  toUserId: string;
  baseAmount: number | string;
  tax: number | string;
  fee: number | string;
  description?: string | null;
  created_at: string;
};

export type BankBalanceView = {
  userId: string;
  currentBalance: number;
  availableBalance: number;
  heldBalance: number;
  initialBalance: number;
  dailyTransactionCount: number;
  dailyTransactionLimit: number;
  cooldownUntil: string | null;
  lastUpdatedAt: string;
  outstandingLoan: number;
};

export type BankLedgerRow = {
  id: string;
  transactionId: string;
  type: "transfer" | "payment" | "loan" | "repayment";
  fromUserId: string;
  toUserId: string;
  amount: number;
  fee: number;
  tax: number;
  total: number;
  description: string;
  createdAt: string;
  direction: "incoming" | "outgoing" | "system";
  sourceApp: SourceApp;
};

export type BalanceResponse = {
  status: string;
  data: {
    balance: number | string;
    loan: number | string;
    history?: BackendTransaction[];
  };
};

