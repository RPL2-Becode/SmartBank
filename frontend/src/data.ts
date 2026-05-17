import type {
  IntegrationStatus,
  LedgerEntry,
  Loan,
  PaymentRequest,
  SourceApp,
  User,
} from "./types";
import { calculateFee, feeRules } from "./utils";

export const users: User[] = [
  {
    id: "user_001",
    name: "Ayu Lestari",
    email: "ayu@smartbank.local",
    role: "user",
    status: "active",
    createdAt: "2026-04-01T08:00:00.000Z",
  },
  {
    id: "seller_001",
    name: "Warung Sari",
    email: "sari@pasarkita.local",
    role: "user",
    status: "active",
    createdAt: "2026-04-02T09:00:00.000Z",
  },
  {
    id: "admin_001",
    name: "Raka Admin",
    email: "admin@smartbank.local",
    role: "admin",
    status: "active",
    createdAt: "2026-04-04T11:30:00.000Z",
  },
  {
    id: "dev_001",
    name: "Nadia Developer",
    email: "dev@smartbank.local",
    role: "developer",
    status: "active",
    createdAt: "2026-04-05T12:00:00.000Z",
  },
  {
    id: "insight_001",
    name: "UMKM Insight",
    email: "insight@smartbank.local",
    role: "insight_readonly",
    status: "active",
    createdAt: "2026-04-06T12:00:00.000Z",
  },
];

export const balance = {
  userId: "user_001",
  currentBalance: 8750000,
  availableBalance: 8420000,
  heldBalance: 330000,
  initialBalance: feeRules.initialUserBalance,
  dailyTransactionCount: 6,
  dailyTransactionLimit: feeRules.dailyLimit,
  cooldownUntil: "2026-05-04T05:42:10.000Z",
  lastUpdatedAt: "2026-05-04T05:39:20.000Z",
};

const paymentSeed: Array<{
  id: string;
  sourceApp: SourceApp;
  amount: number;
  status: PaymentRequest["status"];
  fromUserId: string;
  toUserId?: string;
  toService?: string;
  createdAt: string;
  processedAt?: string | null;
  failureReason?: string | null;
  metadata: Record<string, unknown>;
}> = [
  {
    id: "PAY-240501-MKT-001",
    sourceApp: "marketplace",
    amount: 185000,
    status: "success",
    fromUserId: "user_001",
    toUserId: "seller_001",
    createdAt: "2026-05-04T02:10:00.000Z",
    processedAt: "2026-05-04T02:10:08.000Z",
    metadata: { orderId: "PK-ORD-8821", gatewayTrace: "GW-9da7b2" },
  },
  {
    id: "PAY-240501-POS-014",
    sourceApp: "pos",
    amount: 72500,
    status: "success",
    fromUserId: "user_001",
    toUserId: "seller_001",
    createdAt: "2026-05-04T03:05:00.000Z",
    processedAt: "2026-05-04T03:05:05.000Z",
    metadata: { terminalId: "WPOS-KSR-04", cashier: "Intan" },
  },
  {
    id: "PAY-240501-SUP-039",
    sourceApp: "supplierhub",
    amount: 420000,
    status: "processing",
    fromUserId: "seller_001",
    toService: "SupplierHub",
    createdAt: "2026-05-04T04:14:00.000Z",
    processedAt: null,
    metadata: { purchaseOrder: "SUP-PO-1942", warehouse: "Gudang Timur" },
  },
  {
    id: "PAY-240501-LGT-051",
    sourceApp: "logistikita",
    amount: 51000,
    status: "validating",
    fromUserId: "seller_001",
    toService: "LogistiKita",
    createdAt: "2026-05-04T04:31:00.000Z",
    processedAt: null,
    metadata: { shipmentId: "LGT-SHP-7164", feeMode: "flat" },
  },
  {
    id: "PAY-240501-MKT-067",
    sourceApp: "marketplace",
    amount: 99000,
    status: "failed",
    fromUserId: "user_001",
    toUserId: "seller_001",
    createdAt: "2026-05-04T04:48:00.000Z",
    processedAt: "2026-05-04T04:48:03.000Z",
    failureReason: "COOLDOWN_ACTIVE",
    metadata: { orderId: "PK-ORD-8860", cooldownSeconds: 18 },
  },
  {
    id: "PAY-240501-MAN-090",
    sourceApp: "manual_transfer",
    amount: 250000,
    status: "pending",
    fromUserId: "user_001",
    toUserId: "seller_001",
    createdAt: "2026-05-04T05:01:00.000Z",
    processedAt: null,
    metadata: { note: "Transfer bahan baku" },
  },
];

export const paymentRequests: PaymentRequest[] = paymentSeed.map((request) => {
  const fee = calculateFee(
    request.sourceApp,
    request.amount,
    request.metadata.feeMode === "flat" ? "flat" : "percent",
  );

  return {
    ...request,
    feeTotal: fee.totalFee - fee.tax,
    taxTotal: fee.tax,
    totalDebit: fee.totalDebit,
  };
});

