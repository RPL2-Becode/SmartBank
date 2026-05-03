import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  Banknote,
  BarChart3,
  BellRing,
  BookOpen,
  Boxes,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  CreditCard,
  FileCode2,
  FileText,
  Gauge,
  History,
  Home,
  KeyRound,
  Landmark,
  LineChart,
  Lock,
  LogIn,
  LogOut,
  Menu,
  PackageCheck,
  QrCode,
  ReceiptText,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  WalletCards,
  Webhook,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

type Role = 'USER' | 'MERCHANT' | 'SUPPLIER' | 'ADMIN' | 'DEVELOPER' | 'ANALYTICS';
type TxStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'CANCELED' | 'REVERSED';
type LedgerDirection = 'DEBIT' | 'CREDIT';

type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  accountCode: string;
};

type Account = {
  code: string;
  owner: string;
  role: Role | 'SYSTEM';
  balance: number;
  token: string;
  status: 'ACTIVE' | 'FROZEN';
};

type Transaction = {
  code: string;
  paymentCode?: string;
  from: string;
  to: string;
  amount: number;
  fee: number;
  tax: number;
  status: TxStatus;
  channel: string;
  description: string;
  createdAt: string;
};

type LedgerEntry = {
  id: string;
  transactionCode: string;
  accountCode: string;
  direction: LedgerDirection;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  hash: string;
  previousHash: string;
  createdAt: string;
};

type Payment = {
  code: string;
  sourceApp: string;
  channel: string;
  debtor: string;
  creditor: string;
  baseAmount: number;
  marketplaceFee: number;
  bankFee: number;
  gatewayFee: number;
  tax: number;
  totalDebit: number;
  status: TxStatus;
  idempotencyKey: string;
  createdAt: string;
};

type FeeRule = {
  id: string;
  name: string;
  channel: string;
  percent: number;
  fixed: number;
  destination: string;
  status: 'ACTIVE' | 'DRAFT';
};

type WebhookDelivery = {
  id: string;
  app: string;
  event: string;
  status: 'DELIVERED' | 'FAILED' | 'RETRYING';
  attempts: number;
  nextRetry: string;
};

const roleLabels: Record<Role, string> = {
  USER: 'User / Mahasiswa',
  MERCHANT: 'Merchant / UMKM',
  SUPPLIER: 'Supplier',
  ADMIN: 'Admin SmartBank',
  DEVELOPER: 'Developer / Integrator',
  ANALYTICS: 'Analytics Viewer',
};

const demoUsers: User[] = [
  { id: 'u-001', name: 'Raka Pratama', email: 'raka@smartbank.test', role: 'USER', accountCode: 'ACC-USER-001' },
  { id: 'm-001', name: 'PasarKita Store', email: 'merchant@smartbank.test', role: 'MERCHANT', accountCode: 'ACC-MERCHANT-001' },
  { id: 's-001', name: 'SupplierHub Utama', email: 'supplier@smartbank.test', role: 'SUPPLIER', accountCode: 'ACC-SUPPLIER-001' },
  { id: 'a-001', name: 'Nadia Admin', email: 'admin@smartbank.test', role: 'ADMIN', accountCode: 'ACC-RESERVE' },
  { id: 'd-001', name: 'Dev Integrator', email: 'dev@smartbank.test', role: 'DEVELOPER', accountCode: 'ACC-DEVELOPER-001' },
  { id: 'an-001', name: 'UMKM Insight', email: 'insight@smartbank.test', role: 'ANALYTICS', accountCode: 'ACC-ANALYTICS-001' },
];

const now = new Date('2026-05-03T13:30:00+07:00');
const iso = (minutesAgo: number) => new Date(now.getTime() - minutesAgo * 60_000).toISOString();

const initialAccounts: Account[] = [
  { code: 'ACC-USER-001', owner: 'Raka Pratama', role: 'USER', balance: 150000, token: 'tok_usr_7A91****', status: 'ACTIVE' },
  { code: 'ACC-MERCHANT-001', owner: 'PasarKita Store', role: 'MERCHANT', balance: 457500, token: 'tok_mch_44B0****', status: 'ACTIVE' },
  { code: 'ACC-SUPPLIER-001', owner: 'SupplierHub Utama', role: 'SUPPLIER', balance: 610000, token: 'tok_sup_19F2****', status: 'ACTIVE' },
  { code: 'ACC-ANALYTICS-001', owner: 'UMKM Insight', role: 'ANALYTICS', balance: 0, token: 'tok_ro_0031****', status: 'ACTIVE' },
  { code: 'ACC-RESERVE', owner: 'Bank Reserve', role: 'SYSTEM', balance: 980000000, token: 'system_reserve', status: 'ACTIVE' },
  { code: 'ACC-FEE', owner: 'Fee Collector', role: 'SYSTEM', balance: 2250000, token: 'system_fee', status: 'ACTIVE' },
  { code: 'ACC-TAX', owner: 'Tax Sink', role: 'SYSTEM', balance: 2000000, token: 'system_tax', status: 'ACTIVE' },
];

const initialTransactions: Transaction[] = [
  {
    code: 'TRX-20260503-0004',
    paymentCode: 'PAY-20260503-0004',
    from: 'ACC-USER-001',
    to: 'ACC-MERCHANT-001',
    amount: 75000,
    fee: 2625,
    tax: 1500,
    status: 'SUCCESS',
    channel: 'SMARTQR_DYNAMIC',
    description: 'Pembayaran SmartQR PasarKita',
    createdAt: iso(35),
  },
  {
    code: 'TRX-20260503-0003',
    paymentCode: 'PAY-20260503-0003',
    from: 'ACC-USER-001',
    to: 'ACC-SUPPLIER-001',
    amount: 100000,
    fee: 3500,
    tax: 2000,
    status: 'PROCESSING',
    channel: 'MARKETPLACE_CHECKOUT',
    description: 'Checkout bahan baku SupplierHub',
    createdAt: iso(54),
  },
  {
    code: 'TRX-20260503-0002',
    from: 'ACC-MERCHANT-001',
    to: 'ACC-SUPPLIER-001',
    amount: 250000,
    fee: 2500,
    tax: 0,
    status: 'SUCCESS',
    channel: 'INTERNAL_TRANSFER',
    description: 'Pembayaran invoice bahan',
    createdAt: iso(160),
  },
  {
    code: 'TRX-20260503-0001',
    from: 'ACC-USER-001',
    to: 'ACC-MERCHANT-001',
    amount: 45000,
    fee: 1575,
    tax: 900,
    status: 'FAILED',
    channel: 'POS_CHECKOUT',
    description: 'Saldo tidak cukup saat POS checkout',
    createdAt: iso(220),
  },
];

const initialLedger: LedgerEntry[] = [
  {
    id: 'LED-001',
    transactionCode: 'TRX-20260503-0004',
    accountCode: 'ACC-USER-001',
    direction: 'DEBIT',
    amount: 79125,
    balanceBefore: 229125,
    balanceAfter: 150000,
    description: 'Debit user + fee + pajak',
    hash: 'hsh_99A01E',
    previousHash: 'hsh_81AA10',
    createdAt: iso(35),
  },
  {
    id: 'LED-002',
    transactionCode: 'TRX-20260503-0004',
    accountCode: 'ACC-MERCHANT-001',
    direction: 'CREDIT',
    amount: 75000,
    balanceBefore: 382500,
    balanceAfter: 457500,
    description: 'Credit merchant',
    hash: 'hsh_99A01F',
    previousHash: 'hsh_99A01E',
    createdAt: iso(35),
  },
  {
    id: 'LED-003',
    transactionCode: 'TRX-20260503-0004',
    accountCode: 'ACC-FEE',
    direction: 'CREDIT',
    amount: 2625,
    balanceBefore: 2247375,
    balanceAfter: 2250000,
    description: 'Fee gateway dan bank',
    hash: 'hsh_99A020',
    previousHash: 'hsh_99A01F',
    createdAt: iso(35),
  },
  {
    id: 'LED-004',
    transactionCode: 'TRX-20260503-0004',
    accountCode: 'ACC-TAX',
    direction: 'CREDIT',
    amount: 1500,
    balanceBefore: 1998500,
    balanceAfter: 2000000,
    description: 'Pajak transaksi',
    hash: 'hsh_99A021',
    previousHash: 'hsh_99A020',
    createdAt: iso(35),
  },
];

const initialPayments: Payment[] = [
  {
    code: 'PAY-20260503-0004',
    sourceApp: 'PASARKITA',
    channel: 'SMARTQR_DYNAMIC',
    debtor: 'ACC-USER-001',
    creditor: 'ACC-MERCHANT-001',
    baseAmount: 75000,
    marketplaceFee: 1500,
    bankFee: 750,
    gatewayFee: 375,
    tax: 1500,
    totalDebit: 79125,
    status: 'SUCCESS',
    idempotencyKey: 'idem_20260503_qr_0004',
    createdAt: iso(35),
  },
  {
    code: 'PAY-20260503-0003',
    sourceApp: 'MARKETPLACE',
    channel: 'MARKETPLACE_CHECKOUT',
    debtor: 'ACC-USER-001',
    creditor: 'ACC-SUPPLIER-001',
    baseAmount: 100000,
    marketplaceFee: 2000,
    bankFee: 1000,
    gatewayFee: 500,
    tax: 2000,
    totalDebit: 105500,
    status: 'PROCESSING',
    idempotencyKey: 'idem_20260503_market_0003',
    createdAt: iso(54),
  },
];

