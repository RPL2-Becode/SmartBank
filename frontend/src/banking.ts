import { balance as mockBalance, ledgerEntries as mockLedgerEntries, loans as mockLoans } from "./data";
import type {
  BackendLoan,
  BackendTransaction,
  BankBalanceView,
  BankLedgerRow,
  BalanceResponse,
  Loan,
  SourceApp,
} from "./types";
import { feeRules } from "./utils";

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function toIsoString(value?: string | null): string {
  if (!value) return new Date().toISOString();

  const normalized = new Date(value);
  if (Number.isNaN(normalized.getTime())) return new Date().toISOString();
  return normalized.toISOString();
}

function mapSourceFromTransaction(type: string): SourceApp {
  const normalized = type.toUpperCase();

  if (normalized.includes("MARKETPLACE")) return "marketplace";
  if (normalized.includes("POS")) return "pos";
  if (normalized.includes("SUPPLIER")) return "supplierhub";
  if (normalized.includes("LOGISTIC")) return "logistikita";
  if (normalized.includes("LOAN")) return "loan";
  return "manual_transfer";
}

function mapLedgerType(type: string): BankLedgerRow["type"] {
  const normalized = type.toUpperCase();

  if (normalized.includes("LOAN_REPAYMENT")) return "repayment";
  if (normalized.includes("LOAN")) return "loan";
  if (normalized.startsWith("PAYMENT")) return "payment";
  return "transfer";
}

function mapLoanStatus(loan: BackendLoan): Loan["status"] {
  if (loan.status === "PAID") return "paid";
  if (loan.status === "REJECTED") return "rejected";

  const dueDate = loan.dueDate ? new Date(loan.dueDate) : null;
  if (
    loan.status === "APPROVED" &&
    dueDate &&
    !Number.isNaN(dueDate.getTime()) &&
    dueDate.getTime() < Date.now() &&
    loan.installmentStatus !== "PAID"
  ) {
    return "overdue";
  }

  if (loan.status === "APPROVED") return "active";
  return "draft";
}

export function createMockBalanceView(): BankBalanceView {
  return {
    userId: mockBalance.userId,
    currentBalance: mockBalance.currentBalance,
    availableBalance: mockBalance.availableBalance,
    heldBalance: mockBalance.heldBalance,
    initialBalance: mockBalance.initialBalance,
    dailyTransactionCount: mockBalance.dailyTransactionCount,
    dailyTransactionLimit: mockBalance.dailyTransactionLimit,
    cooldownUntil: mockBalance.cooldownUntil ?? null,
    lastUpdatedAt: mockBalance.lastUpdatedAt,
    outstandingLoan: mockLoans
      .filter((loan) => loan.status === "active" || loan.status === "overdue")
      .reduce((sum, loan) => sum + loan.totalRepayment, 0),
  };
}

export function mapBalanceResponse(userId: string, response: BalanceResponse): BankBalanceView {
  const history = response.data.history ?? [];
  const lastUpdatedAt = history[0]?.created_at
    ? toIsoString(history[0].created_at)
    : new Date().toISOString();
  const cooldownUntil = history[0]?.created_at
    ? new Date(new Date(history[0].created_at).getTime() + 10_000).toISOString()
    : null;

  const currentBalance = toNumber(response.data.balance);

  return {
    userId,
    currentBalance,
    availableBalance: currentBalance,
    heldBalance: 0,
    initialBalance: feeRules.initialUserBalance,
    dailyTransactionCount: history.length,
    dailyTransactionLimit: feeRules.dailyLimit,
    cooldownUntil,
    lastUpdatedAt,
    outstandingLoan: toNumber(response.data.loan),
  };
}

export function mapBackendTransactions(
  transactions: BackendTransaction[],
  currentUserId?: string,
): BankLedgerRow[] {
  return transactions.map((transaction) => {
    const amount = toNumber(transaction.baseAmount);
    const fee = toNumber(transaction.fee);
    const tax = toNumber(transaction.tax);

    let direction: BankLedgerRow["direction"] = "system";
    if (currentUserId) {
      if (transaction.toUserId === currentUserId && transaction.fromUserId !== currentUserId) {
        direction = "incoming";
      } else if (
        transaction.fromUserId === currentUserId &&
        transaction.toUserId !== currentUserId
      ) {
        direction = "outgoing";
      }
    }

    return {
      id: transaction.refId,
      transactionId: transaction.refId,
      type: mapLedgerType(transaction.type),
      fromUserId: transaction.fromUserId,
      toUserId: transaction.toUserId,
      amount,
      fee,
      tax,
      total: amount + fee + tax,
      description: transaction.description ?? transaction.type,
      createdAt: toIsoString(transaction.created_at),
      direction,
      sourceApp: mapSourceFromTransaction(transaction.type),
    };
  });
}

export function createMockLedgerRows(userId?: string): BankLedgerRow[] {
  return mockLedgerEntries
    .filter((entry) => !userId || entry.accountId === userId)
    .map((entry) => ({
      id: entry.id,
      transactionId: entry.transactionId,
      type:
        entry.type === "loan"
          ? "loan"
          : entry.type === "repayment"
            ? "repayment"
            : entry.type === "fee" || entry.type === "tax"
              ? "payment"
              : "transfer",
      fromUserId: entry.type === "credit" ? "external" : entry.accountId,
      toUserId: entry.type === "credit" ? entry.accountId : "external",
      amount: entry.amount,
      fee: 0,
      tax: 0,
      total: entry.amount,
      description: entry.accountName ?? entry.type,
      createdAt: entry.createdAt,
      direction: entry.type === "credit" || entry.type === "loan" ? "incoming" : "outgoing",
      sourceApp: entry.sourceApp,
    }));
}

export function mapBackendLoans(loans: BackendLoan[]): Loan[] {
  return loans.map((loan) => {
    const principal = toNumber(loan.amount);
    const totalRepayment = toNumber(loan.totalDue);

    return {
      id: `LOAN-${loan.id}`,
      userId: loan.userId,
      principal,
      interestRate: toNumber(loan.interestRate),
      interestAmount: Math.max(totalRepayment - principal, 0),
      totalRepayment,
      status: mapLoanStatus(loan),
      createdAt: toIsoString(loan.createdAt),
      dueDate: loan.dueDate ? toIsoString(loan.dueDate) : undefined,
      installmentId: loan.installmentId ?? undefined,
      installmentStatus: loan.installmentStatus ?? undefined,
      amountDue: loan.amountDue == null ? undefined : toNumber(loan.amountDue),
      penaltyAmount: loan.penaltyAmount == null ? undefined : toNumber(loan.penaltyAmount),
      paidAt: loan.paidAt ?? null,
    };
  });
}

export function createMockLoans(userId?: string): Loan[] {
  return userId ? mockLoans.filter((loan) => loan.userId === userId) : mockLoans;
}
