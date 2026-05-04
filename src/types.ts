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