const initialFeeRules: FeeRule[] = [
  { id: 'FEE-MKT', name: 'Marketplace Fee', channel: 'MARKETPLACE_CHECKOUT', percent: 2, fixed: 0, destination: 'ACC-FEE', status: 'ACTIVE' },
  { id: 'FEE-BANK', name: 'Bank Internal Fee', channel: 'ALL_PAYMENT', percent: 1, fixed: 0, destination: 'ACC-FEE', status: 'ACTIVE' },
  { id: 'FEE-GTW', name: 'Gateway Fee', channel: 'API_GATEWAY', percent: 0.5, fixed: 0, destination: 'ACC-FEE', status: 'ACTIVE' },
  { id: 'FEE-TAX', name: 'Pajak Transaksi', channel: 'TAXABLE_PAYMENT', percent: 2, fixed: 0, destination: 'ACC-TAX', status: 'ACTIVE' },
];

const initialWebhooks: WebhookDelivery[] = [
  { id: 'EVT-20260503-0001', app: 'PASARKITA', event: 'PAYMENT_SUCCESS', status: 'DELIVERED', attempts: 1, nextRetry: '-' },
  { id: 'EVT-20260503-0002', app: 'SUPPLIERHUB', event: 'PAYMENT_PROCESSING', status: 'RETRYING', attempts: 2, nextRetry: '2026-05-03 14:10' },
  { id: 'EVT-20260503-0003', app: 'WARUNGPOS', event: 'PAYMENT_FAILED', status: 'FAILED', attempts: 3, nextRetry: 'Manual retry' },
];

const swaggerUrl = import.meta.env.VITE_SWAGGER_URL || 'http://localhost:3000/api-docs';
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

function formatMoney(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace('Rp', 'SC');
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value));
}

function makeCode(prefix: string, count: number) {
  return `${prefix}-20260503-${String(count + 1).padStart(4, '0')}`;
}

function makeIdempotencyKey() {
  return `idem_${crypto.randomUUID()}`;
}

function feePreview(amount: number, channel = 'MARKETPLACE_CHECKOUT') {
  const marketplaceFee = channel.includes('MARKETPLACE') || channel.includes('SMARTQR') ? Math.round(amount * 0.02) : 0;
  const bankFee = Math.round(amount * 0.01);
  const gatewayFee = Math.round(amount * 0.005);
  const tax = Math.round(amount * 0.02);
  const totalDebit = amount + marketplaceFee + bankFee + gatewayFee + tax;
  return { marketplaceFee, bankFee, gatewayFee, tax, totalDebit };
}

function statusLabel(status: TxStatus | WebhookDelivery['status'] | FeeRule['status']) {
  const labels: Record<string, string> = {
    PENDING: 'Menunggu',
    PROCESSING: 'Diproses',
    SUCCESS: 'Berhasil',
    FAILED: 'Gagal',
    CANCELED: 'Dibatalkan',
    REVERSED: 'Dikembalikan',
    DELIVERED: 'Terkirim',
    RETRYING: 'Retry',
    ACTIVE: 'Aktif',
    DRAFT: 'Draft',
  };
  return labels[status] || status;
}

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function StatCard({ label, value, tone, icon: Icon }: { label: string; value: string; tone?: string; icon: LucideIcon }) {
  return (
    <div className="stat-card">
      <div className={cx('stat-icon', tone)}><Icon size={19} /></div>
      <div>
        <p className="muted small">{label}</p>
        <strong className="stat-value">{value}</strong>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: TxStatus | WebhookDelivery['status'] | FeeRule['status'] }) {
  return <span className={cx('badge', `badge-${status.toLowerCase()}`)}>{statusLabel(status)}</span>;
}

function MoneyText({ value }: { value: number }) {
  return <span className="money">{formatMoney(value)}</span>;
}

function EmptyState({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <PackageCheck size={34} />
      <p>{title}</p>
      {action}
    </div>
  );
}