export const ledgerEntries: LedgerEntry[] = [
  {
    id: "LED-90001",
    transactionId: "TRX-33001",
    paymentRequestId: "PAY-240501-MKT-001",
    type: "debit",
    accountId: "user_001",
    accountName: "Ayu Lestari",
    amount: 195267,
    balanceBefore: 8940267,
    balanceAfter: 8745000,
    sourceApp: "marketplace",
    createdAt: "2026-05-04T02:10:08.000Z",
  },
  {
    id: "LED-90002",
    transactionId: "TRX-33001",
    paymentRequestId: "PAY-240501-MKT-001",
    type: "credit",
    accountId: "seller_001",
    accountName: "Warung Sari",
    amount: 185000,
    balanceBefore: 3210000,
    balanceAfter: 3395000,
    sourceApp: "marketplace",
    createdAt: "2026-05-04T02:10:08.000Z",
  },
  {
    id: "LED-90003",
    transactionId: "TRX-33001",
    paymentRequestId: "PAY-240501-MKT-001",
    type: "fee",
    accountId: "bank_reserve",
    accountName: "SmartBank Reserve",
    amount: 1850,
    balanceBefore: 980400000,
    balanceAfter: 980401850,
    sourceApp: "marketplace",
    createdAt: "2026-05-04T02:10:08.000Z",
  },
  {
    id: "LED-90004",
    transactionId: "TRX-33001",
    paymentRequestId: "PAY-240501-MKT-001",
    type: "tax",
    accountId: "system_tax",
    accountName: "Pajak Sistem",
    amount: 3700,
    balanceBefore: 14300000,
    balanceAfter: 14303700,
    sourceApp: "marketplace",
    createdAt: "2026-05-04T02:10:08.000Z",
  },
  {
    id: "LED-90005",
    transactionId: "TRX-33014",
    paymentRequestId: "PAY-240501-POS-014",
    type: "debit",
    accountId: "user_001",
    accountName: "Ayu Lestari",
    amount: 75137,
    balanceBefore: 8745000,
    balanceAfter: 8669863,
    sourceApp: "pos",
    createdAt: "2026-05-04T03:05:05.000Z",
  },
  {
    id: "LED-90006",
    transactionId: "TRX-33014",
    paymentRequestId: "PAY-240501-POS-014",
    type: "credit",
    accountId: "seller_001",
    accountName: "Warung Sari",
    amount: 72500,
    balanceBefore: 3395000,
    balanceAfter: 3467500,
    sourceApp: "pos",
    createdAt: "2026-05-04T03:05:05.000Z",
  },
  {
    id: "LED-90007",
    transactionId: "TRX-32990",
    paymentRequestId: "PAY-240430-LOAN-002",
    type: "loan",
    accountId: "user_001",
    accountName: "Ayu Lestari",
    amount: 80000,
    balanceBefore: 8589863,
    balanceAfter: 8669863,
    sourceApp: "loan",
    createdAt: "2026-04-30T08:22:00.000Z",
  },
  {
    id: "LED-90008",
    transactionId: "TRX-32970",
    paymentRequestId: "PAY-240429-STIM-001",
    type: "stimulus",
    accountId: "user_001",
    accountName: "Ayu Lestari",
    amount: 5000,
    balanceBefore: 8584863,
    balanceAfter: 8589863,
    sourceApp: "loan",
    createdAt: "2026-04-29T01:00:00.000Z",
  },
];

export const integrations: IntegrationStatus[] = [
  {
    service: "gateway",
    status: "online",
    lastRequestAt: "2026-05-04T05:10:00.000Z",
    errorRate: 0.2,
    averageLatencyMs: 84,
  },
  {
    service: "marketplace",
    status: "online",
    lastRequestAt: "2026-05-04T05:08:00.000Z",
    errorRate: 0.5,
    averageLatencyMs: 122,
  },
  {
    service: "pos",
    status: "online",
    lastRequestAt: "2026-05-04T05:07:00.000Z",
    errorRate: 0.3,
    averageLatencyMs: 96,
  },
  {
    service: "supplierhub",
    status: "warning",
    lastRequestAt: "2026-05-04T04:55:00.000Z",
    errorRate: 4.8,
    averageLatencyMs: 420,
  },
  {
    service: "logistikita",
    status: "online",
    lastRequestAt: "2026-05-04T04:58:00.000Z",
    errorRate: 1.1,
    averageLatencyMs: 188,
  },
  {
    service: "umkm_insight",
    status: "readonly",
    lastRequestAt: "2026-05-04T04:44:00.000Z",
    errorRate: 0,
    averageLatencyMs: 140,
  },
];

