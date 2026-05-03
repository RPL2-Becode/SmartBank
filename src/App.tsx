import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  Banknote,
  BarChart3,
  BellRing,
  BookOpen,
  Boxes,
  Briefcase,
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

type Role = 'CUSTOMER' | 'TELLER' | 'OPERATIONS' | 'MANAGER';
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
  CUSTOMER: 'Nasabah Individu',
  TELLER: 'Teller Cabang',
  OPERATIONS: 'Operasional Bank',
  MANAGER: 'Manajer / Approver',
};

const demoUsers: User[] = [
  { id: 'c-001', name: 'Raka Pratama', email: 'nasabah@smartbank.test', role: 'CUSTOMER', accountCode: 'ACC-CUST-001' },
  { id: 't-001', name: 'Maya Teller', email: 'teller@smartbank.test', role: 'TELLER', accountCode: 'ACC-TELLER-001' },
  { id: 'o-001', name: 'Dimas Operasional', email: 'ops@smartbank.test', role: 'OPERATIONS', accountCode: 'ACC-OPS-001' },
  { id: 'm-001', name: 'Nadia Manajer', email: 'manager@smartbank.test', role: 'MANAGER', accountCode: 'ACC-MGR-001' },
];

const now = new Date('2026-05-03T13:30:00+07:00');
const iso = (minutesAgo: number) => new Date(now.getTime() - minutesAgo * 60_000).toISOString();

const initialAccounts: Account[] = [
  { code: 'ACC-CUST-001', owner: 'Raka Pratama', role: 'CUSTOMER', balance: 15000000, token: 'tok_cust_7A91****', status: 'ACTIVE' },
  { code: 'ACC-TELLER-001', owner: 'Maya Teller', role: 'TELLER', balance: 0, token: 'tok_teller_44B0****', status: 'ACTIVE' },
  { code: 'ACC-OPS-001', owner: 'Dimas Operasional', role: 'OPERATIONS', balance: 0, token: 'tok_ops_19F2****', status: 'ACTIVE' },
  { code: 'ACC-MGR-001', owner: 'Nadia Manajer', role: 'MANAGER', balance: 0, token: 'tok_mgr_0031****', status: 'ACTIVE' },
  { code: 'ACC-RESERVE', owner: 'Bank Reserve', role: 'SYSTEM', balance: 980000000, token: 'system_reserve', status: 'ACTIVE' },
  { code: 'ACC-FEE', owner: 'Fee Collector', role: 'SYSTEM', balance: 2250000, token: 'system_fee', status: 'ACTIVE' },
  { code: 'ACC-TAX', owner: 'Tax Sink', role: 'SYSTEM', balance: 2000000, token: 'system_tax', status: 'ACTIVE' },
];

const initialTransactions: Transaction[] = [
  {
    code: 'TRX-20260503-0004',
    paymentCode: 'PAY-20260503-0004',
    from: 'ACC-CUST-001',
    to: 'ACC-RESERVE',
    amount: 1250000,
    fee: 2625,
    tax: 1500,
    status: 'SUCCESS',
    channel: 'MOBILE_TRANSFER',
    description: 'Transfer antar rekening SmartBank',
    createdAt: iso(35),
  },
  {
    code: 'TRX-20260503-0003',
    paymentCode: 'PAY-20260503-0003',
    from: 'ACC-CUST-001',
    to: 'ACC-FEE',
    amount: 2500000,
    fee: 3500,
    tax: 2000,
    status: 'PROCESSING',
    channel: 'BI_FAST',
    description: 'Transfer BI-Fast menunggu settlement',
    createdAt: iso(54),
  },
  {
    code: 'TRX-20260503-0002',
    from: 'ACC-CUST-001',
    to: 'ACC-TAX',
    amount: 750000,
    fee: 2500,
    tax: 0,
    status: 'SUCCESS',
    channel: 'VIRTUAL_ACCOUNT',
    description: 'Pembayaran virtual account',
    createdAt: iso(160),
  },
  {
    code: 'TRX-20260503-0001',
    from: 'ACC-CUST-001',
    to: 'ACC-RESERVE',
    amount: 450000,
    fee: 1575,
    tax: 900,
    status: 'FAILED',
    channel: 'CARDLESS_WITHDRAWAL',
    description: 'Tarik tunai tanpa kartu gagal',
    createdAt: iso(220),
  },
];