function DataTable<T>({
  columns,
  rows,
  keyOf,
}: {
  columns: Array<{ header: string; render: (row: T) => ReactNode; className?: string }>;
  rows: T[];
  keyOf: (row: T) => string;
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{columns.map((col) => <th key={col.header} className={col.className}>{col.header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={keyOf(row)}>{columns.map((col) => <td key={col.header} className={col.className}>{col.render(row)}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type AppState = {
  accounts: Account[];
  transactions: Transaction[];
  ledger: LedgerEntry[];
  payments: Payment[];
  feeRules: FeeRule[];
  webhooks: WebhookDelivery[];
};

type AppContext = {
  user: User | null;
  state: AppState;
  setUser: (user: User | null) => void;
  setState: Dispatch<SetStateAction<AppState>>;
  navigate: (path: string) => void;
};

type Route = {
  path: string;
  label: string;
  section: string;
  icon: LucideIcon;
  roles?: Role[];
  public?: boolean;
  detail?: boolean;
  render: (ctx: AppContext, params: Record<string, string>) => ReactNode;
};

const routes: Route[] = [
  { path: '/', label: 'Beranda', section: 'Public', icon: Home, public: true, render: (ctx) => <LandingPage {...ctx} /> },
  { path: '/auth/login', label: 'Login', section: 'Public', icon: LogIn, public: true, render: (ctx) => <LoginPage {...ctx} /> },
  { path: '/auth/register', label: 'Register', section: 'Public', icon: Users, public: true, render: (ctx) => <RegisterPage {...ctx} /> },
  { path: '/403', label: 'Unauthorized', section: 'Public', icon: Lock, public: true, detail: true, render: (ctx) => <UnauthorizedPage {...ctx} /> },
  { path: '/404', label: 'Not Found', section: 'Public', icon: AlertTriangle, public: true, detail: true, render: (ctx) => <NotFoundPage {...ctx} /> },
  { path: '/dashboard', label: 'Dashboard', section: 'Wallet', icon: Gauge, roles: ['USER'], render: (ctx) => <UserDashboardPage {...ctx} /> },
  { path: '/wallet/balance', label: 'Saldo', section: 'Wallet', icon: WalletCards, roles: ['USER'], render: (ctx) => <BalancePage {...ctx} /> },
  { path: '/wallet/transactions', label: 'Riwayat Transaksi', section: 'Wallet', icon: History, roles: ['USER'], render: (ctx) => <TransactionsPage {...ctx} /> },
  { path: '/wallet/transactions/:transactionCode', label: 'Detail Transaksi', section: 'Wallet', icon: ReceiptText, roles: ['USER', 'ADMIN'], detail: true, render: (ctx, params) => <TransactionDetailPage {...ctx} transactionCode={params.transactionCode} /> },
  { path: '/wallet/transfer', label: 'Transfer', section: 'Wallet', icon: Send, roles: ['USER'], render: (ctx) => <TransferPage {...ctx} /> },
  { path: '/payments/new', label: 'Payment Request', section: 'Wallet', icon: CreditCard, roles: ['USER', 'DEVELOPER'], render: (ctx) => <NewPaymentPage {...ctx} /> },
  { path: '/payments/:paymentCode', label: 'Status Payment', section: 'Wallet', icon: ReceiptText, roles: ['USER', 'DEVELOPER', 'ADMIN'], detail: true, render: (ctx, params) => <PaymentDetailPage {...ctx} paymentCode={params.paymentCode} /> },
  { path: '/loans', label: 'Pinjaman', section: 'Wallet', icon: Landmark, roles: ['USER'], render: (ctx) => <LoansPage {...ctx} /> },
  { path: '/loans/apply', label: 'Ajukan Pinjaman', section: 'Wallet', icon: FileText, roles: ['USER'], render: () => <ApplyLoanPage /> },
  { path: '/subscriptions', label: 'Subscription', section: 'Wallet', icon: BellRing, roles: ['USER'], render: () => <SubscriptionsPage /> },
  { path: '/smartqr/pay', label: 'Bayar SmartQR', section: 'Wallet', icon: QrCode, roles: ['USER'], render: (ctx) => <SmartQRPayPage {...ctx} /> },
  { path: '/merchant/dashboard', label: 'Dashboard Merchant', section: 'Merchant', icon: Building2, roles: ['MERCHANT', 'SUPPLIER'], render: (ctx) => <MerchantDashboardPage {...ctx} /> },
  { path: '/merchant/payments', label: 'Incoming Payments', section: 'Merchant', icon: ReceiptText, roles: ['MERCHANT', 'SUPPLIER'], render: (ctx) => <MerchantPaymentsPage {...ctx} /> },
  { path: '/merchant/smartqr/create', label: 'Buat SmartQR', section: 'Merchant', icon: QrCode, roles: ['MERCHANT'], render: () => <SmartQRCreatePage /> },
  { path: '/merchant/smartqr', label: 'Daftar SmartQR', section: 'Merchant', icon: QrCode, roles: ['MERCHANT'], render: () => <SmartQRListPage /> },
  { path: '/merchant/settlements', label: 'Settlement', section: 'Merchant', icon: ClipboardCheck, roles: ['MERCHANT', 'SUPPLIER'], render: (ctx) => <SettlementPage {...ctx} /> },
  { path: '/merchant/fees', label: 'Ringkasan Fee', section: 'Merchant', icon: SlidersHorizontal, roles: ['MERCHANT'], render: (ctx) => <MerchantFeesPage {...ctx} /> },
  { path: '/admin', label: 'Admin Dashboard', section: 'Admin', icon: Gauge, roles: ['ADMIN'], render: (ctx) => <AdminDashboardPage {...ctx} /> },
  { path: '/admin/accounts', label: 'Accounts', section: 'Admin', icon: Users, roles: ['ADMIN'], render: (ctx) => <AccountsPage {...ctx} /> },
  { path: '/admin/ledger', label: 'Ledger', section: 'Admin', icon: BookOpen, roles: ['ADMIN'], render: (ctx) => <LedgerPage {...ctx} /> },
  { path: '/admin/payments', label: 'Payment Requests', section: 'Admin', icon: CreditCard, roles: ['ADMIN'], render: (ctx) => <AdminPaymentsPage {...ctx} /> },
  { path: '/admin/transactions', label: 'Transactions', section: 'Admin', icon: History, roles: ['ADMIN'], render: (ctx) => <AdminTransactionsPage {...ctx} /> },
  { path: '/admin/fee-rules', label: 'Fee Rules', section: 'Admin', icon: SlidersHorizontal, roles: ['ADMIN'], render: (ctx) => <FeeRulesPage {...ctx} /> },
  { path: '/admin/money-supply', label: 'Money Supply', section: 'Admin', icon: Banknote, roles: ['ADMIN'], render: (ctx) => <MoneySupplyPage {...ctx} /> },
  { path: '/admin/loans', label: 'Loan Monitor', section: 'Admin', icon: Landmark, roles: ['ADMIN'], render: () => <AdminLoansPage /> },
  { path: '/admin/applications', label: 'Applications', section: 'Admin', icon: Boxes, roles: ['ADMIN'], render: () => <ApplicationsPage /> },
  { path: '/admin/webhooks', label: 'Webhook Deliveries', section: 'Admin', icon: Webhook, roles: ['ADMIN'], render: (ctx) => <WebhookDeliveriesPage {...ctx} /> },
  { path: '/admin/audit-logs', label: 'Audit Logs', section: 'Admin', icon: ShieldCheck, roles: ['ADMIN'], render: () => <AuditLogsPage /> },
  { path: '/admin/reconciliation', label: 'Reconciliation', section: 'Admin', icon: ClipboardCheck, roles: ['ADMIN'], render: (ctx) => <ReconciliationPage {...ctx} /> },
  { path: '/developer', label: 'Developer Dashboard', section: 'Developer', icon: Code2, roles: ['DEVELOPER'], render: (ctx) => <DeveloperDashboardPage {...ctx} /> },
  { path: '/developer/api-clients', label: 'API Clients', section: 'Developer', icon: KeyRound, roles: ['DEVELOPER'], render: () => <ApiClientsPage /> },
  { path: '/developer/test-payment', label: 'Test Payment', section: 'Developer', icon: FileCode2, roles: ['DEVELOPER'], render: (ctx) => <NewPaymentPage {...ctx} developerMode /> },
  { path: '/developer/idempotency', label: 'Idempotency', section: 'Developer', icon: RefreshCw, roles: ['DEVELOPER'], render: (ctx) => <IdempotencyPage {...ctx} /> },
  { path: '/developer/webhook-endpoints', label: 'Webhook Endpoints', section: 'Developer', icon: Webhook, roles: ['DEVELOPER'], render: () => <WebhookEndpointsPage /> },
  { path: '/developer/webhook-test', label: 'Webhook Test', section: 'Developer', icon: Activity, roles: ['DEVELOPER'], render: (ctx) => <WebhookTestPage {...ctx} /> },
  { path: '/developer/api-docs', label: 'Swagger Docs', section: 'Developer', icon: BookOpen, roles: ['DEVELOPER'], render: () => <ApiDocsPage /> },
  { path: '/analytics/dashboard', label: 'Analytics Dashboard', section: 'Analytics', icon: BarChart3, roles: ['ANALYTICS'], render: (ctx) => <AnalyticsDashboardPage {...ctx} /> },
  { path: '/analytics/sales', label: 'Sales Analytics', section: 'Analytics', icon: LineChart, roles: ['ANALYTICS'], render: (ctx) => <SalesAnalyticsPage {...ctx} /> },
  { path: '/analytics/cashflow', label: 'Cashflow', section: 'Analytics', icon: Activity, roles: ['ANALYTICS'], render: (ctx) => <CashflowPage {...ctx} /> },
  { path: '/analytics/fees', label: 'Fee Analytics', section: 'Analytics', icon: SlidersHorizontal, roles: ['ANALYTICS'], render: (ctx) => <FeeAnalyticsPage {...ctx} /> },
  { path: '/analytics/reports', label: 'Export Report', section: 'Analytics', icon: FileText, roles: ['ANALYTICS'], render: () => <ReportsPage /> },
];

function matchRoute(pathname: string) {
  for (const route of routes) {
    const routeParts = route.path.split('/').filter(Boolean);
    const pathParts = pathname.split('/').filter(Boolean);
    if (routeParts.length !== pathParts.length) continue;
    const params: Record<string, string> = {};
    const matched = routeParts.every((part, index) => {
      if (part.startsWith(':')) {
        params[part.slice(1)] = decodeURIComponent(pathParts[index]);
        return true;
      }
      return part === pathParts[index];
    });
    if (matched) return { route, params };
  }
  return { route: routes.find((route) => route.path === '/404')!, params: {} };
}

export function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [mobileNav, setMobileNav] = useState(false);
  const [user, setUser] = useState<User | null>(() => {
    const stored = window.localStorage.getItem('smartbank:user');
    return stored ? (JSON.parse(stored) as User) : null;
  });
  const [state, setState] = useState<AppState>({
    accounts: initialAccounts,
    transactions: initialTransactions,
    ledger: initialLedger,
    payments: initialPayments,
    feeRules: initialFeeRules,
    webhooks: initialWebhooks,
  });

  const navigate = (nextPath: string) => {
    window.history.pushState({}, '', nextPath);
    setPath(nextPath);
    setMobileNav(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const setSessionUser = (nextUser: User | null) => {
    setUser(nextUser);
    if (nextUser) window.localStorage.setItem('smartbank:user', JSON.stringify(nextUser));
    else window.localStorage.removeItem('smartbank:user');
  };

  const { route, params } = matchRoute(path);
  const blocked = !route.public && (!user || !route.roles?.includes(user.role));
  const ctx = { user, state, setUser: setSessionUser, setState, navigate };
  const page = blocked ? <UnauthorizedPage {...ctx} /> : route.render(ctx, params);
  const visibleRoutes = routes.filter((item) => !item.detail && !item.public && user && item.roles?.includes(user.role));
  const sections = Array.from(new Set(visibleRoutes.map((item) => item.section)));

  return (
    <div className="app">
      {user && (
        <aside className={cx('sidebar', mobileNav && 'open')}>
          <div className="brand" onClick={() => navigate(defaultPathForRole(user.role))} role="button" tabIndex={0}>
            <div className="brand-mark"><Landmark size={22} /></div>
            <div>
              <strong>SmartBank</strong>
              <span>Payment Gateway</span>
            </div>
          </div>
          <nav>
            {sections.map((section) => (
              <div className="nav-section" key={section}>
                <p>{section}</p>
                {visibleRoutes.filter((item) => item.section === section).map((item) => {
                  const Icon = item.icon;
                  return (
                    <button key={item.path} className={cx('nav-link', path === item.path && 'active')} onClick={() => navigate(item.path)}>
                      <Icon size={17} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </aside>
      )}
      <div className="workspace">
        <header className="topbar">
          <button className="icon-button mobile-only" aria-label="Buka menu" onClick={() => setMobileNav(true)}><Menu size={20} /></button>
          <div>
            <p className="eyebrow">{route.section}</p>
            <h1>{route.label}</h1>
          </div>
          <div className="topbar-actions">
            <span className="api-chip">{apiBaseUrl}</span>
            {user ? (
              <>
                <div className="user-chip">
                  <strong>{user.name}</strong>
                  <span>{roleLabels[user.role]}</span>
                </div>
                <button className="icon-button" aria-label="Logout" onClick={() => { setSessionUser(null); navigate('/auth/login'); }}>
                  <LogOut size={19} />
                </button>
              </>
            ) : (
              <button className="button primary" onClick={() => navigate('/auth/login')}><LogIn size={17} /> Login</button>
            )}
          </div>
        </header>
        {mobileNav && <button className="nav-backdrop" aria-label="Tutup menu" onClick={() => setMobileNav(false)}><X size={24} /></button>}
        <main>{page}</main>
      </div>
    </div>
  );
}

function defaultPathForRole(role: Role) {
  return {
    USER: '/dashboard',
    MERCHANT: '/merchant/dashboard',
    SUPPLIER: '/merchant/dashboard',
    ADMIN: '/admin',
    DEVELOPER: '/developer',
    ANALYTICS: '/analytics/dashboard',
  }[role];
}

function LandingPage({ navigate }: AppContext) {
  return (
    <div className="public-page">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">SmartBank Payment Gateway</p>
          <h2>Portal operasional untuk transaksi, ledger, integrasi, dan demo RPL.</h2>
          <p className="lead">Setiap mutasi saldo tetap melewati backend SmartBank. Frontend ini menonjolkan preview fee, idempotency key, status payment, receipt, dan audit ledger.</p>
          <div className="button-row">
            <button className="button primary" onClick={() => navigate('/auth/login')}><LogIn size={17} /> Masuk Demo</button>
            <button className="button secondary" onClick={() => navigate('/auth/register')}><Users size={17} /> Register</button>
          </div>
        </div>
        <div className="hero-ledger">
          <StatCard label="Total supply" value="SC980.000.000" icon={Banknote} tone="teal" />
          <StatCard label="Webhook pending" value="2 event" icon={Webhook} tone="amber" />
          <StatCard label="Ledger status" value="Balanced" icon={BadgeCheck} tone="green" />
        </div>
      </section>
    </div>
  );
}

function LoginPage({ setUser, navigate }: AppContext) {
  const [role, setRole] = useState<Role>('USER');
  const [email, setEmail] = useState(demoUsers.find((demo) => demo.role === 'USER')!.email);
  const [password, setPassword] = useState('demo-smartbank');
  const [error, setError] = useState('');
  const selected = demoUsers.find((demo) => demo.role === role)!;
  const chooseRole = (nextRole: Role) => {
    const nextUser = demoUsers.find((demo) => demo.role === nextRole)!;
    setRole(nextRole);
    setEmail(nextUser.email);
    setPassword('demo-smartbank');
    setError('');
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!email.includes('@') || password.length < 8) {
      setError('Masukkan email valid dan password minimal 8 karakter.');
      return;
    }
    if (email !== selected.email || password !== 'demo-smartbank') {
      setError('Kredensial demo tidak cocok dengan role yang dipilih.');
      return;
    }
    setUser(selected);
    navigate(defaultPathForRole(selected.role));
  };
  return (
    <div className="auth-shell">
      <section className="auth-card">
        <form className="form-panel auth-form" onSubmit={submit}>
          <div>
            <p className="eyebrow">Masuk Portal</p>
            <h2>Login SmartBank</h2>
            <p className="muted">Pilih role demo, lalu masuk ke dashboard sesuai permission.</p>
          </div>
          <div className="role-picker" aria-label="Pilih role demo">
            {demoUsers.map((demo) => (
              <button
                className={cx('role-option', role === demo.role && 'active')}
                key={demo.role}
                onClick={() => chooseRole(demo.role)}
                type="button"
              >
                <strong>{roleLabels[demo.role]}</strong>
                <span>{demo.email}</span>
              </button>
            ))}
          </div>
          <label>Role
            <select value={role} onChange={(event) => chooseRole(event.target.value as Role)}>
              {demoUsers.map((demo) => <option key={demo.role} value={demo.role}>{roleLabels[demo.role]}</option>)}
            </select>
          </label>
          <label>Email
            <input autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label>Password
            <input autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} type="password" />
          </label>
          {error && <div className="callout danger"><AlertTriangle size={18} /> {error}</div>}
          <button className="button primary" type="submit"><ShieldCheck size={17} /> Masuk ke Dashboard</button>
          <p className="auth-switch">Belum punya akun? <button className="link-button" onClick={() => navigate('/auth/register')} type="button">Daftar sekarang</button></p>
        </form>
      </section>
      <AuthSidePanel selected={selected} />
    </div>
  );
}

function RegisterPage({ setUser, setState, navigate }: AppContext) {
  const [name, setName] = useState('Mahasiswa Baru');
  const [email, setEmail] = useState('mahasiswa@smartbank.test');
  const [password, setPassword] = useState('demo-smartbank');
  const [confirmPassword, setConfirmPassword] = useState('demo-smartbank');
  const [role, setRole] = useState<Role>('USER');
  const [accepted, setAccepted] = useState(true);
  const [error, setError] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (name.trim().length < 3) {
      setError('Nama minimal 3 karakter.');
      return;
    }
    if (!email.includes('@')) {
      setError('Email belum valid.');
      return;
    }
    if (password.length < 8 || password !== confirmPassword) {
      setError('Password minimal 8 karakter dan konfirmasi harus sama.');
      return;
    }
    if (!accepted) {
      setError('Setujui bahwa mutasi saldo final tetap dilakukan backend.');
      return;
    }
    const accountCode = `ACC-${role}-${Date.now().toString().slice(-5)}`;
    const nextUser: User = {
      id: `reg-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      role,
      accountCode,
    };
    setState((prev) => ({
      ...prev,
      accounts: [
        {
          code: accountCode,
          owner: nextUser.name,
          role,
          balance: role === 'USER' ? 50000 : 0,
          token: `tok_${role.toLowerCase()}_${crypto.randomUUID().slice(0, 4)}****`,
          status: 'ACTIVE',
        },
        ...prev.accounts,
      ],
    }));
    setUser(nextUser);
    navigate(defaultPathForRole(role));
  };
  return (
    <div className="auth-shell">
      <section className="auth-card">
        <form className="form-panel auth-form" onSubmit={submit}>
          <div>
            <p className="eyebrow">Registrasi</p>
            <h2>Buat Akun SmartBank</h2>
            <p className="muted">Akun demo langsung mendapat account internal untuk menjalankan flow presentasi.</p>
          </div>
          <label>Nama lengkap<input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label>Email<input autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label>Role akun
            <select value={role} onChange={(event) => setRole(event.target.value as Role)}>
              <option value="USER">User / Mahasiswa</option>
              <option value="MERCHANT">Merchant / UMKM</option>
              <option value="SUPPLIER">Supplier</option>
            </select>
          </label>
          <div className="two-col">
            <label>Password<input autoComplete="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
            <label>Konfirmasi<input autoComplete="new-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>
          </div>
          <label className="check-row">
            <input checked={accepted} onChange={(event) => setAccepted(event.target.checked)} type="checkbox" />
            <span>Saya paham frontend hanya membuat request; backend tetap menghitung saldo, fee, dan ledger final.</span>
          </label>
          <div className="callout"><WalletCards size={18} /> User demo menerima saldo awal SC50.000. Merchant dan Supplier dibuat dengan saldo awal SC0.</div>
          {error && <div className="callout danger"><AlertTriangle size={18} /> {error}</div>}
          <button className="button primary" type="submit"><Users size={17} /> Buat Akun dan Masuk</button>
          <p className="auth-switch">Sudah punya akun? <button className="link-button" onClick={() => navigate('/auth/login')} type="button">Login</button></p>
        </form>
      </section>
      <section className="auth-info panel">
        <h3>Setelah register</h3>
        <div className="detail-list">
          <span>Account internal <strong>dibuat otomatis</strong></span>
          <span>Route guard <strong>aktif sesuai role</strong></span>
          <span>Session demo <strong>tersimpan lokal</strong></span>
        </div>
        <div className="callout warning"><Lock size={18} /> Produksi tetap membutuhkan endpoint `POST /auth/register`, validasi backend, dan refresh token HttpOnly.</div>
      </section>
    </div>
  );
}

function AuthSidePanel({ selected }: { selected: User }) {
  return (
    <section className="auth-info panel">
      <h3>Kredensial demo</h3>
      <div className="detail-list">
        <span>Email <strong>{selected.email}</strong></span>
        <span>Password <strong>demo-smartbank</strong></span>
        <span>Redirect <strong>{defaultPathForRole(selected.role)}</strong></span>
      </div>
      <div className="callout warning"><Lock size={18} /> Client secret dan HMAC produksi tidak pernah disimpan di browser.</div>
      <p className="muted">Untuk produksi, form ini tinggal diarahkan ke `POST /auth/login`, lalu profil user diambil dari `GET /auth/me`.</p>
    </section>
  );
}

function UnauthorizedPage({ user, navigate }: AppContext) {
  return (
    <div className="panel centered">
      <Lock size={42} />
      <h2>Akses ditolak</h2>
      <p className="muted">Role {user ? roleLabels[user.role] : 'Guest'} tidak memiliki akses ke halaman ini.</p>
      <button className="button primary" onClick={() => navigate(user ? defaultPathForRole(user.role) : '/auth/login')}>Kembali</button>
    </div>
  );
}

function NotFoundPage({ navigate }: AppContext) {
  return (
    <div className="panel centered">
      <Search size={42} />
      <h2>Halaman tidak ditemukan</h2>
      <p className="muted">Route belum tersedia di portal SmartBank.</p>
      <button className="button primary" onClick={() => navigate('/')}>Ke Beranda</button>
    </div>
  );
}

function currentAccount(ctx: AppContext) {
  return ctx.state.accounts.find((account) => account.code === ctx.user?.accountCode);
}

function userTransactions(ctx: AppContext) {
  return ctx.state.transactions.filter((tx) => tx.from === ctx.user?.accountCode || tx.to === ctx.user?.accountCode);
}

function UserDashboardPage(ctx: AppContext) {
  const account = currentAccount(ctx)!;
  const transactions = userTransactions(ctx);
  const pending = transactions.filter((tx) => tx.status === 'PENDING' || tx.status === 'PROCESSING').length;
  return (
    <div className="page-stack">
      <section className="stats-grid">
        <StatCard label="Saldo aktif" value={formatMoney(account.balance)} icon={WalletCards} tone="teal" />
        <StatCard label="Transaksi bulan ini" value={`${transactions.length} trx`} icon={History} tone="blue" />
        <StatCard label="Status berjalan" value={`${pending} pending`} icon={Activity} tone="amber" />
        <StatCard label="Daily limit tersisa" value={formatMoney(350000)} icon={ShieldCheck} tone="green" />
      </section>
      <section className="split-grid">
        <div className="panel">
          <div className="panel-head">
            <h2>Transaksi terakhir</h2>
            <button className="button ghost" onClick={() => ctx.navigate('/wallet/transactions')}>Lihat semua</button>
          </div>
          <TransactionTable rows={transactions.slice(0, 4)} navigate={ctx.navigate} />
        </div>
        <div className="panel">
          <h2>Aksi cepat</h2>
          <div className="quick-actions">
            <button className="quick-action" onClick={() => ctx.navigate('/wallet/transfer')}><Send /> Transfer</button>
            <button className="quick-action" onClick={() => ctx.navigate('/payments/new')}><CreditCard /> Payment</button>
            <button className="quick-action" onClick={() => ctx.navigate('/smartqr/pay')}><QrCode /> SmartQR</button>
            <button className="quick-action" onClick={() => ctx.navigate('/loans/apply')}><Landmark /> Pinjaman</button>
          </div>
          <div className="callout warning"><AlertTriangle size={18} /> Balance di UI hanya informasi. Backend tetap menghitung saldo, fee, limit, dan ledger final.</div>
        </div>
      </section>
    </div>
  );
}

function BalancePage(ctx: AppContext) {
  const account = currentAccount(ctx)!;
  return (
    <div className="split-grid">
      <section className="panel balance-panel">
        <p className="eyebrow">Saldo SMART_COIN</p>
        <h2>{formatMoney(account.balance)}</h2>
        <div className="detail-list">
          <span>Account code <strong>{account.code}</strong></span>
          <span>Token internal <strong>{account.token}</strong></span>
          <span>Status <StatusBadge status="SUCCESS" /></span>
        </div>
      </section>
      <section className="panel">
        <h2>Reserve model</h2>
        <p className="muted">Saldo tidak diubah langsung oleh frontend. Transfer dan payment membuat request ke backend, backend mencatat debit/kredit ledger, lalu UI mengambil status terbaru.</p>
        <div className="flow-list">
          <span>Frontend form</span>
          <span>API /api/v1</span>
          <span>Ledger MySQL</span>
          <span>Receipt</span>
        </div>
      </section>
    </div>
  );
}

function TransactionsPage(ctx: AppContext) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Riwayat transaksi</h2>
        <div className="filter-strip"><input placeholder="Cari kode / channel" /><button className="icon-button" aria-label="Cari"><Search size={18} /></button></div>
      </div>
      <TransactionTable rows={userTransactions(ctx)} navigate={ctx.navigate} />
    </section>
  );
}

function TransactionTable({ rows, navigate }: { rows: Transaction[]; navigate: (path: string) => void }) {
  if (!rows.length) return <EmptyState title="Belum ada transaksi" />;
  return (
    <DataTable
      rows={rows}
      keyOf={(row) => row.code}
      columns={[
        { header: 'Kode', render: (row) => <button className="link-button" onClick={() => navigate(`/wallet/transactions/${row.code}`)}>{row.code}</button> },
        { header: 'Channel', render: (row) => row.channel },
        { header: 'Nominal', render: (row) => <MoneyText value={row.amount} />, className: 'right' },
        { header: 'Fee', render: (row) => <MoneyText value={row.fee + row.tax} />, className: 'right' },
        { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        { header: 'Waktu', render: (row) => formatDate(row.createdAt) },
      ]}
    />
  );
}

function TransactionDetailPage(ctx: AppContext & { transactionCode: string }) {
  const tx = ctx.state.transactions.find((item) => item.code === ctx.transactionCode);
  const entries = ctx.state.ledger.filter((entry) => entry.transactionCode === ctx.transactionCode);
  if (!tx) return <EmptyState title="Transaksi tidak ditemukan" />;
  return (
    <div className="page-stack">
      <section className="receipt">
        <div>
          <p className="eyebrow">Bukti pembayaran</p>
          <h2>{tx.code}</h2>
          <p className="muted">{tx.description}</p>
        </div>
        <StatusBadge status={tx.status} />
        <div className="receipt-grid">
          <span>Dari<strong>{tx.from}</strong></span>
          <span>Ke<strong>{tx.to}</strong></span>
          <span>Nominal<strong>{formatMoney(tx.amount)}</strong></span>
          <span>Fee + pajak<strong>{formatMoney(tx.fee + tx.tax)}</strong></span>
          <span>Channel<strong>{tx.channel}</strong></span>
          <span>Waktu<strong>{formatDate(tx.createdAt)}</strong></span>
        </div>
      </section>
      <section className="panel">
        <h2>Ledger ringkas</h2>
        <LedgerEntries rows={entries} />
      </section>
    </div>
  );
}

function TransferPage(ctx: AppContext) {
  const [to, setTo] = useState('ACC-MERCHANT-001');
  const [amount, setAmount] = useState(50000);
  const [description, setDescription] = useState('Transfer demo SmartBank');
  const [previewed, setPreviewed] = useState(false);
  const [result, setResult] = useState<Transaction | null>(null);
  const preview = feePreview(amount, 'INTERNAL_TRANSFER');
  const idempotencyKey = useMemo(makeIdempotencyKey, [result]);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!previewed) {
      setPreviewed(true);
      return;
    }
    const from = ctx.user!.accountCode;
    const source = ctx.state.accounts.find((account) => account.code === from)!;
    const target = ctx.state.accounts.find((account) => account.code === to)!;
    const totalDebit = amount + preview.bankFee;
    const status: TxStatus = source.balance >= totalDebit ? 'SUCCESS' : 'FAILED';
    const code = makeCode('TRX', ctx.state.transactions.length);
    const createdAt = new Date().toISOString();
    const tx: Transaction = { code, from, to, amount, fee: preview.bankFee, tax: 0, status, channel: 'INTERNAL_TRANSFER', description, createdAt };
    ctx.setState((prev) => {
      if (status === 'FAILED') return { ...prev, transactions: [tx, ...prev.transactions] };
      const accounts = prev.accounts.map((account) => {
        if (account.code === from) return { ...account, balance: account.balance - totalDebit };
        if (account.code === to) return { ...account, balance: account.balance + amount };
        if (account.code === 'ACC-FEE') return { ...account, balance: account.balance + preview.bankFee };
        return account;
      });
      const ledger = [
        ...[
          {
            id: `LED-${prev.ledger.length + 1}`,
            transactionCode: code,
            accountCode: from,
            direction: 'DEBIT' as LedgerDirection,
            amount: totalDebit,
            balanceBefore: source.balance,
            balanceAfter: source.balance - totalDebit,
            description: 'Debit transfer + fee',
            hash: `hsh_${crypto.randomUUID().slice(0, 6)}`,
            previousHash: prev.ledger[prev.ledger.length - 1]?.hash || 'genesis',
            createdAt,
          },
          {
            id: `LED-${prev.ledger.length + 2}`,
            transactionCode: code,
            accountCode: to,
            direction: 'CREDIT' as LedgerDirection,
            amount,
            balanceBefore: target.balance,
            balanceAfter: target.balance + amount,
            description: 'Credit penerima',
            hash: `hsh_${crypto.randomUUID().slice(0, 6)}`,
            previousHash: 'previous',
            createdAt,
          },
          {
            id: `LED-${prev.ledger.length + 3}`,
            transactionCode: code,
            accountCode: 'ACC-FEE',
            direction: 'CREDIT' as LedgerDirection,
            amount: preview.bankFee,
            balanceBefore: prev.accounts.find((account) => account.code === 'ACC-FEE')!.balance,
            balanceAfter: prev.accounts.find((account) => account.code === 'ACC-FEE')!.balance + preview.bankFee,
            description: 'Fee bank',
            hash: `hsh_${crypto.randomUUID().slice(0, 6)}`,
            previousHash: 'previous',
            createdAt,
          },
        ],
        ...prev.ledger,
      ];
      return { ...prev, accounts, transactions: [tx, ...prev.transactions], ledger };
    });
    setResult(tx);
  };
  return (
    <div className="split-grid">
      <form className="panel form-panel" onSubmit={submit}>
        <h2>Transfer antar account</h2>
        <label>Account tujuan
          <select value={to} onChange={(event) => { setTo(event.target.value); setPreviewed(false); }}>
            {ctx.state.accounts.filter((account) => account.role !== 'SYSTEM' && account.code !== ctx.user?.accountCode).map((account) => (
              <option key={account.code} value={account.code}>{account.owner} - {account.code}</option>
            ))}
          </select>
        </label>
        <label>Nominal
          <input type="number" min={1000} value={amount} onChange={(event) => { setAmount(Number(event.target.value)); setPreviewed(false); }} />
        </label>
        <label>Deskripsi
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <div className="callout"><RefreshCw size={18} /> Idempotency-Key: <code>{idempotencyKey.slice(0, 28)}...</code></div>
        <button className="button primary" type="submit">{previewed ? 'Konfirmasi Transfer' : 'Lihat Rincian Biaya'}</button>
      </form>
      <FeeBreakdown amount={amount} preview={{ ...preview, marketplaceFee: 0, gatewayFee: 0, tax: 0, totalDebit: amount + preview.bankFee }} result={result} />
    </div>
  );
}

function FeeBreakdown({
  amount,
  preview,
  result,
}: {
  amount: number;
  preview: ReturnType<typeof feePreview>;
  result?: Transaction | Payment | null;
}) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Rincian biaya</h2>
        {result && <StatusBadge status={result.status} />}
      </div>
      <div className="fee-list">
        <span>Nominal dasar <strong>{formatMoney(amount)}</strong></span>
        <span>Marketplace/POS fee <strong>{formatMoney(preview.marketplaceFee)}</strong></span>
        <span>Bank fee <strong>{formatMoney(preview.bankFee)}</strong></span>
        <span>Gateway fee <strong>{formatMoney(preview.gatewayFee)}</strong></span>
        <span>Pajak <strong>{formatMoney(preview.tax)}</strong></span>
        <span className="total">Total debit <strong>{formatMoney(preview.totalDebit)}</strong></span>
      </div>
      {result && (
        <div className={cx('callout', result.status === 'FAILED' && 'danger')}>
          {result.status === 'FAILED' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          {result.status === 'FAILED' ? 'Transaksi ditolak. Backend tidak mengubah ledger.' : `Receipt dibuat: ${result.code}`}
        </div>
      )}
    </section>
  );
}

function NewPaymentPage(ctx: AppContext & { developerMode?: boolean }) {
  const [sourceApp, setSourceApp] = useState('MARKETPLACE');
  const [channel, setChannel] = useState('MARKETPLACE_CHECKOUT');
  const [debtor, setDebtor] = useState(ctx.user?.role === 'USER' ? ctx.user.accountCode : 'ACC-USER-001');
  const [creditor, setCreditor] = useState('ACC-MERCHANT-001');
  const [amount, setAmount] = useState(100000);
  const [idempotencyKey, setIdempotencyKey] = useState(makeIdempotencyKey);
  const [payment, setPayment] = useState<Payment | null>(null);
  const preview = feePreview(amount, channel);
  const requestJson = { sourceApp, channel, debtor, creditor, amount, currency: 'SMART_COIN', idempotencyKey };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const source = ctx.state.accounts.find((account) => account.code === debtor)!;
    const status: TxStatus = source.balance >= preview.totalDebit ? 'SUCCESS' : 'FAILED';
    const createdAt = new Date().toISOString();
    const code = makeCode('PAY', ctx.state.payments.length);
    const nextPayment: Payment = { code, sourceApp, channel, debtor, creditor, baseAmount: amount, ...preview, status, idempotencyKey, createdAt };
    const txCode = makeCode('TRX', ctx.state.transactions.length);
    const tx: Transaction = { code: txCode, paymentCode: code, from: debtor, to: creditor, amount, fee: preview.marketplaceFee + preview.bankFee + preview.gatewayFee, tax: preview.tax, status, channel, description: `${sourceApp} payment request`, createdAt };
    ctx.setState((prev) => ({ ...prev, payments: [nextPayment, ...prev.payments], transactions: [tx, ...prev.transactions] }));
    setPayment(nextPayment);
  };
  return (
    <div className="split-grid">
      <form className="panel form-panel" onSubmit={submit}>
        <h2>{ctx.developerMode ? 'Developer test payment' : 'Payment request'}</h2>
        <div className="two-col">
          <label>Source app
            <select value={sourceApp} onChange={(event) => setSourceApp(event.target.value)}>
              <option>MARKETPLACE</option><option>WARUNGPOS</option><option>SUPPLIERHUB</option><option>LOGISTIKITA</option><option>UMKM_INSIGHT</option>
            </select>
          </label>
          <label>Channel
            <select value={channel} onChange={(event) => setChannel(event.target.value)}>
              <option>MARKETPLACE_CHECKOUT</option><option>POS_CHECKOUT</option><option>SMARTQR_DYNAMIC</option><option>SUBSCRIPTION_MANDATE</option>
            </select>
          </label>
        </div>
        <div className="two-col">
          <label>Debtor<input value={debtor} onChange={(event) => setDebtor(event.target.value)} /></label>
          <label>Creditor<input value={creditor} onChange={(event) => setCreditor(event.target.value)} /></label>
        </div>
        <label>Nominal<input type="number" min={1000} value={amount} onChange={(event) => setAmount(Number(event.target.value))} /></label>
        <div className="callout">
          <RefreshCw size={18} />
          <code>{idempotencyKey.slice(0, 32)}...</code>
          <button className="button mini" type="button" onClick={() => setIdempotencyKey(makeIdempotencyKey())}>Regenerate</button>
        </div>
        {ctx.developerMode && <div className="callout warning"><Lock size={18} /> Signature HMAC produksi harus dibuat server-side/BFF, bukan browser.</div>}
        <button className="button primary" type="submit"><CreditCard size={17} /> Submit Payment</button>
      </form>
      <section className="panel">
        <div className="tabs"><span className="active">Fee</span><span>Request JSON</span><span>Response</span></div>
        <FeeBreakdown amount={amount} preview={preview} result={payment} />
        <pre className="code-block">{JSON.stringify({ request: requestJson, response: payment }, null, 2)}</pre>
      </section>
    </div>
  );
}

function PaymentDetailPage(ctx: AppContext & { paymentCode: string }) {
  const payment = ctx.state.payments.find((item) => item.code === ctx.paymentCode);
  if (!payment) return <EmptyState title="Payment request tidak ditemukan" />;
  return (
    <section className="receipt">
      <div>
        <p className="eyebrow">Payment request</p>
        <h2>{payment.code}</h2>
        <p className="muted">{payment.sourceApp} / {payment.channel}</p>
      </div>
      <StatusBadge status={payment.status} />
      <div className="receipt-grid">
        <span>Debtor<strong>{payment.debtor}</strong></span>
        <span>Creditor<strong>{payment.creditor}</strong></span>
        <span>Base amount<strong>{formatMoney(payment.baseAmount)}</strong></span>
        <span>Total debit<strong>{formatMoney(payment.totalDebit)}</strong></span>
        <span>Idempotency<strong>{payment.idempotencyKey.slice(0, 22)}...</strong></span>
        <span>Created<strong>{formatDate(payment.createdAt)}</strong></span>
      </div>
    </section>
  );
}

function LoansPage(ctx: AppContext) {
  return (
    <div className="split-grid">
      <section className="panel">
        <h2>Pinjaman aktif</h2>
        <DataTable
          rows={[{ id: 'LOAN-001', amount: 100000, interest: 10000, status: 'PENDING', due: '2026-06-03' }]}
          keyOf={(row) => row.id}
          columns={[
            { header: 'Loan', render: (row) => row.id },
            { header: 'Pokok', render: (row) => <MoneyText value={row.amount} />, className: 'right' },
            { header: 'Bunga 10%', render: (row) => <MoneyText value={row.interest} />, className: 'right' },
            { header: 'Status', render: (row) => <StatusBadge status={row.status as TxStatus} /> },
            { header: 'Jatuh tempo', render: (row) => row.due },
          ]}
        />
      </section>
      <section className="panel">
        <h2>Ajukan baru</h2>
        <p className="muted">MVP membatasi pengajuan pinjaman maksimal SC100.000 dengan bunga demo 10%.</p>
        <button className="button primary" onClick={() => ctx.navigate('/loans/apply')}>Ajukan Pinjaman</button>
      </section>
    </div>
  );
}

function ApplyLoanPage() {
  const [amount, setAmount] = useState(100000);
  const valid = amount <= 100000;
  return (
    <form className="panel form-panel narrow">
      <h2>Pengajuan pinjaman</h2>
      <label>Nominal<input type="number" max={100000} value={amount} onChange={(event) => setAmount(Number(event.target.value))} /></label>
      <div className={cx('callout', !valid && 'danger')}>
        <Landmark size={18} /> Total due: {formatMoney(amount + Math.round(amount * 0.1))}. Maksimal pengajuan SC100.000.
      </div>
      <button className="button primary" type="button" disabled={!valid}>Kirim Pengajuan</button>
    </form>
  );
}

function SubscriptionsPage() {
  const [active, setActive] = useState(true);
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>UMKM Insight Mandate</h2>
        <StatusBadge status={active ? 'SUCCESS' : 'CANCELED'} />
      </div>
      <div className="receipt-grid">
        <span>Produk<strong>UMKM Insight Analytics</strong></span>
        <span>Biaya mingguan<strong>{formatMoney(10000)}</strong></span>
        <span>Mandate ID<strong>MDT-INSIGHT-0001</strong></span>
        <span>Next charge<strong>2026-05-10</strong></span>
      </div>
      <button className="button secondary" onClick={() => setActive(!active)}>{active ? 'Batalkan Mandate' : 'Aktifkan Mandate'}</button>
    </section>
  );
}

function SmartQRPayPage(ctx: AppContext) {
  const [qr, setQr] = useState('SQR|ACC-MERCHANT-001|75000|PasarKita');
  return (
    <div className="split-grid">
      <form className="panel form-panel">
        <h2>Bayar SmartQR</h2>
        <label>QR payload<textarea value={qr} onChange={(event) => setQr(event.target.value)} /></label>
        <button className="button primary" type="button" onClick={() => ctx.navigate('/payments/new')}><QrCode size={17} /> Lanjutkan Payment</button>
      </form>
      <section className="panel qr-preview">
        <QrCode size={120} />
        <p className="muted">Demo scanner menerima payload teks. Produksi dapat memakai kamera dan validasi signature QR dari backend.</p>
      </section>
    </div>
  );
}

function MerchantDashboardPage(ctx: AppContext) {
  const incoming = ctx.state.transactions.filter((tx) => tx.to === ctx.user?.accountCode);
  const settled = incoming.filter((tx) => tx.status === 'SUCCESS').reduce((sum, tx) => sum + tx.amount, 0);
  return (
    <div className="page-stack">
      <section className="stats-grid">
        <StatCard label="Pembayaran masuk" value={formatMoney(settled)} icon={ReceiptText} tone="teal" />
        <StatCard label="Incoming trx" value={`${incoming.length} trx`} icon={History} tone="blue" />
        <StatCard label="QR aktif" value="3 QR" icon={QrCode} tone="green" />
        <StatCard label="Fee bulan ini" value={formatMoney(12875)} icon={SlidersHorizontal} tone="amber" />
      </section>
      <section className="panel"><h2>Incoming payments</h2><TransactionTable rows={incoming} navigate={ctx.navigate} /></section>
    </div>
  );
}

function MerchantPaymentsPage(ctx: AppContext) {
  return <section className="panel"><h2>Daftar pembayaran masuk</h2><TransactionTable rows={ctx.state.transactions.filter((tx) => tx.to === ctx.user?.accountCode)} navigate={ctx.navigate} /></section>;
}

function SmartQRCreatePage() {
  const [amount, setAmount] = useState(75000);
  return (
    <div className="split-grid">
      <form className="panel form-panel">
        <h2>Generate SmartQR</h2>
        <label>Tipe<select><option>QR Dinamis</option><option>QR Statis</option></select></label>
        <label>Nominal<input type="number" value={amount} onChange={(event) => setAmount(Number(event.target.value))} /></label>
        <label>Deskripsi<input defaultValue="Checkout PasarKita" /></label>
        <button className="button primary" type="button"><QrCode size={17} /> Generate</button>
      </form>
      <section className="panel qr-preview"><QrCode size={128} /><strong>{formatMoney(amount)}</strong><p className="muted">SQR|ACC-MERCHANT-001|{amount}|PasarKita</p></section>
    </div>
  );
}

function SmartQRListPage() {
  return <SimpleList title="SmartQR aktif" rows={['SQR-PK-0001 - Dinamis SC75.000', 'SQR-PK-0002 - Statis tanpa nominal', 'SQR-PK-0003 - Dinamis SC125.000']} />;
}

function SettlementPage(ctx: AppContext) {
  return <section className="panel"><h2>Settlement internal</h2><TransactionTable rows={ctx.state.transactions.filter((tx) => tx.status === 'SUCCESS')} navigate={ctx.navigate} /></section>;
}

function MerchantFeesPage(ctx: AppContext) {
  return <section className="panel"><h2>Fee yang dipotong</h2><FeeRulesTable rows={ctx.state.feeRules} /></section>;
}

function AdminDashboardPage(ctx: AppContext) {
  const supply = ctx.state.accounts.reduce((sum, account) => sum + account.balance, 0);
  const successRate = Math.round((ctx.state.transactions.filter((tx) => tx.status === 'SUCCESS').length / ctx.state.transactions.length) * 100);
  return (
    <div className="page-stack">
      <section className="stats-grid">
        <StatCard label="Money supply" value={formatMoney(supply)} icon={Banknote} tone="teal" />
        <StatCard label="Bank reserve" value={formatMoney(ctx.state.accounts.find((a) => a.code === 'ACC-RESERVE')!.balance)} icon={Landmark} tone="blue" />
        <StatCard label="Success rate" value={`${successRate}%`} icon={BadgeCheck} tone="green" />
        <StatCard label="Webhook retry" value={`${ctx.state.webhooks.filter((w) => w.status !== 'DELIVERED').length} event`} icon={Webhook} tone="amber" />
      </section>
      <section className="split-grid">
        <div className="panel"><h2>Ledger anomaly</h2><ReconciliationSummary ledger={ctx.state.ledger} /></div>
        <div className="panel"><h2>Webhook deliveries</h2><WebhookTable rows={ctx.state.webhooks} /></div>
      </section>
    </div>
  );
}

function AccountsPage(ctx: AppContext) {
  return (
    <section className="panel">
      <h2>Accounts</h2>
      <DataTable
        rows={ctx.state.accounts}
        keyOf={(row) => row.code}
        columns={[
          { header: 'Account', render: (row) => row.code },
          { header: 'Owner', render: (row) => row.owner },
          { header: 'Role', render: (row) => row.role },
          { header: 'Balance', render: (row) => <MoneyText value={row.balance} />, className: 'right' },
          { header: 'Token', render: (row) => row.token },
          { header: 'Status', render: (row) => row.status },
        ]}
      />
    </section>
  );
}

function LedgerPage(ctx: AppContext) {
  return <section className="panel"><div className="panel-head"><h2>Ledger debit/kredit</h2><button className="button secondary">Export CSV</button></div><LedgerEntries rows={ctx.state.ledger} /></section>;
}

function LedgerEntries({ rows }: { rows: LedgerEntry[] }) {
  if (!rows.length) return <EmptyState title="Belum ada entry ledger" />;
  return (
    <DataTable
      rows={rows}
      keyOf={(row) => row.id}
      columns={[
        { header: 'ID', render: (row) => row.id },
        { header: 'Transaction', render: (row) => row.transactionCode },
        { header: 'Account', render: (row) => row.accountCode },
        { header: 'Arah', render: (row) => row.direction },
        { header: 'Amount', render: (row) => <MoneyText value={row.amount} />, className: 'right' },
        { header: 'After', render: (row) => <MoneyText value={row.balanceAfter} />, className: 'right' },
        { header: 'Hash', render: (row) => row.hash },
      ]}
    />
  );
}

function AdminPaymentsPage(ctx: AppContext) {
  return <section className="panel"><h2>Semua payment request</h2><PaymentTable rows={ctx.state.payments} navigate={ctx.navigate} /></section>;
}

function PaymentTable({ rows, navigate }: { rows: Payment[]; navigate: (path: string) => void }) {
  return (
    <DataTable
      rows={rows}
      keyOf={(row) => row.code}
      columns={[
        { header: 'Payment', render: (row) => <button className="link-button" onClick={() => navigate(`/payments/${row.code}`)}>{row.code}</button> },
        { header: 'App', render: (row) => row.sourceApp },
        { header: 'Channel', render: (row) => row.channel },
        { header: 'Total debit', render: (row) => <MoneyText value={row.totalDebit} />, className: 'right' },
        { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        { header: 'Idempotency', render: (row) => row.idempotencyKey.slice(0, 18) + '...' },
      ]}
    />
  );
}

function AdminTransactionsPage(ctx: AppContext) {
  return <section className="panel"><h2>Monitoring transaksi</h2><TransactionTable rows={ctx.state.transactions} navigate={ctx.navigate} /></section>;
}

function FeeRulesPage(ctx: AppContext) {
  const updateRule = (id: string, percent: number) => {
    ctx.setState((prev) => ({ ...prev, feeRules: prev.feeRules.map((rule) => rule.id === id ? { ...rule, percent } : rule) }));
  };
  return (
    <section className="panel">
      <div className="panel-head"><h2>Fee rules</h2><button className="button secondary">Preview Fee</button></div>
      <div className="editable-rules">
        {ctx.state.feeRules.map((rule) => (
          <label key={rule.id}>{rule.name}
            <input type="number" step="0.1" value={rule.percent} onChange={(event) => updateRule(rule.id, Number(event.target.value))} />
          </label>
        ))}
      </div>
      <FeeRulesTable rows={ctx.state.feeRules} />
    </section>
  );
}

function FeeRulesTable({ rows }: { rows: FeeRule[] }) {
  return (
    <DataTable
      rows={rows}
      keyOf={(row) => row.id}
      columns={[
        { header: 'Rule', render: (row) => row.name },
        { header: 'Channel', render: (row) => row.channel },
        { header: 'Percent', render: (row) => `${row.percent}%`, className: 'right' },
        { header: 'Fixed', render: (row) => <MoneyText value={row.fixed} />, className: 'right' },
        { header: 'Destination', render: (row) => row.destination },
        { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
      ]}
    />
  );
}

function MoneySupplyPage(ctx: AppContext) {
  const rows = ctx.state.accounts.map((account) => ({ label: account.owner, value: account.balance }));
  const max = Math.max(...rows.map((row) => row.value));
  return (
    <section className="panel">
      <h2>Money supply</h2>
      <div className="bar-list">
        {rows.map((row) => <span key={row.label}><strong>{row.label}</strong><i style={{ width: `${Math.max(4, (row.value / max) * 100)}%` }} /><em>{formatMoney(row.value)}</em></span>)}
      </div>
    </section>
  );
}

function AdminLoansPage() {
  return <SimpleList title="Loan approval queue" rows={['LOAN-001 - Raka - SC100.000 - PENDING', 'LOAN-002 - Merchant UMKM - SC75.000 - REVIEW']} />;
}

function ApplicationsPage() {
  return <SimpleList title="Registered applications" rows={['MARKETPLACE / PasarKita - ACTIVE', 'WARUNGPOS - ACTIVE', 'SUPPLIERHUB - ACTIVE', 'LOGISTIKITA - ACTIVE', 'UMKM_INSIGHT - READ_ONLY']} />;
}

function WebhookDeliveriesPage(ctx: AppContext) {
  const retry = (id: string) => ctx.setState((prev) => ({ ...prev, webhooks: prev.webhooks.map((item) => item.id === id ? { ...item, status: 'RETRYING', attempts: item.attempts + 1 } : item) }));
  return (
    <section className="panel">
      <div className="panel-head"><h2>Webhook deliveries</h2><button className="button secondary" onClick={() => retry('EVT-20260503-0003')}>Kirim Ulang Webhook</button></div>
      <WebhookTable rows={ctx.state.webhooks} />
    </section>
  );
}

function WebhookTable({ rows }: { rows: WebhookDelivery[] }) {
  return (
    <DataTable
      rows={rows}
      keyOf={(row) => row.id}
      columns={[
        { header: 'Event', render: (row) => row.id },
        { header: 'App', render: (row) => row.app },
        { header: 'Type', render: (row) => row.event },
        { header: 'Attempts', render: (row) => row.attempts, className: 'right' },
        { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        { header: 'Next retry', render: (row) => row.nextRetry },
      ]}
    />
  );
}

function AuditLogsPage() {
  return <SimpleList title="Audit logs" rows={['2026-05-03 13:01 LOGIN_SUCCESS admin@smartbank.test', '2026-05-03 13:04 FEE_RULE_PREVIEW FEE-MKT', '2026-05-03 13:08 WEBHOOK_RETRY EVT-20260503-0003']} />;
}

function ReconciliationPage(ctx: AppContext) {
  return <section className="panel"><h2>Rekonsiliasi</h2><ReconciliationSummary ledger={ctx.state.ledger} /></section>;
}

function ReconciliationSummary({ ledger }: { ledger: LedgerEntry[] }) {
  const debit = ledger.filter((entry) => entry.direction === 'DEBIT').reduce((sum, entry) => sum + entry.amount, 0);
  const credit = ledger.filter((entry) => entry.direction === 'CREDIT').reduce((sum, entry) => sum + entry.amount, 0);
  const balanced = debit === credit;
  return (
    <div className="recon">
      <StatCard label="Total debit" value={formatMoney(debit)} icon={Send} tone="amber" />
      <StatCard label="Total credit" value={formatMoney(credit)} icon={ReceiptText} tone="green" />
      <div className={cx('callout', balanced ? 'success' : 'danger')}>{balanced ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}{balanced ? 'Ledger balanced. Debit dan kredit sama.' : 'Ledger unbalanced. Perlu investigasi.'}</div>
    </div>
  );
}

function DeveloperDashboardPage(ctx: AppContext) {
  return (
    <div className="page-stack">
      <section className="stats-grid">
        <StatCard label="API clients" value="5 aktif" icon={KeyRound} tone="teal" />
        <StatCard label="Webhook endpoints" value="4 callback" icon={Webhook} tone="blue" />
        <StatCard label="Idempotency records" value={`${ctx.state.payments.length} key`} icon={RefreshCw} tone="green" />
        <StatCard label="Swagger" value="OpenAPI 3.x" icon={BookOpen} tone="amber" />
      </section>
      <section className="panel"><h2>Recent payment tests</h2><PaymentTable rows={ctx.state.payments} navigate={ctx.navigate} /></section>
    </div>
  );
}

function ApiClientsPage() {
  return <SimpleList title="API clients" rows={['client_pasarkita_001 - MARKETPLACE - ACTIVE', 'client_warungpos_001 - POS - ACTIVE', 'client_supplierhub_001 - SUPPLIER - ACTIVE']} />;
}

function IdempotencyPage(ctx: AppContext) {
  return <section className="panel"><h2>Idempotency inspector</h2><PaymentTable rows={ctx.state.payments} navigate={ctx.navigate} /></section>;
}

function WebhookEndpointsPage() {
  return <SimpleList title="Webhook endpoints" rows={['PASARKITA https://pasarkita.test/webhooks/smartbank', 'SUPPLIERHUB https://supplierhub.test/payment-callback', 'WARUNGPOS https://warungpos.test/hooks/payments']} />;
}

function WebhookTestPage(ctx: AppContext) {
  return (
    <section className="panel">
      <h2>Webhook test payload</h2>
      <pre className="code-block">{JSON.stringify({ event: 'PAYMENT_SUCCESS', paymentCode: ctx.state.payments[0]?.code, signature: 'server-side-only', sentAt: new Date().toISOString() }, null, 2)}</pre>
      <button className="button primary">Simulasi Payload</button>
    </section>
  );
}

function ApiDocsPage() {
  return (
    <section className="panel">
      <div className="panel-head"><h2>Swagger / OpenAPI</h2><a className="button secondary" href={swaggerUrl} target="_blank" rel="noreferrer">Buka Swagger</a></div>
      <iframe className="swagger-frame" src={swaggerUrl} title="Swagger API Documentation" />
    </section>
  );
}

function AnalyticsDashboardPage(ctx: AppContext) {
  const success = ctx.state.transactions.filter((tx) => tx.status === 'SUCCESS');
  return (
    <div className="page-stack">
      <section className="stats-grid">
        <StatCard label="GMV sukses" value={formatMoney(success.reduce((sum, tx) => sum + tx.amount, 0))} icon={BarChart3} tone="teal" />
        <StatCard label="Fee ekosistem" value={formatMoney(success.reduce((sum, tx) => sum + tx.fee, 0))} icon={SlidersHorizontal} tone="blue" />
        <StatCard label="Pajak" value={formatMoney(success.reduce((sum, tx) => sum + tx.tax, 0))} icon={Banknote} tone="green" />
        <StatCard label="Read-only" value="Aktif" icon={Lock} tone="amber" />
      </section>
      <SalesAnalyticsPage {...ctx} />
    </div>
  );
}

function SalesAnalyticsPage(ctx: AppContext) {
  const rows = ctx.state.transactions.map((tx) => ({ label: tx.channel, value: tx.amount }));
  const max = Math.max(...rows.map((row) => row.value));
  return (
    <section className="panel">
      <h2>Penjualan per channel</h2>
      <div className="bar-list">
        {rows.map((row, index) => <span key={`${row.label}-${index}`}><strong>{row.label}</strong><i style={{ width: `${Math.max(4, (row.value / max) * 100)}%` }} /><em>{formatMoney(row.value)}</em></span>)}
      </div>
    </section>
  );
}

function CashflowPage(ctx: AppContext) {
  return <section className="panel"><h2>Cashflow debit/kredit</h2><LedgerEntries rows={ctx.state.ledger} /></section>;
}

function FeeAnalyticsPage(ctx: AppContext) {
  return <section className="panel"><h2>Analitik fee</h2><FeeRulesTable rows={ctx.state.feeRules} /></section>;
}

function ReportsPage() {
  return <SimpleList title="Export report" rows={['sales_2026-05.csv', 'cashflow_2026-05.csv', 'fee_breakdown_2026-05.pdf']} />;
}

function SimpleList({ title, rows }: { title: string; rows: string[] }) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      <div className="simple-list">{rows.map((row) => <span key={row}>{row}</span>)}</div>
    </section>
  );
}
