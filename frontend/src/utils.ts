import type { FeeBreakdown, SourceApp, User, UserRole } from "./types";

export const feeRules = {
  marketplace: 0.02,
  pos: 0.01,
  supplierhub: 0.03,
  logistikita: 0.05,
  manual_transfer: 0,
  loan: 0,
  bankFee: 0.01,
  gatewayFee: 0.005,
  tax: 0.02,
  logisticsFlat: 5000,
  loanInterest: 0.1,
  loanLimit: 100000,
  dailyLimit: 10,
  totalSupply: 1000000000,
  bankReserveMinimum: 0.98,
  initialUserBalance: 50000,
};

export function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function calculateFee(
  sourceApp: SourceApp,
  amount: number,
  logisticsMode: "percent" | "flat" = "percent",
): FeeBreakdown {
  const appRate = feeRules[sourceApp];
  const appFee =
    sourceApp === "logistikita" && logisticsMode === "flat"
      ? 0
      : amount * appRate;
  const logisticsFee =
    sourceApp === "logistikita" && logisticsMode === "flat"
      ? feeRules.logisticsFlat
      : 0;
  const gatewayFee = amount * feeRules.gatewayFee;
  const bankFee = amount * feeRules.bankFee;
  const tax = amount * feeRules.tax;
  const totalFee = appFee + gatewayFee + bankFee + tax + logisticsFee;

  return {
    principalAmount: amount,
    appFee,
    gatewayFee,
    bankFee,
    tax,
    logisticsFee,
    totalFee,
    totalDebit: amount + totalFee,
  };
}

export function calculateLoan(principal: number) {
  const interestAmount = principal * feeRules.loanInterest;

  return {
    principal,
    interestRate: feeRules.loanInterest,
    interestAmount,
    totalRepayment: principal + interestAmount,
  };
}

export function canAccess(role: UserRole, capability: string) {
  const permissions: Record<string, UserRole[]> = {
    balance: ["user", "admin"],
    transfer: ["user"],
    paymentRequests: ["admin", "developer"],
    ledger: ["user", "admin", "developer", "insight_readonly"],
    fees: ["admin", "developer"],
    integrations: ["admin", "developer"],
    docs: ["user", "admin", "developer", "insight_readonly"],
  };

  return permissions[capability]?.includes(role) ?? false;
}

// Token storage utilities
export function getStoredToken(): string | null {
  const raw = localStorage.getItem("smartbank-session");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed.token || null;
  } catch {
    return null;
  }
}

export function storeSession(token: string, user: User): void {
  localStorage.setItem("smartbank-session", JSON.stringify({ token, user }));
}

export function clearSession(): void {
  localStorage.removeItem("smartbank-session");
}