export const loans: Loan[] = [
  {
    id: "LOAN-001",
    userId: "user_001",
    principal: 80000,
    interestRate: 0.1,
    interestAmount: 8000,
    totalRepayment: 88000,
    status: "active",
    createdAt: "2026-04-30T08:22:00.000Z",
    dueDate: "2026-05-30T08:22:00.000Z",
  },
  {
    id: "LOAN-002",
    userId: "seller_001",
    principal: 100000,
    interestRate: 0.1,
    interestAmount: 10000,
    totalRepayment: 110000,
    status: "paid",
    createdAt: "2026-04-10T09:00:00.000Z",
    dueDate: "2026-05-10T09:00:00.000Z",
  },
];

export const moneySupplyTrend = [
  { day: "Sen", supply: 1000000000, reserve: 982500000, volume: 11800000 },
  { day: "Sel", supply: 1000000000, reserve: 981900000, volume: 15600000 },
  { day: "Rab", supply: 1000000000, reserve: 981200000, volume: 13200000 },
  { day: "Kam", supply: 1000000000, reserve: 980700000, volume: 18900000 },
  { day: "Jum", supply: 1000000000, reserve: 980400000, volume: 21300000 },
  { day: "Sab", supply: 1000000000, reserve: 980150000, volume: 17400000 },
  { day: "Min", supply: 1000000000, reserve: 980010000, volume: 19600000 },
];

export const sourceDistribution = [
  { name: "Marketplace", value: 42, color: "#12d6c5" },
  { name: "POS", value: 24, color: "#4f8cff" },
  { name: "SupplierHub", value: 18, color: "#f8c14a" },
  { name: "LogistiKita", value: 11, color: "#f472b6" },
  { name: "Transfer", value: 5, color: "#9ae66e" },
];

export const apiLogs = [
  {
    id: "LOG-8810",
    method: "POST",
    path: "/smartbank/pembayaran_transaksi",
    status: 200,
    source: "marketplace",
    latency: 96,
    time: "2026-05-04T05:10:00.000Z",
  },
  {
    id: "LOG-8809",
    method: "GET",
    path: "/smartbank/ledger_transaksi",
    status: 200,
    source: "umkm_insight",
    latency: 140,
    time: "2026-05-04T04:44:00.000Z",
  },
  {
    id: "LOG-8808",
    method: "POST",
    path: "/smartbank/pinjaman_(loan)/preview",
    status: 422,
    source: "gateway",
    latency: 86,
    time: "2026-05-04T04:29:00.000Z",
  },
  {
    id: "LOG-8807",
    method: "POST",
    path: "/smartbank/transfer_antar_user",
    status: 429,
    source: "gateway",
    latency: 52,
    time: "2026-05-04T04:20:00.000Z",
  },
  {
    id: "LOG-8806",
    method: "GET",
    path: "/smartbank/pajak_&_biaya/rules",
    status: 200,
    source: "developer",
    latency: 71,
    time: "2026-05-04T04:15:00.000Z",
  },
];

export const financialRules = [
  ["Total money supply", "1,000,000,000"],
  ["Saldo awal user", "50,000"],
  ["Bank reserve", ">= 98%"],
  ["Fee Marketplace", "2%"],
  ["Fee POS", "1%"],
  ["Fee Supplier", "3%"],
  ["Biaya Logistik", "5% atau flat 5,000"],
  ["Fee Bank", "1%"],
  ["Fee Gateway", "0.5%"],
  ["Pajak Sistem", "2%"],
  ["Bunga Pinjaman", "10%"],
  ["Limit Pinjaman", "100,000/user"],
  ["Cooldown", "10-30 detik"],
  ["Max Harian", "10 transaksi"],
];

export const apiReference = [
  {
    group: "Auth",
    endpoint: "/smartbank/registrasi_&_login_user/login",
    method: "POST",
    purpose: "Login user, admin, developer, dan insight read-only.",
  },
  {
    group: "Balance",
    endpoint: "/smartbank/manajemen_saldo/{userId}",
    method: "GET",
    purpose: "Query saldo, held balance, limit harian, dan cooldown.",
  },
  {
    group: "Transfer",
    endpoint: "/smartbank/transfer_antar_user/preview",
    method: "POST",
    purpose: "Preview fee dan total debit sebelum transfer.",
  },
  {
    group: "Payment",
    endpoint: "/smartbank/pembayaran_transaksi",
    method: "POST",
    purpose: "Menerima payment request dari Marketplace, POS, SupplierHub, dan LogistiKita.",
  },
  {
    group: "Ledger",
    endpoint: "/smartbank/ledger_transaksi",
    method: "GET",
    purpose: "Membaca ledger immutable sebagai single source of truth.",
  },
  {
    group: "Fee",
    endpoint: "/smartbank/pajak_&_biaya/simulate",
    method: "POST",
    purpose: "Simulasi app fee, gateway fee, bank fee, pajak, dan total debit.",
  },
];