const initialLedger: LedgerEntry[] = [
  {
    id: 'LED-001',
    transactionCode: 'TRX-20260503-0004',
    accountCode: 'ACC-CUST-001',
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
    accountCode: 'ACC-RESERVE',
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
    debtor: 'ACC-CUST-001',
    creditor: 'ACC-RESERVE',
    baseAmount: 1250000,
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
    debtor: 'ACC-CUST-001',
    creditor: 'ACC-FEE',
    baseAmount: 2500000,
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

function DashboardMetric({
  label,
  value,
  hint,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: string;
  icon: LucideIcon;
}) {
  return (
    <div className={cx('ios-metric', tone)}>
      <div className="ios-metric-top">
        <span>{label}</span>
        <Icon size={18} />
      </div>
      <strong>{value}</strong>
      <p>{hint}</p>
    </div>
  );
}

function DashboardAction({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button className="ios-action" onClick={onClick}>
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );
}

function FinanceLineChart() {
  const points = '0,118 42,112 84,128 126,96 168,88 210,110 252,118 294,104 336,112 378,92 420,118 462,106 504,116 546,88 588,96 630,78';
  return (
    <div className="finance-chart" aria-label="Grafik saldo enam bulan">
      <svg viewBox="0 0 640 170" role="img">
        <defs>
          <linearGradient id="balanceFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#ff7a2f" stopOpacity="0.62" />
            <stop offset="100%" stopColor="#0f0b08" stopOpacity="0.04" />
          </linearGradient>
        </defs>
        <path d={`M0,170 L${points} L640,170 Z`} fill="url(#balanceFill)" />
        <polyline points={points} fill="none" stroke="#ffb37d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="462" cy="106" r="5" fill="#ffffff" />
      </svg>
      <div className="chart-tooltip">
        <strong>09 Dec, 2026</strong>
        <span>SC9.780.900</span>
      </div>
      <div className="chart-axis">
        <span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span><span>Jan</span><span>Feb</span>
      </div>
    </div>
  );
}

function FinanceBars() {
  const bars = [38, 52, 56, 78, 48];
  return (
    <div className="finance-bars">
      {bars.map((height, index) => (
        <span key={index}>
          <i style={{ height: `${height}%` }} />
          <em>{['Sep', 'Oct', 'Nov', 'Jan', 'Feb'][index]}</em>
        </span>
      ))}
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
  { path: '/', label: 'Login', section: 'Public', icon: LogIn, public: true, render: (ctx) => <LoginPage {...ctx} /> },
  { path: '/auth/login', label: 'Login', section: 'Public', icon: LogIn, public: true, render: (ctx) => <LoginPage {...ctx} /> },
  { path: '/auth/register', label: 'Register', section: 'Public', icon: Users, public: true, render: (ctx) => <RegisterPage {...ctx} /> },
  { path: '/403', label: 'Unauthorized', section: 'Public', icon: Lock, public: true, detail: true, render: (ctx) => <UnauthorizedPage {...ctx} /> },
  { path: '/404', label: 'Not Found', section: 'Public', icon: AlertTriangle, public: true, detail: true, render: (ctx) => <NotFoundPage {...ctx} /> },
  { path: '/dashboard', label: 'Dashboard', section: 'Banking', icon: Gauge, roles: ['CUSTOMER', 'TELLER', 'OPERATIONS', 'MANAGER'], render: (ctx) => <BentoDashboardPage {...ctx} /> },
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
    if (!stored) return null;
    const parsed = JSON.parse(stored) as User;
    return parsed.role in roleLabels ? parsed : null;
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
  const isAuthScreen = !user && (route.path === '/' || route.path.startsWith('/auth'));
  const hasEmbeddedDashboardChrome = Boolean(user && route.path === '/dashboard');

  return (
    <div className={cx('app', isAuthScreen && 'auth-app', hasEmbeddedDashboardChrome && 'dashboard-shell')}>
      {user && visibleRoutes.length > 1 && (
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
        {!isAuthScreen && !hasEmbeddedDashboardChrome && <header className="topbar">
          <button className="icon-button mobile-only" aria-label="Buka menu" onClick={() => setMobileNav(true)}><Menu size={20} /></button>
          <div>
            <p className="eyebrow">{route.section}</p>
            <h1>{route.label}</h1>
          </div>
          <div className="topbar-actions">
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
        </header>}
        {mobileNav && <button className="nav-backdrop" aria-label="Tutup menu" onClick={() => setMobileNav(false)}><X size={24} /></button>}
        <main>{page}</main>
      </div>
    </div>
  );
}

function defaultPathForRole(role: Role) {
  return {
    CUSTOMER: '/dashboard',
    TELLER: '/dashboard',
    OPERATIONS: '/dashboard',
    MANAGER: '/dashboard',
  }[role];
}

function LoginPage({ setUser, navigate }: AppContext) {
  const [role, setRole] = useState<Role>('CUSTOMER');
  const [email, setEmail] = useState(demoUsers.find((demo) => demo.role === 'CUSTOMER')!.email);
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
    <div className="auth-shell auth-card-only">
      <section className="auth-card auth-card-modern">
        <form className="form-panel auth-form" onSubmit={submit}>
          <div>
            <p className="eyebrow">SmartBank Secure Access</p>
            <h2>Masuk ke Dashboard</h2>
            <p className="muted">Pilih role demo, lalu masuk untuk melihat tampilan bank sesuai akses.</p>
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
          <button className="button primary" type="submit"><ShieldCheck size={17} /> Masuk Aman</button>
          <div className="auth-card-note">
            <span><Lock size={16} /> Demo frontend</span>
            <span>Password: <strong>demo-smartbank</strong></span>
          </div>
          <p className="auth-switch">Belum terdaftar? <button className="link-button" onClick={() => navigate('/auth/register')} type="button">Buat akses baru</button></p>
        </form>
      </section>
    </div>
  );
}

function RegisterPage({ setUser, setState, navigate }: AppContext) {
  const [name, setName] = useState('Nasabah Baru');
  const [email, setEmail] = useState('nasabah.baru@smartbank.test');
  const [password, setPassword] = useState('demo-smartbank');
  const [confirmPassword, setConfirmPassword] = useState('demo-smartbank');
  const [role, setRole] = useState<Role>('CUSTOMER');
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
          balance: role === 'CUSTOMER' ? 5000000 : 0,
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
    <div className="auth-shell auth-card-only">
      <section className="auth-card auth-card-modern register-card">
        <form className="form-panel auth-form" onSubmit={submit}>
          <div>
            <p className="eyebrow">Pembukaan Akses</p>
            <h2>Registrasi Akun</h2>
            <p className="muted">Buat akses demo untuk nasabah, teller, operasional, atau approver.</p>
          </div>
          <label>Nama lengkap<input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label>Email<input autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label>Role akun
            <select value={role} onChange={(event) => setRole(event.target.value as Role)}>
              <option value="CUSTOMER">Nasabah Individu</option>
              <option value="TELLER">Teller Cabang</option>
              <option value="OPERATIONS">Operasional Bank</option>
              <option value="MANAGER">Manajer / Approver</option>
            </select>
          </label>
          <div className="two-col">
            <label>Password<input autoComplete="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
            <label>Konfirmasi<input autoComplete="new-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>
          </div>
          <label className="check-row">
            <input checked={accepted} onChange={(event) => setAccepted(event.target.checked)} type="checkbox" />
            <span>Saya memahami validasi transaksi final tetap dilakukan oleh sistem backend bank.</span>
          </label>
          <div className="callout"><WalletCards size={18} /> Nasabah demo menerima saldo awal SC5.000.000. Role internal dibuat sebagai akses operasional tanpa saldo pribadi.</div>
          {error && <div className="callout danger"><AlertTriangle size={18} /> {error}</div>}
          <button className="button primary" type="submit"><Users size={17} /> Buat Akses</button>
          <p className="auth-switch">Sudah punya akses? <button className="link-button" onClick={() => navigate('/auth/login')} type="button">Login</button></p>
        </form>
      </section>
    </div>
  );
}

function AuthSidePanel({ selected }: { selected: User }) {
  return (
    <section className="auth-info panel">
      <h3>Akses simulasi</h3>
      <div className="detail-list">
        <span>Email <strong>{selected.email}</strong></span>
        <span>Password <strong>demo-smartbank</strong></span>
        <span>Redirect <strong>{defaultPathForRole(selected.role)}</strong></span>
      </div>
      <div className="callout warning"><Lock size={18} /> Frontend hanya menampilkan pengalaman. Otorisasi final tetap berada di backend.</div>
      <p className="muted">Untuk produksi, form ini dapat diarahkan ke `POST /auth/login`, lalu profil user diambil dari `GET /auth/me`.</p>
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

function BentoDashboardPage(ctx: AppContext) {
  const account = currentAccount(ctx)!;
  const transactions = userTransactions(ctx);
  const pending = transactions.filter((tx) => tx.status === 'PENDING' || tx.status === 'PROCESSING').length;
  const [activeSection, setActiveSection] = useState('overview');
  const role = ctx.user!.role;
  const profile = {
    CUSTOMER: {
      headline: 'Total saldo',
      amount: formatMoney(account.balance),
      delta: '+ 2,92%',
      roleNote: 'Personal banking',
      cardName: 'SmartBank Platinum',
      cardBalance: formatMoney(12850000),
      focus: 'Kontrol saldo dan transaksi harian nasabah.',
      sidebarMetric: formatMoney(account.balance),
      health: 'Akun aktif',
      nextReview: 'Limit harian tersisa 82%',
      metrics: [
        { label: 'Mutasi bulan ini', value: `${transactions.length}`, tone: 'blue' },
        { label: 'Transaksi berjalan', value: `${pending}`, tone: 'amber' },
        { label: 'Limit tersedia', value: formatMoney(3500000), tone: 'green' },
      ],
      actions: ['Transfer', 'Bayar tagihan', 'e-Statement'],
    },
    TELLER: {
      headline: 'Volume counter',
      amount: '32 transaksi',
      delta: '+ 8,10%',
      roleNote: 'Branch service',
      cardName: 'Teller Workbench',
      cardBalance: formatMoney(18400000),
      focus: 'Ringkasan layanan cabang dan transaksi loket.',
      sidebarMetric: '32 tiket',
      health: 'Counter normal',
      nextReview: '3 validasi identitas',
      metrics: [
        { label: 'Antrian aktif', value: '12', tone: 'blue' },
        { label: 'Setoran hari ini', value: formatMoney(18400000), tone: 'green' },
        { label: 'Butuh validasi', value: '3', tone: 'amber' },
      ],
      actions: ['Setoran', 'Tarik tunai', 'Verifikasi'],
    },
    OPERATIONS: {
      headline: 'Rasio settlement',
      amount: '98,7%',
      delta: '+ 1,52%',
      roleNote: 'Operations control',
      cardName: 'Settlement Desk',
      cardBalance: formatMoney(245000000),
      focus: 'Kontrol batch, exception, dan settlement bank.',
      sidebarMetric: '147 batch',
      health: 'SLA aman',
      nextReview: '5 exception terbuka',
      metrics: [
        { label: 'Batch selesai', value: '147', tone: 'green' },
        { label: 'Exception', value: '5', tone: 'amber' },
        { label: 'Rata-rata SLA', value: '14m', tone: 'blue' },
      ],
      actions: ['Rekonsiliasi', 'Exception', 'Audit trail'],
    },
    MANAGER: {
      headline: 'Posisi reserve',
      amount: formatMoney(980000000),
      delta: '+ 3,52%',
      roleNote: 'Approval & risk',
      cardName: 'Executive Card',
      cardBalance: formatMoney(245000000),
      focus: 'Ringkasan approval, reserve, dan risiko operasional.',
      sidebarMetric: formatMoney(980000000),
      health: 'Risiko rendah',
      nextReview: '8 approval pending',
      metrics: [
        { label: 'Approval', value: '8', tone: 'amber' },
        { label: 'Risk score', value: 'Low', tone: 'green' },
        { label: 'Volume harian', value: formatMoney(245000000), tone: 'blue' },
      ],
      actions: ['Approve', 'Risk review', 'Laporan'],
    },
  }[role];
  const navItems = [
    { id: 'overview', label: 'Overview', hint: profile.health, icon: Home },
    { id: 'accounts', label: 'Rekening', hint: profile.sidebarMetric, icon: WalletCards },
    { id: 'activity', label: 'Transaksi', hint: `${transactions.length || initialTransactions.length} aktivitas`, icon: ReceiptText },
    { id: 'cards', label: 'Kartu', hint: profile.cardName, icon: CreditCard },
    { id: 'insight', label: 'Insight', hint: profile.nextReview, icon: BarChart3 },
    { id: 'security', label: 'Kontrol', hint: 'Backend trusted', icon: ShieldCheck },
  ];
  const transactionRows = (transactions.length ? transactions : initialTransactions).slice(0, 4);
  const actionIcons = [Send, ReceiptText, BadgeCheck];
  const jumpTo = (id: string) => {
    setActiveSection(id);
    const target = document.getElementById(`finance-${id}`);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <div className="finance-app bento-dashboard">
      <aside className="finance-sidebar" aria-label="Navigasi dashboard">
        <button className="finance-brand-button" type="button" onClick={() => jumpTo('overview')}>
          <span className="rail-logo"><Landmark size={24} /></span>
          <span>
            <strong>SmartBank</strong>
            <small>{roleLabels[role]}</small>
          </span>
        </button>
        <nav className="finance-nav" aria-label="Section dashboard">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                aria-current={activeSection === item.id ? 'page' : undefined}
                className={cx('finance-nav-item', activeSection === item.id && 'active')}
                key={item.id}
                onClick={() => jumpTo(item.id)}
                type="button"
              >
                <Icon size={19} />
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.hint}</small>
                </span>
              </button>
            );
          })}
        </nav>
        <div className="sidebar-status-card">
          <span>Status role</span>
          <strong>{profile.health}</strong>
          <small>{profile.nextReview}</small>
        </div>
        <button className="sidebar-logout" type="button" onClick={() => { ctx.setUser(null); ctx.navigate('/auth/login'); }}>
          <LogOut size={18} />
          Keluar
        </button>
      </aside>

      <section className="finance-main">
        <header className="finance-topbar bento-topbar">
          <label className="finance-search">
            <Search size={18} />
            <input placeholder="Cari transaksi, kartu, atau laporan" aria-label="Cari dashboard" />
          </label>
          <div className="finance-shortcut">Ctrl K</div>
          <div className="finance-user">
            <button className="finance-icon" aria-label="Refresh"><RefreshCw size={18} /></button>
            <button className="finance-icon" aria-label="Notifikasi"><BellRing size={18} /></button>
            <div className="finance-avatar">{ctx.user!.name.slice(0, 1)}</div>
            <div>
              <strong>{ctx.user!.name}</strong>
              <span>{profile.roleNote}</span>
            </div>
          </div>
        </header>

        <div className="bento-grid">
          <section className="bento-card bento-hero" id="finance-overview">
            <div className="bento-card-head">
              <div>
                <p className="bento-kicker">{profile.headline}</p>
                <h2>{profile.amount}</h2>
                <span className="positive-chip">{profile.delta} hari ini</span>
              </div>
              <div className="period-tabs">
                <button type="button">1 tahun</button>
                <button className="active" type="button">6 bulan</button>
                <button type="button">3 bulan</button>
                <button type="button">1 bulan</button>
              </div>
            </div>
            <p>{profile.focus}</p>
            <FinanceLineChart />
          </section>

          <section className="bento-card bento-account" id="finance-accounts">
            <div className="bento-card-head compact">
              <p className="bento-kicker">Rekening utama</p>
              <WalletCards size={20} />
            </div>
            <strong>{account.code}</strong>
            <span>{account.owner}</span>
            <div className="account-state">
              <small>Status</small>
              <StatusBadge status="SUCCESS" />
            </div>
          </section>

          <section className="bento-card bento-card-preview" id="finance-cards">
            <div className="bento-card-head compact">
              <p className="bento-kicker">Kartu aktif</p>
              <button type="button">Kelola</button>
            </div>
            <div className="bank-card-preview">
              <span>VISA</span>
              <i />
              <p>{profile.cardName}</p>
              <strong>{profile.cardBalance}</strong>
            </div>
          </section>

          <section className="bento-card bento-metrics" id="finance-insight">
            <div className="bento-card-head compact">
              <p className="bento-kicker">Insight role</p>
              <BarChart3 size={20} />
            </div>
            <div className="metric-stack">
              {profile.metrics.map((metric) => (
                <div className={cx('metric-pill', metric.tone)} key={metric.label}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="bento-card bento-actions">
            <div className="bento-card-head compact">
              <p className="bento-kicker">Aksi cepat</p>
              <SlidersHorizontal size={20} />
            </div>
            <div className="bento-action-list">
              {profile.actions.map((action, index) => {
                const Icon = actionIcons[index] || FileText;
                return (
                  <button key={action} type="button">
                    <Icon size={18} />
                    <span>{action}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="bento-card bento-activity" id="finance-activity">
            <div className="bento-card-head compact">
              <div>
                <p className="bento-kicker">Transaksi terbaru</p>
                <h3>Aktivitas rekening</h3>
              </div>
              <button type="button">Lihat semua</button>
            </div>
            <div className="activity-list">
              {transactionRows.map((tx) => (
                <div className="activity-row" key={tx.code}>
                  <span><ReceiptText size={18} /></span>
                  <div>
                    <strong>{tx.description}</strong>
                    <small>{tx.channel} - {formatDate(tx.createdAt)}</small>
                  </div>
                  <div>
                    <strong>{formatMoney(tx.amount)}</strong>
                    <StatusBadge status={tx.status} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bento-card bento-chart">
            <div className="bento-card-head compact">
              <div>
                <p className="bento-kicker">Investasi</p>
                <h3>{formatMoney(3200000)} <span>+1,52%</span></h3>
              </div>
              <button type="button">Bulanan</button>
            </div>
            <FinanceBars />
          </section>

          <section className="bento-card bento-security" id="finance-security">
            <div className="bento-card-head compact">
              <p className="bento-kicker">Kontrol sistem</p>
              <ShieldCheck size={20} />
            </div>
            <div className="control-flow">
              <span>Frontend UI</span>
              <span>Core banking</span>
              <span>Ledger</span>
              <span>Receipt</span>
            </div>
            <p>UI hanya menampilkan pengalaman. Validasi otorisasi, limit, saldo, dan ledger final tetap berada di backend bank.</p>
          </section>
        </div>
      </section>
    </div>
  );
}

function BankDashboardPage(ctx: AppContext) {
  const account = currentAccount(ctx)!;
  const transactions = userTransactions(ctx);
  const pending = transactions.filter((tx) => tx.status === 'PENDING' || tx.status === 'PROCESSING').length;
  const role = ctx.user!.role;
  const profile = {
    CUSTOMER: {
      headline: 'Total saldo',
      amount: formatMoney(account.balance),
      delta: '+ 2,92%',
      roleNote: 'Personal banking',
      cardName: 'SmartBank Platinum',
      cardBalance: formatMoney(12850000),
    },
    TELLER: {
      headline: 'Volume counter',
      amount: '32 transaksi',
      delta: '+ 8,10%',
      roleNote: 'Branch service',
      cardName: 'Teller Workbench',
      cardBalance: formatMoney(18400000),
    },
    OPERATIONS: {
      headline: 'Rasio settlement',
      amount: '98,7%',
      delta: '+ 1,52%',
      roleNote: 'Operations control',
      cardName: 'Settlement Desk',
      cardBalance: formatMoney(245000000),
    },
    MANAGER: {
      headline: 'Posisi reserve',
      amount: formatMoney(980000000),
      delta: '+ 3,52%',
      roleNote: 'Approval & risk',
      cardName: 'Executive Card',
      cardBalance: formatMoney(245000000),
    },
  }[role];
  const recentRows = [
    { name: 'Lucas Bennett', desc: 'Transfer masuk', amount: '+SC25.000', tone: 'positive', icon: Users },
    { name: 'Google Workspace', desc: 'Autodebit bulanan', amount: '-SC5.000', tone: 'negative', icon: Boxes },
    { name: 'Kartu Debit', desc: 'Pembayaran merchant', amount: '-SC55.000', tone: 'negative', icon: CreditCard },
  ];
  return (
    <div className="finance-app">
      <aside className="finance-rail" aria-label="Navigasi utama">
        <div className="rail-logo"><Landmark size={24} /></div>
        {[Home, BarChart3, WalletCards, ReceiptText, CreditCard, BriefcaseIcon, FileText].map((Icon, index) => (
          <button className={cx('rail-button', index === 0 && 'active')} key={index} aria-label={`Menu ${index + 1}`}>
            <Icon size={19} />
          </button>
        ))}
        <button className="rail-button rail-bottom" aria-label="Keluar" onClick={() => { ctx.setUser(null); ctx.navigate('/auth/login'); }}>
          <LogOut size={19} />
        </button>
      </aside>
      <section className="finance-main">
        <header className="finance-topbar">
          <label className="finance-search">
            <Search size={18} />
            <input placeholder="Cari" aria-label="Cari dashboard" />
          </label>
          <div className="finance-shortcut">⌘ + Space</div>
          <div className="finance-user">
            <button className="finance-icon" aria-label="Refresh"><RefreshCw size={18} /></button>
            <button className="finance-icon" aria-label="Notifications"><BellRing size={18} /></button>
            <div className="finance-avatar">{ctx.user!.name.slice(0, 1)}</div>
            <div>
              <strong>{ctx.user!.name}</strong>
              <span>{roleLabels[role]}</span>
            </div>
          </div>
        </header>
        <div className="finance-content-grid">
          <section className="balance-panel-card">
            <div className="finance-section-head">
              <div>
                <p>{profile.headline}</p>
                <h2>{profile.amount} <span>{profile.delta}</span></h2>
              </div>
              <div className="period-tabs">
                <button>1 tahun</button>
                <button className="active">6 bulan</button>
                <button>3 bulan</button>
                <button>1 bulan</button>
              </div>
            </div>
            <FinanceLineChart />
          </section>
          <aside className="cards-panel">
            <div className="finance-section-head compact">
              <h3>Kartu saya</h3>
              <button>+ Kartu baru</button>
            </div>
            <div className="card-stack">
              <div className="mini-card one"><span>VISA</span><strong>{formatMoney(6150000)}</strong></div>
              <div className="mini-card two"><span>MC</span><strong>{formatMoney(3140000)}</strong></div>
              <div className="main-card">
                <span>VISA</span>
                <i />
                <p>Balance</p>
                <strong>{profile.cardBalance}</strong>
                <em>{profile.delta}</em>
              </div>
            </div>
            <div className="card-actions">
              <button>Ajukan</button>
              <button className="primary">Transfer</button>
            </div>
            <div className="recent-panel">
              <div className="finance-section-head compact">
                <h3>Transaksi terbaru</h3>
                <button>Lihat semua</button>
              </div>
              {recentRows.map((row) => {
                const Icon = row.icon;
                return (
                  <div className="recent-row" key={row.name}>
                    <span><Icon size={20} /></span>
                    <div>
                      <strong>{row.name}</strong>
                      <small>{row.desc}</small>
                    </div>
                    <em className={row.tone}>{row.amount}</em>
                  </div>
                );
              })}
            </div>
          </aside>
          <section className="join-card">
            <h3>Layanan prioritas untuk nasabah aktif</h3>
            <p>Akses aman, cepat, dan dirancang untuk kebutuhan finansial modern.</p>
            <div className="avatar-row"><span>AR</span><span>MK</span><span>NV</span><button>+</button></div>
            <button>Ajukan</button>
          </section>
          <section className="investment-card">
            <div className="finance-section-head compact">
              <div>
                <h3>Investasi</h3>
                <strong>{formatMoney(3200000)} <span>+1,52%</span></strong>
              </div>
              <button>Bulanan</button>
            </div>
            <FinanceBars />
          </section>
        </div>
      </section>
    </div>
  );
}

function BriefcaseIcon({ size = 19 }: { size?: number }) {
  return <Briefcase size={size} />;
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
          <span>Core banking service</span>
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
  const [debtor, setDebtor] = useState(ctx.user?.role === 'CUSTOMER' ? ctx.user.accountCode : 'ACC-CUST-001');
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
  const pending = incoming.filter((tx) => tx.status === 'PENDING' || tx.status === 'PROCESSING').length;
  return (
    <div className="ios-dashboard">
      <section className="ios-balance-card merchant">
        <div>
          <p className="eyebrow">Pemasukan merchant</p>
          <h2>{formatMoney(settled)}</h2>
          <span>{incoming.length} pembayaran masuk bulan ini</span>
        </div>
        <Building2 size={44} />
      </section>
      <section className="ios-metric-grid">
        <DashboardMetric label="Pending" value={`${pending}`} hint="menunggu settlement" icon={Activity} tone="amber" />
        <DashboardMetric label="QR aktif" value="3" hint="siap menerima bayar" icon={QrCode} tone="green" />
        <DashboardMetric label="Fee" value={formatMoney(12875)} hint="potongan bulan ini" icon={SlidersHorizontal} tone="blue" />
      </section>
      <section className="ios-strip">
        <DashboardAction icon={ReceiptText} label="Incoming" onClick={() => ctx.navigate('/merchant/payments')} />
        <DashboardAction icon={QrCode} label="Buat QR" onClick={() => ctx.navigate('/merchant/smartqr/create')} />
        <DashboardAction icon={ClipboardCheck} label="Settlement" onClick={() => ctx.navigate('/merchant/settlements')} />
      </section>
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
  const webhookIssues = ctx.state.webhooks.filter((w) => w.status !== 'DELIVERED').length;
  const debit = ctx.state.ledger.filter((entry) => entry.direction === 'DEBIT').reduce((sum, entry) => sum + entry.amount, 0);
  const credit = ctx.state.ledger.filter((entry) => entry.direction === 'CREDIT').reduce((sum, entry) => sum + entry.amount, 0);
  return (
    <div className="ios-dashboard">
      <section className="ios-balance-card admin">
        <div>
          <p className="eyebrow">System health</p>
          <h2>{debit === credit ? 'Balanced' : 'Review'}</h2>
          <span>Debit {formatMoney(debit)} / Credit {formatMoney(credit)}</span>
        </div>
        <ShieldCheck size={44} />
      </section>
      <section className="ios-metric-grid">
        <DashboardMetric label="Supply" value={formatMoney(supply)} hint="total uang tercatat" icon={Banknote} tone="teal" />
        <DashboardMetric label="Success" value={`${successRate}%`} hint="rasio transaksi sukses" icon={BadgeCheck} tone="green" />
        <DashboardMetric label="Webhook" value={`${webhookIssues}`} hint="event perlu perhatian" icon={Webhook} tone={webhookIssues ? 'amber' : 'green'} />
      </section>
      <section className="ios-strip">
        <DashboardAction icon={BookOpen} label="Ledger" onClick={() => ctx.navigate('/admin/ledger')} />
        <DashboardAction icon={Webhook} label="Webhook" onClick={() => ctx.navigate('/admin/webhooks')} />
        <DashboardAction icon={ClipboardCheck} label="Reconcile" onClick={() => ctx.navigate('/admin/reconciliation')} />
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
    <div className="ios-dashboard">
      <section className="ios-balance-card developer">
        <div>
          <p className="eyebrow">Developer console</p>
          <h2>OpenAPI 3.x</h2>
          <span>{ctx.state.payments.length} idempotency record tersedia</span>
        </div>
        <Code2 size={44} />
      </section>
      <section className="ios-metric-grid">
        <DashboardMetric label="Clients" value="5" hint="aplikasi aktif" icon={KeyRound} tone="teal" />
        <DashboardMetric label="Webhook" value="4" hint="callback endpoint" icon={Webhook} tone="blue" />
        <DashboardMetric label="Tests" value={`${ctx.state.payments.length}`} hint="payment request demo" icon={RefreshCw} tone="green" />
      </section>
      <section className="ios-strip">
        <DashboardAction icon={FileCode2} label="Test Pay" onClick={() => ctx.navigate('/developer/test-payment')} />
        <DashboardAction icon={RefreshCw} label="Idempotency" onClick={() => ctx.navigate('/developer/idempotency')} />
        <DashboardAction icon={BookOpen} label="Swagger" onClick={() => ctx.navigate('/developer/api-docs')} />
      </section>
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
  const gmv = success.reduce((sum, tx) => sum + tx.amount, 0);
  const fee = success.reduce((sum, tx) => sum + tx.fee, 0);
  const tax = success.reduce((sum, tx) => sum + tx.tax, 0);
  return (
    <div className="ios-dashboard">
      <section className="ios-balance-card analytics">
        <div>
          <p className="eyebrow">UMKM Insight</p>
          <h2>{formatMoney(gmv)}</h2>
          <span>GMV transaksi sukses, mode read-only</span>
        </div>
        <BarChart3 size={44} />
      </section>
      <section className="ios-metric-grid">
        <DashboardMetric label="Fee" value={formatMoney(fee)} hint="pendapatan ekosistem" icon={SlidersHorizontal} tone="blue" />
        <DashboardMetric label="Pajak" value={formatMoney(tax)} hint="tax sink tercatat" icon={Banknote} tone="green" />
        <DashboardMetric label="Akses" value="Read-only" hint="tanpa mutasi saldo" icon={Lock} tone="amber" />
      </section>
      <section className="ios-strip">
        <DashboardAction icon={LineChart} label="Sales" onClick={() => ctx.navigate('/analytics/sales')} />
        <DashboardAction icon={Activity} label="Cashflow" onClick={() => ctx.navigate('/analytics/cashflow')} />
        <DashboardAction icon={FileText} label="Reports" onClick={() => ctx.navigate('/analytics/reports')} />
      </section>
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
