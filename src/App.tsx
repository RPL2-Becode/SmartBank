import {
  Activity,
  AlertTriangle,
  Banknote,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Code2,
  CreditCard,
  Database,
  FileCode2,
  FileText,
  Gauge,
  History,
  Home,
  KeyRound,
  Landmark,
  Layers3,
  LineChart,
  LockKeyhole,
  LogIn,
  Menu,
  QrCode,
  ReceiptText,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  WalletCards,
  Webhook,
  X,
} from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  BalanceCard,
  Button,
  CodeBlock,
  ConfirmationModal,
  CopyButton,
  DataTable,
  EmptyState,
  EnvironmentBadge,
  ErrorState,
  FeeBreakdownCard,
  FilterBar,
  LedgerEntriesTable,
  MiniBarChart,
  MoneyText,
  PageHeader,
  QRCard,
  ReceiptCard,
  ReviewPanel,
  SearchInput,
  SmartLogo,
  StatCard,
  StatusBadge,
  Timeline,
} from './components/design-system';
import {
  accounts,
  auditLogs,
  currentUser,
  developerApplications,
  feeRules,
  idempotencyRecords,
  ledgerEntries,
  loans,
  mandates,
  paymentTimeline,
  payments,
  reconciliationMismatches,
  transactions,
  webhookDeliveries,
} from './data/mockData';
import { login as loginApi, register as registerApi } from './lib/api/auth';
import { formatDate, formatDateTime, formatMoney, maskMiddle } from './lib/format';
import { buildCanonicalString, createSignaturePlaceholder, generateIdempotencyKey } from './lib/security';
import type { Account, FeeRule, Mandate, PaymentRequest, Role, Status, WebhookDelivery } from './types';

type Navigate = (path: string) => void;

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: Home },
  { label: 'Accounts', path: '/accounts', icon: WalletCards },
  { label: 'Payments', path: '/payments', icon: CreditCard },
  { label: 'Transfers', path: '/transfers/new', icon: Send },
  { label: 'SmartQR', path: '/smartqr', icon: QrCode },
  { label: 'Loans', path: '/loans', icon: Banknote },
  { label: 'Mandates', path: '/mandates', icon: CalendarClock },
  { label: 'Ledger', path: '/ledger', icon: Database },
  { label: 'Webhooks', path: '/webhooks', icon: Webhook },
  { label: 'Audit Logs', path: '/audit-logs', icon: History },
  { label: 'Admin', path: '/admin', icon: Landmark },
  { label: 'Developer', path: '/developer', icon: Code2 },
  { label: 'API Docs', path: '/developer/swagger', icon: BookOpen },
  { label: 'Settings', path: '/settings', icon: Settings },
];

const mobileNavItems = navItems.slice(0, 5);

export default function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate: Navigate = (target) => {
    window.history.pushState(null, '', target);
    setPath(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (path === '/' || path === '/login') {
    return <LoginPage navigate={navigate} />;
  }

  if (path === '/register') {
    return <RegisterPage navigate={navigate} />;
  }

  return (
    <AppShell path={path} navigate={navigate}>
      {renderRoute(path, navigate)}
    </AppShell>
  );
}

function renderRoute(path: string, navigate: Navigate) {
  if (path.startsWith('/payments/')) {
    return <PaymentDetailPage paymentCode={decodeURIComponent(path.split('/payments/')[1])} />;
  }

  switch (path) {
    case '/dashboard':
      return <DashboardPage navigate={navigate} />;
    case '/accounts':
      return <AccountsPage navigate={navigate} />;
    case '/accounts/statement':
      return <StatementPage />;
    case '/payments':
      return <PaymentsPage navigate={navigate} />;
    case '/transfers/new':
      return <TransferFlowPage />;
    case '/smartqr':
    case '/smartqr/generate':
      return <SmartQRPage initialMode={path === '/smartqr/generate' ? 'generate' : 'scan'} />;
    case '/loans':
      return <LoansPage />;
    case '/mandates':
      return <MandatesPage />;
    case '/ledger':
      return <LedgerPage />;
    case '/webhooks':
      return <WebhooksPage />;
    case '/audit-logs':
      return <AuditLogsPage />;
    case '/admin':
      return <AdminDashboardPage navigate={navigate} />;
    case '/admin/accounts':
      return <AdminAccountsPage />;
    case '/admin/fee-rules':
      return <FeeRulesPage />;
    case '/admin/money-supply':
      return <MoneySupplyPage />;
    case '/admin/reconciliation':
      return <ReconciliationPage />;
    case '/developer':
      return <DeveloperOverviewPage navigate={navigate} />;
    case '/developer/applications':
    case '/developer/api-keys':
      return <DeveloperApplicationsPage />;
    case '/developer/webhooks':
      return <DeveloperWebhooksPage />;
    case '/developer/idempotency-logs':
      return <IdempotencyLogsPage />;
    case '/developer/signature-tester':
      return <SignatureTesterPage />;
    case '/developer/swagger':
      return <SwaggerPage />;
    case '/settings':
      return <SettingsPage />;
    default:
      return <DashboardPage navigate={navigate} />;
  }
}

function AppShell({ path, navigate, children }: { path: string; navigate: Navigate; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const go = (target: string) => {
    navigate(target);
    setOpen(false);
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? 'is-open' : ''}`} aria-label="Primary navigation">
        <div className="sidebar-top">
          <SmartLogo />
          <button className="icon-button desktop-hidden" aria-label="Close navigation" type="button" onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>
        <nav>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = path === item.path || (item.path !== '/dashboard' && path.startsWith(item.path));
            return (
              <a
                key={item.path}
                href={item.path}
                className={active ? 'active' : ''}
                onClick={(event) => {
                  event.preventDefault();
                  go(item.path);
                }}
              >
                <Icon size={18} aria-hidden="true" />
                {item.label}
              </a>
            );
          })}
        </nav>
      </aside>

      <div className="shell-main">
        <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="Open navigation" type="button" onClick={() => setOpen(true)}>
            <Menu size={20} />
          </button>
          <label className="topbar-search">
            <Search size={16} aria-hidden="true" />
            <span className="sr-only">Search SmartBank</span>
            <input placeholder="Search payments, ledger, clients" />
          </label>
          <div className="topbar-actions">
            <EnvironmentBadge />
            <button className="icon-button" aria-label="Notifications" type="button">
              <Bell size={18} />
            </button>
            <button className="profile-button" type="button" aria-label="Profile menu">
              <span>AP</span>
              <strong>{currentUser.name}</strong>
            </button>
          </div>
        </header>

        <main>{children}</main>

        <nav className="bottom-nav" aria-label="Mobile quick navigation">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const active = path === item.path || path.startsWith(item.path);
            return (
              <a
                key={item.path}
                href={item.path}
                className={active ? 'active' : ''}
                onClick={(event) => {
                  event.preventDefault();
                  go(item.path);
                }}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

function LoginPage({ navigate }: { navigate: Navigate }) {
  const [userId, setUserId] = useState('alya_smartbank');
  const [password, setPassword] = useState('SmartBank123');
  const [error, setError] = useState('');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    void loginApi(userId, password)
      .then(() => navigate('/dashboard'))
      .catch(() => setError('Invalid token or credentials. Use a registered SmartBank user ID.'));
  };

  return (
    <main className="auth-screen">
      <section className="auth-panel">
        <SmartLogo />
        <h1>Secure banking access</h1>
        <p>Sign in to SmartBank retail, merchant, admin, and developer services.</p>
        <form onSubmit={submit} className="form-stack">
          <label className="field">
            <span>User ID</span>
            <input value={userId} onChange={(event) => setUserId(event.target.value)} autoComplete="username" required maxLength={50} />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {error ? <ErrorState title="Login failed" description={error} /> : null}
          <Button type="submit" variant="primary">
            <LogIn size={17} aria-hidden="true" />
            Login
          </Button>
        </form>
        <button className="link-button" type="button" onClick={() => navigate('/register')}>
          Register a new SmartBank account
        </button>
      </section>
      <aside className="auth-security">
        <LockKeyhole size={28} aria-hidden="true" />
        <h2>Security notice</h2>
        <p>
          SmartBank uses JWT bearer sessions and signed inter-application requests. API secrets are never displayed repeatedly or
          stored in browser local storage.
        </p>
        <div className="demo-credentials">
          <strong>Development credentials</strong>
          <code>alya_smartbank</code>
          <code>SmartBank123</code>
        </div>
      </aside>
    </main>
  );
}

function RegisterPage({ navigate }: { navigate: Navigate }) {
  const [name, setName] = useState('Alya Prameswari');
  const [userId, setUserId] = useState('alya_new');
  const [password, setPassword] = useState('SmartBank123');
  const [role, setRole] = useState<Role>('nasabah');
  const [success, setSuccess] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void registerApi({ name, userId, password, role }).then(() => setSuccess(true));
  };

  if (success) {
    return (
      <main className="auth-screen">
        <section className="auth-panel">
          <SmartLogo />
          <CheckCircle2 size={32} aria-hidden="true" />
          <h1>Account created</h1>
          <p>Your SmartBank account was created with an initial SMART_COIN 100.000 balance for development testing.</p>
          <Button variant="primary" onClick={() => navigate('/dashboard')}>
            Continue to dashboard
          </Button>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-screen">
      <section className="auth-panel auth-panel-wide">
        <SmartLogo />
        <h1>Create SmartBank account</h1>
        <p>New development users receive an initial balance for retail or merchant testing.</p>
        <form onSubmit={submit} className="form-grid">
          <label className="field">
            <span>Name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
          <label className="field">
            <span>User ID</span>
            <input value={userId} onChange={(event) => setUserId(event.target.value)} required maxLength={50} pattern="[A-Za-z0-9_-]+" />
          </label>
          <label className="field">
            <span>Password</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} />
          </label>
          <label className="field">
            <span>Role</span>
            <select value={role} onChange={(event) => setRole(event.target.value as Role)}>
              <option value="nasabah">Nasabah</option>
              <option value="admin">Admin</option>
              <option value="teller">Teller</option>
              <option value="manager">Manager</option>
            </select>
          </label>
          <div className="review-note full-span">
            Initial development balance: <strong>SMART_COIN 100.000</strong>
          </div>
          <Button type="submit" variant="primary" className="full-span">
            Register
          </Button>
        </form>
        <button className="link-button" type="button" onClick={() => navigate('/login')}>
          Back to secure login
        </button>
      </section>
    </main>
  );
}

function DashboardPage({ navigate }: { navigate: Navigate }) {
  const account = accounts[0];
  const recentTransactions = transactions.slice(0, 4);

  return (
    <div className="page">
      <PageHeader
        title="Dashboard"
        description="Formal overview of balance, payment activity, and gateway health."
        actions={<EnvironmentBadge />}
      />
      <div className="dashboard-grid">
        <BalanceCard balance={account.balance} accountCode={account.code} status={account.status} />
        <section className="quick-actions panel">
          <h2>Quick Actions</h2>
          <div className="quick-action-grid">
            <button type="button" onClick={() => navigate('/transfers/new')}>
              <Send size={18} aria-hidden="true" />
              Transfer
            </button>
            <button type="button" onClick={() => navigate('/payments')}>
              <CreditCard size={18} aria-hidden="true" />
              Bayar
            </button>
            <button type="button" onClick={() => navigate('/smartqr')}>
              <QrCode size={18} aria-hidden="true" />
              Scan QR
            </button>
            <button type="button" onClick={() => navigate('/loans')}>
              <Banknote size={18} aria-hidden="true" />
              Ajukan Pinjaman
            </button>
          </div>
        </section>
      </div>
      <div className="stat-grid four">
        <StatCard label="Money In" value={<MoneyText value={250000} />} detail="May 2026" icon={LineChart} tone="green" />
        <StatCard label="Money Out" value={<MoneyText value={158300} />} detail="Includes transfer and payments" icon={Send} />
        <StatCard label="Fees Paid" value={<MoneyText value={6300} />} detail="Gateway, bank, and tax" icon={ReceiptText} tone="amber" />
        <StatCard label="Total Transactions" value="18" detail="7-day activity" icon={Activity} tone="navy" />
      </div>
      <div className="content-grid">
        <section className="panel">
          <div className="panel-head">
            <h2>Recent Transactions</h2>
            <Button onClick={() => navigate('/accounts/statement')}>View statement</Button>
          </div>
          <TransactionMiniTable rows={recentTransactions} />
        </section>
        <MiniBarChart
          label="Payment Status Overview"
          data={[
            { name: 'Success', value: 64, tone: 'green' },
            { name: 'Processing', value: 18 },
            { name: 'Pending', value: 12, tone: 'amber' },
            { name: 'Failed', value: 4, tone: 'red' },
          ]}
        />
      </div>
      <section className="notice-panel">
        <ShieldCheck size={18} aria-hidden="true" />
        SmartBank will review high-value transfers and gateway retries before final settlement.
      </section>
    </div>
  );
}

function AccountsPage({ navigate }: { navigate: Navigate }) {
  const account = accounts[0];

  return (
    <div className="page">
      <PageHeader
        title="Accounts"
        description="Retail account balance, tokenized account reference, and recent activity."
        actions={<Button onClick={() => navigate('/accounts/statement')}>View statement</Button>}
      />
      <div className="stat-grid four">
        <StatCard label="Current Balance" value={<MoneyText value={account.balance} />} icon={WalletCards} tone="green" />
        <StatCard label="Account Code" value={account.code} detail="Primary retail ledger account" icon={Landmark} tone="navy" />
        <StatCard label="Currency" value="SMART_COIN" detail="Internal settlement unit" icon={Banknote} />
        <StatCard label="Account Status" value={<StatusBadge status={account.status} />} detail="No restriction active" icon={ShieldCheck} />
      </div>
      <section className="panel">
        <div className="panel-head">
          <h2>Account Activity</h2>
          <CopyButton value={account.tokenizedAccount} label="Copy token" />
        </div>
        <p className="muted">Tokenized account: {maskMiddle(account.tokenizedAccount, 12, 4)}</p>
        <TransactionTable rows={transactions} />
      </section>
    </div>
  );
}

function StatementPage() {
  const [direction, setDirection] = useState('ALL');
  const filtered = direction === 'ALL' ? transactions : transactions.filter((item) => item.direction === direction);

  return (
    <div className="page">
      <PageHeader
        title="Account Statement"
        description="CAMT-style account statement with filters and export placeholders."
        actions={
          <>
            <Button>CSV</Button>
            <Button>PDF</Button>
          </>
        }
      />
      <FilterBar>
        <label className="field">
          <span>From</span>
          <input type="date" defaultValue="2026-05-01" />
        </label>
        <label className="field">
          <span>To</span>
          <input type="date" defaultValue="2026-05-03" />
        </label>
        <label className="field">
          <span>Transaction Type</span>
          <select defaultValue="ALL">
            <option>ALL</option>
            <option>PAYMENT</option>
            <option>TRANSFER</option>
            <option>MANDATE</option>
          </select>
        </label>
        <label className="field">
          <span>Direction</span>
          <select value={direction} onChange={(event) => setDirection(event.target.value)}>
            <option>ALL</option>
            <option>DEBIT</option>
            <option>CREDIT</option>
          </select>
        </label>
      </FilterBar>
      <section className="panel">
        <TransactionTable rows={filtered} />
      </section>
    </div>
  );
}

function PaymentsPage({ navigate }: { navigate: Navigate }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [channel, setChannel] = useState('ALL');

  const filtered = useMemo(() => {
    return payments.filter((payment) => {
      const matchesSearch = `${payment.paymentCode} ${payment.externalReference}`.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === 'ALL' || payment.status === status;
      const matchesChannel = channel === 'ALL' || payment.channel === channel;
      return matchesSearch && matchesStatus && matchesChannel;
    });
  }, [search, status, channel]);

  return (
    <div className="page">
      <PageHeader title="Payments" description="Enterprise payment gateway table with idempotency and external references." />
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Payment code or external reference" />
        <label className="field">
          <span>Date Range</span>
          <input type="date" defaultValue="2026-05-03" />
        </label>
        <label className="field">
          <span>Source App</span>
          <select defaultValue="ALL">
            <option>ALL</option>
            <option>MARKETPLACE</option>
            <option>POS</option>
            <option>SUPPLIERHUB</option>
            <option>LOGISTIKITA</option>
            <option>UMKM_INSIGHT</option>
          </select>
        </label>
        <label className="field">
          <span>Channel</span>
          <select value={channel} onChange={(event) => setChannel(event.target.value)}>
            <option>ALL</option>
            <option>MARKETPLACE_CHECKOUT</option>
            <option>POS_PAYMENT</option>
            <option>SUPPLIER_PAYMENT</option>
            <option>LOGISTICS_PAYMENT</option>
            <option>INSIGHT_SUBSCRIPTION</option>
          </select>
        </label>
        <label className="field">
          <span>Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option>ALL</option>
            <option>SUCCESS</option>
            <option>PENDING</option>
            <option>PROCESSING</option>
            <option>FAILED</option>
          </select>
        </label>
        <label className="field field-compact">
          <span>Amount Min</span>
          <input type="number" placeholder="0" />
        </label>
      </FilterBar>
      <section className="panel">
        <DataTable
          rows={filtered}
          getRowKey={(payment) => payment.paymentCode}
          columns={[
            { key: 'code', header: 'Payment Code', render: (payment) => <code>{payment.paymentCode}</code> },
            { key: 'source', header: 'Source App', render: (payment) => payment.sourceApp },
            { key: 'channel', header: 'Channel', render: (payment) => payment.channel },
            { key: 'external', header: 'External Reference', render: (payment) => payment.externalReference },
            { key: 'amount', header: 'Amount', align: 'right', render: (payment) => <MoneyText value={payment.amount} align="right" /> },
            {
              key: 'totalDebit',
              header: 'Total Debit',
              align: 'right',
              render: (payment) => <MoneyText value={payment.totalDebit} strong align="right" />,
            },
            { key: 'status', header: 'Status', render: (payment) => <StatusBadge status={payment.status} /> },
            { key: 'idempotency', header: 'Idempotency Key', render: (payment) => <code>{maskMiddle(payment.idempotencyKey)}</code> },
            { key: 'created', header: 'Created At', render: (payment) => formatDateTime(payment.createdAt) },
            {
              key: 'action',
              header: 'Action',
              render: (payment) => <Button onClick={() => navigate(`/payments/${payment.paymentCode}`)}>Detail</Button>,
            },
          ]}
        />
      </section>
    </div>
  );
}

function PaymentDetailPage({ paymentCode }: { paymentCode: string }) {
  const payment = payments.find((item) => item.paymentCode === paymentCode) ?? payments[0];
  const relatedEntries = ledgerEntries.filter((entry) => entry.transactionCode === 'TRX-20260503-000001');

  return (
    <div className="page">
      <PageHeader
        title={payment.paymentCode}
        description="Audit-friendly payment details for gateway operations."
        actions={<Button>Receipt</Button>}
      />
      <section className={`status-banner status-${payment.status.toLowerCase()}`}>
        <StatusBadge status={payment.status} />
        <div>
          <strong>{payment.sourceApp} request settled through {payment.channel}</strong>
          <p>Request ID {payment.requestId} was signed by {payment.clientId}.</p>
        </div>
      </section>
      <div className="detail-grid">
        <section className="panel">
          <h2>Transaction Summary</h2>
          <SummaryList
            rows={[
              ['Base Amount', <MoneyText value={payment.amount} align="right" />],
              ['Total Debit', <MoneyText value={payment.totalDebit} strong align="right" />],
              ['External Reference', payment.externalReference],
              ['Created At', formatDateTime(payment.createdAt)],
            ]}
          />
        </section>
        <section className="panel">
          <h2>Parties</h2>
          <SummaryList
            rows={[
              ['Debtor Account', payment.debtorAccount],
              ['Creditor Account', payment.creditorAccount],
              ['Client ID', payment.clientId],
              ['Signature Status', <StatusBadge status={payment.signatureStatus} />],
            ]}
          />
        </section>
        <FeeBreakdownCard breakdown={payment.feeBreakdown} />
        <section className="panel">
          <h2>Idempotency Information</h2>
          <SummaryList
            rows={[
              ['Idempotency Key', <code>{payment.idempotencyKey}</code>],
              ['Request Hash', 'sha256:dd87fe912b0a'],
              ['Replay Policy', 'Return stored response for same request hash'],
              ['Conflict Rule', 'Reject same key with different body'],
            ]}
          />
        </section>
      </div>
      <section className="panel">
        <div className="panel-head">
          <h2>Ledger Entries</h2>
          <div className="badge-row">
            <StatusBadge status="BALANCED" />
            <StatusBadge status="VALID" />
          </div>
        </div>
        <LedgerEntriesTable entries={relatedEntries} />
      </section>
      <div className="content-grid">
        <section className="panel">
          <h2>Webhook Timeline</h2>
          <Timeline events={paymentTimeline} />
        </section>
        <section className="panel">
          <h2>Request Metadata</h2>
          <SummaryList
            rows={[
              ['HTTP Method', 'POST'],
              ['Path', '/api/v1/payments'],
              ['X-Client-Id', payment.clientId],
              ['X-Timestamp', '2026-05-03T09:12:00+07:00'],
              ['X-Signature', 'Verified HMAC-SHA256'],
            ]}
          />
        </section>
      </div>
    </div>
  );
}

function TransferFlowPage() {
  const [step, setStep] = useState(1);
  const [recipient, setRecipient] = useState('ACC-MRC-009');
  const [amount, setAmount] = useState(50000);
  const [note, setNote] = useState('Settlement for invoice INV-009');
  const [pin, setPin] = useState('');
  const fee = Math.ceil(amount * 0.005);
  const total = amount + fee;
  const insufficient = total > accounts[0].balance;

  return (
    <div className="page">
      <PageHeader title="New Transfer" description="All transfers require review before confirmation." />
      <StepIndicator current={step} labels={['Recipient', 'Amount', 'Review', 'Confirm', 'Receipt']} />
      {insufficient ? (
        <ErrorState title="Insufficient balance" description="The total debit exceeds your current available balance." />
      ) : null}
      {step === 1 ? (
        <section className="panel form-panel">
          <h2>Select Recipient</h2>
          <label className="field">
            <span>Recipient Account</span>
            <select value={recipient} onChange={(event) => setRecipient(event.target.value)}>
              <option value="ACC-MRC-009">ACC-MRC-009 - Toko Sembako Jaya</option>
              <option value="ACC-SUP-017">ACC-SUP-017 - SupplierHub Nusantara</option>
              <option value="ACC-UMKM-INSIGHT">ACC-UMKM-INSIGHT - UMKM Insight</option>
            </select>
          </label>
          <Button variant="primary" onClick={() => setStep(2)}>Continue</Button>
        </section>
      ) : null}
      {step === 2 ? (
        <section className="panel form-panel">
          <h2>Transfer Amount</h2>
          <label className="field">
            <span>Amount</span>
            <input type="number" value={amount} min={1000} onChange={(event) => setAmount(Number(event.target.value))} />
          </label>
          <label className="field">
            <span>Note</span>
            <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} />
          </label>
          <div className="button-row">
            <Button onClick={() => setStep(1)}>Back</Button>
            <Button variant="primary" disabled={insufficient} onClick={() => setStep(3)}>Review</Button>
          </div>
        </section>
      ) : null}
      {step === 3 ? (
        <ReviewPanel
          title="Review Transfer"
          description="Verify recipient, amount, and fee before confirmation."
          rows={[
            ['From', accounts[0].code],
            ['Recipient', recipient],
            ['Amount', <MoneyText value={amount} align="right" />],
            ['Transfer Fee', <MoneyText value={fee} align="right" />],
            ['Total Debit', <MoneyText value={total} strong align="right" />],
            ['Note', note],
          ]}
          actions={
            <>
              <Button onClick={() => setStep(2)}>Edit</Button>
              <Button variant="primary" onClick={() => setStep(4)}>Confirm</Button>
            </>
          }
        />
      ) : null}
      {step === 4 ? (
        <section className="panel form-panel">
          <h2>PIN / OTP Simulation</h2>
          <p className="muted">Enter any 6 digits to simulate customer authorization.</p>
          <label className="field">
            <span>PIN or OTP</span>
            <input inputMode="numeric" maxLength={6} value={pin} onChange={(event) => setPin(event.target.value)} />
          </label>
          <Button variant="primary" disabled={pin.length < 6} onClick={() => setStep(5)}>Authorize Transfer</Button>
        </section>
      ) : null}
      {step === 5 ? (
        <ReceiptCard
          reference="TRF-20260504-000021"
          amount={total}
          rows={[
            ['Recipient', recipient],
            ['Status', <StatusBadge status="SUCCESS" />],
            ['Idempotency Key', <code>{generateIdempotencyKey('transfer')}</code>],
            ['Created At', formatDateTime(new Date().toISOString())],
          ]}
        />
      ) : null}
    </div>
  );
}

function SmartQRPage({ initialMode }: { initialMode: 'scan' | 'generate' }) {
  const [mode, setMode] = useState(initialMode);
  const [manualCode, setManualCode] = useState('SMARTQR-MRC-009-20260504');
  const [review, setReview] = useState(false);
  const [qrType, setQrType] = useState<'STATIC' | 'DYNAMIC'>('DYNAMIC');
  const [amount, setAmount] = useState(75000);

  return (
    <div className="page">
      <PageHeader title="SmartQR" description="Scan, pay, or generate merchant QR using review-before-submit controls." />
      <div className="segmented">
        <button className={mode === 'scan' ? 'active' : ''} type="button" onClick={() => setMode('scan')}>Scan / Pay QR</button>
        <button className={mode === 'generate' ? 'active' : ''} type="button" onClick={() => setMode('generate')}>Generate Merchant QR</button>
      </div>
      {mode === 'scan' ? (
        <div className="content-grid">
          <section className="panel qr-scanner">
            <QrCode size={56} aria-hidden="true" />
            <h2>QR Scanner</h2>
            <p>Camera scanner placeholder for desktop and mobile devices.</p>
          </section>
          <section className="panel form-panel">
            <h2>Manual QR Input</h2>
            <label className="field">
              <span>QR Code</span>
              <input value={manualCode} onChange={(event) => setManualCode(event.target.value)} />
            </label>
            <Button variant="primary" onClick={() => setReview(true)}>Continue</Button>
            {review ? (
              <ReviewPanel
                title="Review QR Payment"
                rows={[
                  ['QR Code', manualCode],
                  ['Merchant', 'Toko Sembako Jaya'],
                  ['Amount', <MoneyText value={75000} strong align="right" />],
                  ['Status', <StatusBadge status="PENDING" />],
                ]}
                actions={<Button variant="primary">Pay SMART_COIN 75.000</Button>}
              />
            ) : null}
          </section>
        </div>
      ) : (
        <div className="content-grid">
          <section className="panel form-panel">
            <h2>Merchant QR Setup</h2>
            <label className="field">
              <span>QR Type</span>
              <select value={qrType} onChange={(event) => setQrType(event.target.value as 'STATIC' | 'DYNAMIC')}>
                <option value="DYNAMIC">Dynamic QR</option>
                <option value="STATIC">Static QR</option>
              </select>
            </label>
            <label className="field">
              <span>Amount</span>
              <input type="number" value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
            </label>
            <label className="field">
              <span>Reference</span>
              <input defaultValue="INV-MRC-20260504-010" />
            </label>
          </section>
          <QRCard code={`SMARTQR-${qrType}-MRC-009`} dynamic={qrType === 'DYNAMIC'} />
        </div>
      )}
    </div>
  );
}

function LoansPage() {
  const [principal, setPrincipal] = useState(50000);
  const [review, setReview] = useState(false);
  const interest = Math.ceil(principal * 0.1);
  const totalDue = principal + interest;

  return (
    <div className="page">
      <PageHeader title="Loans" description="SMART_COIN micro-loan simulation with review before submission." />
      <div className="content-grid">
        <section className="panel form-panel">
          <h2>Loan Simulation</h2>
          <p className="muted">Maximum loan: SMART_COIN 100.000. Interest: 10%.</p>
          <label className="field">
            <span>Principal</span>
            <input
              type="range"
              min={10000}
              max={100000}
              step={5000}
              value={principal}
              onChange={(event) => setPrincipal(Number(event.target.value))}
            />
          </label>
          <SummaryList
            rows={[
              ['Principal', <MoneyText value={principal} />],
              ['Interest', <MoneyText value={interest} />],
              ['Total Due', <MoneyText value={totalDue} strong />],
            ]}
          />
          <Button variant="primary" onClick={() => setReview(true)}>Review Loan Application</Button>
        </section>
        {review ? (
          <ReviewPanel
            title="Review Loan"
            description="Loan applications are checked against daily limits and account standing."
            rows={[
              ['Borrower', accounts[0].code],
              ['Principal', <MoneyText value={principal} />],
              ['Interest 10%', <MoneyText value={interest} />],
              ['Total Due', <MoneyText value={totalDue} strong />],
            ]}
            actions={<Button variant="primary">Submit Application</Button>}
          />
        ) : (
          <section className="panel">
            <h2>Loan Controls</h2>
            <ErrorState title="Daily limit guard" description="Applications above SMART_COIN 100.000 are blocked before submission." />
          </section>
        )}
      </div>
      <section className="panel">
        <h2>Existing Loans</h2>
        <DataTable
          rows={loans}
          getRowKey={(loan) => loan.loanCode}
          columns={[
            { key: 'code', header: 'Loan Code', render: (loan) => <code>{loan.loanCode}</code> },
            { key: 'borrower', header: 'Borrower', render: (loan) => loan.borrowerAccount },
            { key: 'principal', header: 'Principal', align: 'right', render: (loan) => <MoneyText value={loan.principal} align="right" /> },
            { key: 'interest', header: 'Interest', render: (loan) => `${loan.interestRate}%` },
            { key: 'total', header: 'Total Due', align: 'right', render: (loan) => <MoneyText value={loan.totalDue} strong align="right" /> },
            { key: 'status', header: 'Repayment Status', render: (loan) => <StatusBadge status={loan.status} /> },
            { key: 'due', header: 'Due Date', render: (loan) => formatDate(loan.dueDate) },
          ]}
        />
      </section>
    </div>
  );
}

function MandatesPage() {
  const [selected, setSelected] = useState<Mandate | null>(null);
  const [items, setItems] = useState(mandates);

  return (
    <div className="page">
      <PageHeader title="Mandates" description="Auto-payment and recurring payment controls for ecosystem apps." />
      <section className="notice-panel">
        <CalendarClock size={18} aria-hidden="true" />
        UMKM Insight subscription costs SMART_COIN 10.000 per week and uses signed mandate events.
      </section>
      <section className="panel">
        <DataTable
          rows={items}
          getRowKey={(mandate) => mandate.mandateCode}
          columns={[
            { key: 'code', header: 'Mandate Code', render: (mandate) => <code>{mandate.mandateCode}</code> },
            { key: 'app', header: 'Application', render: (mandate) => mandate.application },
            { key: 'amount', header: 'Amount', align: 'right', render: (mandate) => <MoneyText value={mandate.amount} align="right" /> },
            { key: 'frequency', header: 'Frequency', render: (mandate) => mandate.frequency },
            { key: 'next', header: 'Next Charge Date', render: (mandate) => formatDateTime(mandate.nextChargeDate) },
            { key: 'status', header: 'Status', render: (mandate) => <StatusBadge status={mandate.status} /> },
            {
              key: 'action',
              header: 'Action',
              render: (mandate) => <Button variant="danger" onClick={() => setSelected(mandate)}>Cancel mandate</Button>,
            },
          ]}
        />
      </section>
      <ConfirmationModal
        open={Boolean(selected)}
        danger
        title="Cancel mandate"
        description="This will stop future automatic charges. Existing settled ledger entries remain immutable."
        confirmLabel="Cancel mandate"
        onClose={() => setSelected(null)}
        onConfirm={() => {
          if (selected) {
            setItems((current) => current.map((item) => (item.mandateCode === selected.mandateCode ? { ...item, status: 'CANCELED' } : item)));
          }
          setSelected(null);
        }}
      />
    </div>
  );
}

function LedgerPage() {
  const [query, setQuery] = useState('');
  const filtered = ledgerEntries.filter((entry) => `${entry.transactionCode} ${entry.accountCode}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="page">
      <PageHeader
        title="Core Ledger"
        description="Double-entry ledger audit trail with chained entry hashes."
        actions={
          <div className="badge-row">
            <StatusBadge status="BALANCED" />
            <StatusBadge status="VALID" />
          </div>
        }
      />
      <section className="notice-panel">
        <Database size={18} aria-hidden="true" />
        Immutable Ledger: settled entries are append-only and verified through entry hash continuity.
      </section>
      <FilterBar>
        <SearchInput value={query} onChange={setQuery} placeholder="Transaction or account code" />
        <label className="field">
          <span>Direction</span>
          <select defaultValue="ALL">
            <option>ALL</option>
            <option>DEBIT</option>
            <option>CREDIT</option>
          </select>
        </label>
        <label className="field">
          <span>Created At</span>
          <input type="date" defaultValue="2026-05-03" />
        </label>
      </FilterBar>
      <section className="panel">
        <LedgerEntriesTable entries={filtered} />
      </section>
    </div>
  );
}

function WebhooksPage() {
  return (
    <div className="page">
      <PageHeader title="Webhooks" description="Monitoring dashboard for payment event delivery and HMAC verification." />
      <WebhookMetrics deliveries={webhookDeliveries} />
      <div className="content-grid">
        <section className="panel">
          <div className="panel-head">
            <h2>Webhook Deliveries</h2>
            <Button>
              <RefreshCw size={16} aria-hidden="true" />
              Retry selected
            </Button>
          </div>
          <WebhookTable rows={webhookDeliveries} />
        </section>
        <section className="panel">
          <h2>Delivery Timeline</h2>
          <Timeline
            events={[
              {
                title: 'payment.processing queued',
                description: 'POS webhook waiting for receiver availability.',
                status: 'PENDING',
                timestamp: '2026-05-03T11:20:06+07:00',
              },
              {
                title: 'HMAC signature status',
                description: 'Marketplace signature verified before delivery.',
                status: 'SUCCESS',
                timestamp: '2026-05-03T09:12:04+07:00',
              },
              {
                title: 'Retry exhausted',
                description: 'LogistiKita receiver rejected signature after five attempts.',
                status: 'FAILED',
                timestamp: '2026-04-30T19:10:00+07:00',
              },
            ]}
          />
        </section>
      </div>
    </div>
  );
}

function AuditLogsPage() {
  const [method, setMethod] = useState('ALL');
  const rows = method === 'ALL' ? auditLogs : auditLogs.filter((log) => log.method === method);

  return (
    <div className="page">
      <PageHeader title="Audit Logs" description="Admin request audit log for signed client and user activity." />
      <FilterBar>
        <label className="field">
          <span>Date</span>
          <input type="date" defaultValue="2026-05-03" />
        </label>
        <label className="field">
          <span>Client</span>
          <input placeholder="client id" />
        </label>
        <label className="field">
          <span>Method</span>
          <select value={method} onChange={(event) => setMethod(event.target.value)}>
            <option>ALL</option>
            <option>GET</option>
            <option>POST</option>
            <option>PATCH</option>
          </select>
        </label>
        <label className="field">
          <span>Status Code</span>
          <input placeholder="200" />
        </label>
        <label className="field">
          <span>User</span>
          <input placeholder="user or system" />
        </label>
      </FilterBar>
      <section className="panel">
        <DataTable
          rows={rows}
          getRowKey={(log) => log.requestId}
          columns={[
            { key: 'request', header: 'Request ID', render: (log) => <code>{log.requestId}</code> },
            { key: 'client', header: 'Client ID', render: (log) => log.clientId },
            { key: 'user', header: 'User', render: (log) => log.user },
            { key: 'method', header: 'Method', render: (log) => <StatusBadge status={log.method} /> },
            { key: 'path', header: 'Path', render: (log) => <code>{log.path}</code> },
            { key: 'status', header: 'Response Status', render: (log) => <StatusBadge status={log.responseStatus < 400 ? 'SUCCESS' : 'FAILED'} /> },
            { key: 'ip', header: 'IP Address', render: (log) => log.ipAddress },
            { key: 'created', header: 'Created At', render: (log) => formatDateTime(log.createdAt) },
          ]}
        />
      </section>
    </div>
  );
}

function AdminDashboardPage({ navigate }: { navigate: Navigate }) {
  return (
    <div className="page">
      <PageHeader
        title="Bank Admin Console"
        description="Operational controls for money supply, reserve, fees, reconciliation, and risk."
        actions={<Button onClick={() => navigate('/admin/reconciliation')}>Open reconciliation</Button>}
      />
      <div className="stat-grid three">
        <StatCard label="Total Money Supply" value={<MoneyText value={12450000} />} icon={Landmark} tone="navy" />
        <StatCard label="Bank Reserve" value={<MoneyText value={4200000} />} icon={ShieldCheck} tone="green" />
        <StatCard label="Circulating Balance" value={<MoneyText value={8070000} />} icon={Activity} />
        <StatCard label="Tax Sink" value={<MoneyText value={180000} />} icon={ReceiptText} tone="amber" />
        <StatCard label="Daily Transaction Volume" value="118" detail="May 3, 2026" icon={BarChart3} />
        <StatCard label="Failed Payment Rate" value="2.4%" detail="Below 3% guardrail" icon={AlertTriangle} tone="red" />
      </div>
      <div className="content-grid">
        <MiniBarChart
          label="Transaction Volume by Channel"
          data={[
            { name: 'Marketplace', value: 42 },
            { name: 'POS', value: 31 },
            { name: 'Supplier', value: 19 },
            { name: 'Logistics', value: 14 },
            { name: 'Insight', value: 12 },
          ]}
        />
        <MiniBarChart
          label="Fee Revenue by Source"
          data={[
            { name: 'Bank Fee', value: 342 },
            { name: 'Gateway', value: 141 },
            { name: 'Marketplace', value: 227 },
            { name: 'Tax Sink', value: 180 },
          ]}
        />
        <MiniBarChart label="Loan Outstanding" data={[{ name: 'Active', value: 177 }, { name: 'Due Soon', value: 77, tone: 'amber' }]} />
        <MiniBarChart label="Webhook Success Rate" data={[{ name: 'Success', value: 94, tone: 'green' }, { name: 'Failed', value: 6, tone: 'red' }]} />
      </div>
      <div className="content-grid">
        <section className="panel">
          <h2>Recent Failed Payments</h2>
          <PaymentMiniTable rows={payments.filter((payment) => payment.status === 'FAILED')} />
        </section>
        <section className="panel">
          <h2>Pending Webhooks</h2>
          <WebhookTable rows={webhookDeliveries.filter((delivery) => delivery.status !== 'SUCCESS')} />
        </section>
        <section className="panel full-span">
          <h2>Suspicious Activity</h2>
          <DataTable
            rows={auditLogs.filter((log) => log.responseStatus >= 400)}
            getRowKey={(log) => log.requestId}
            columns={[
              { key: 'request', header: 'Request ID', render: (log) => <code>{log.requestId}</code> },
              { key: 'client', header: 'Client ID', render: (log) => log.clientId },
              { key: 'path', header: 'Path', render: (log) => log.path },
              { key: 'status', header: 'Status', render: (log) => log.responseStatus },
              { key: 'created', header: 'Created At', render: (log) => formatDateTime(log.createdAt) },
            ]}
          />
        </section>
      </div>
    </div>
  );
}

function AdminAccountsPage() {
  return (
    <div className="page">
      <PageHeader title="Admin Accounts" description="Operational account review for users, merchants, suppliers, and system sinks." />
      <section className="panel">
        <DataTable
          rows={accounts}
          getRowKey={(account) => account.code}
          columns={[
            { key: 'code', header: 'Account Code', render: (account) => <code>{account.code}</code> },
            { key: 'owner', header: 'Owner', render: (account) => account.ownerName },
            { key: 'role', header: 'Role', render: (account) => account.role },
            { key: 'balance', header: 'Balance', align: 'right', render: (account) => <MoneyText value={account.balance} strong align="right" /> },
            { key: 'token', header: 'Tokenized Account', render: (account) => maskMiddle(account.tokenizedAccount, 12, 4) },
            { key: 'status', header: 'Status', render: (account) => <StatusBadge status={account.status} /> },
          ]}
        />
      </section>
    </div>
  );
}

function FeeRulesPage() {
  const [editing, setEditing] = useState<FeeRule | null>(null);
  const [disableTarget, setDisableTarget] = useState<FeeRule | null>(null);
  const [rows, setRows] = useState(feeRules);

  return (
    <div className="page">
      <PageHeader title="Fee Rules" description="Manage fee engine rules with review and confirmation for dangerous actions." />
      <section className="panel">
        <DataTable
          rows={rows}
          getRowKey={(rule) => rule.id}
          columns={[
            { key: 'channel', header: 'Channel', render: (rule) => rule.channel },
            { key: 'name', header: 'Fee Name', render: (rule) => rule.feeName },
            { key: 'type', header: 'Calculation Type', render: (rule) => rule.calculationType },
            { key: 'value', header: 'Value', render: (rule) => (rule.calculationType === 'PERCENTAGE' ? `${rule.value}%` : formatMoney(rule.value)) },
            { key: 'target', header: 'Target Account', render: (rule) => rule.targetAccount },
            { key: 'active', header: 'Active', render: (rule) => <StatusBadge status={rule.active ? 'ACTIVE' : 'CANCELED'} /> },
            { key: 'updated', header: 'Updated At', render: (rule) => formatDateTime(rule.updatedAt) },
            {
              key: 'action',
              header: 'Action',
              render: (rule) => (
                <div className="button-row compact">
                  <Button onClick={() => setEditing(rule)}>Edit</Button>
                  <Button variant="danger" onClick={() => setDisableTarget(rule)}>Disable</Button>
                </div>
              ),
            },
          ]}
        />
      </section>
      {editing ? (
        <section className="drawer-panel" aria-label="Edit fee rule">
          <div className="panel-head">
            <h2>Review Fee Rule Update</h2>
            <button className="icon-button" type="button" aria-label="Close edit panel" onClick={() => setEditing(null)}>
              <X size={18} />
            </button>
          </div>
          <ReviewPanel
            title={editing.feeName}
            rows={[
              ['Channel', editing.channel],
              ['Calculation', editing.calculationType],
              ['Current Value', editing.calculationType === 'PERCENTAGE' ? `${editing.value}%` : formatMoney(editing.value)],
              ['Target Account', editing.targetAccount],
            ]}
            actions={
              <>
                <Button onClick={() => setEditing(null)}>Cancel</Button>
                <Button variant="primary" onClick={() => setEditing(null)}>Save reviewed update</Button>
              </>
            }
          />
        </section>
      ) : null}
      <ConfirmationModal
        open={Boolean(disableTarget)}
        danger
        title="Disable fee rule"
        description="Disabling this fee rule can change total debit calculations for live payment channels."
        confirmLabel="Disable rule"
        onClose={() => setDisableTarget(null)}
        onConfirm={() => {
          if (disableTarget) {
            setRows((current) => current.map((rule) => (rule.id === disableTarget.id ? { ...rule, active: false } : rule)));
          }
          setDisableTarget(null);
        }}
      />
    </div>
  );
}

function MoneySupplyPage() {
  return (
    <div className="page">
      <PageHeader title="Money Supply" description="Reserve and circulating SMART_COIN controls for bank operations." />
      <div className="stat-grid three">
        <StatCard label="Total Money Supply" value={<MoneyText value={12450000} />} icon={Landmark} tone="navy" />
        <StatCard label="Bank Reserve" value={<MoneyText value={4200000} />} icon={ShieldCheck} tone="green" />
        <StatCard label="Tax Sink" value={<MoneyText value={180000} />} icon={ReceiptText} tone="amber" />
      </div>
      <section className="panel">
        <h2>Money Supply Ledger Accounts</h2>
        <DataTable
          rows={accounts.filter((account) => account.role === 'SYSTEM')}
          getRowKey={(account) => account.code}
          columns={[
            { key: 'code', header: 'Account Code', render: (account) => account.code },
            { key: 'owner', header: 'Owner', render: (account) => account.ownerName },
            { key: 'balance', header: 'Balance', align: 'right', render: (account) => <MoneyText value={account.balance} strong align="right" /> },
            { key: 'status', header: 'Status', render: (account) => <StatusBadge status={account.status} /> },
          ]}
        />
      </section>
    </div>
  );
}

function ReconciliationPage() {
  return (
    <div className="page">
      <PageHeader title="Reconciliation" description="Compare payment requests, successful ledger commits, and delivery mismatches." />
      <div className="stat-grid four">
        <StatCard label="Payment Requests" value="118" icon={CreditCard} />
        <StatCard label="Successful Ledger Count" value="115" icon={Database} tone="green" />
        <StatCard label="Failed Ledger Count" value="1" icon={AlertTriangle} tone="red" />
        <StatCard label="Mismatch Count" value={reconciliationMismatches.length} icon={ClipboardCheck} tone="amber" />
      </div>
      <section className="panel">
        <DataTable
          rows={reconciliationMismatches}
          getRowKey={(item) => item.code}
          columns={[
            { key: 'code', header: 'Code', render: (item) => <code>{item.code}</code> },
            { key: 'payment', header: 'Payment Code', render: (item) => item.paymentCode },
            { key: 'issue', header: 'Issue', render: (item) => item.issue },
            { key: 'severity', header: 'Severity', render: (item) => <StatusBadge status={item.severity === 'High' ? 'FAILED' : 'PENDING'} /> },
            { key: 'reviewed', header: 'Reviewed', render: (item) => (item.reviewed ? 'Yes' : 'No') },
            { key: 'action', header: 'Action', render: () => <Button>Mark reviewed</Button> },
          ]}
        />
      </section>
    </div>
  );
}

function DeveloperOverviewPage({ navigate }: { navigate: Navigate }) {
  return (
    <div className="page">
      <PageHeader
        title="Developer Portal"
        description="Sandbox API integration overview for signed REST JSON payment gateway traffic."
        actions={<Button onClick={() => navigate('/developer/swagger')}>Swagger docs</Button>}
      />
      <div className="stat-grid four">
        <StatCard label="API Calls Today" value="2.481" icon={Activity} />
        <StatCard label="Environment" value="Sandbox" icon={ShieldCheck} tone="navy" />
        <StatCard label="API Health" value={<StatusBadge status="SUCCESS" />} icon={Gauge} tone="green" />
        <StatCard label="Webhook Success" value="94%" icon={Webhook} />
      </div>
      <div className="route-card-grid">
        <RouteCard title="Applications" icon={FileCode2} onClick={() => navigate('/developer/applications')} />
        <RouteCard title="API Keys" icon={KeyRound} onClick={() => navigate('/developer/api-keys')} />
        <RouteCard title="Idempotency Logs" icon={Layers3} onClick={() => navigate('/developer/idempotency-logs')} />
        <RouteCard title="Signature Tester" icon={Code2} onClick={() => navigate('/developer/signature-tester')} />
      </div>
    </div>
  );
}

function DeveloperApplicationsPage() {
  const [regenerate, setRegenerate] = useState(false);

  return (
    <div className="page">
      <PageHeader title="Developer Applications" description="Client IDs, allowed channels, webhook URLs, and masked API secrets." />
      <section className="notice-panel">
        <KeyRound size={18} aria-hidden="true" />
        Client secrets are shown only once after creation. This page displays masked secrets only.
      </section>
      <section className="panel">
        <DataTable
          rows={developerApplications}
          getRowKey={(app) => app.clientId}
          columns={[
            { key: 'name', header: 'App Name', render: (app) => app.appName },
            { key: 'client', header: 'Client ID', render: (app) => <code>{app.clientId}</code> },
            { key: 'channels', header: 'Allowed Channels', render: (app) => app.allowedChannels.join(', ') },
            { key: 'webhook', header: 'Webhook URL', render: (app) => app.webhookUrl },
            { key: 'secret', header: 'Secret', render: (app) => <code>{app.maskedSecret}</code> },
            { key: 'status', header: 'Status', render: (app) => <StatusBadge status={app.status} /> },
            { key: 'action', header: 'Action', render: () => <Button variant="danger" onClick={() => setRegenerate(true)}>Regenerate secret</Button> },
          ]}
        />
      </section>
      <ConfirmationModal
        open={regenerate}
        danger
        title="Regenerate client secret"
        description="The previous secret will stop working. The new secret is shown once and should be stored server-side."
        confirmLabel="Regenerate"
        onClose={() => setRegenerate(false)}
        onConfirm={() => setRegenerate(false)}
      />
    </div>
  );
}

function DeveloperWebhooksPage() {
  return (
    <div className="page">
      <PageHeader title="Developer Webhooks" description="Webhook endpoints and recent delivery status for sandbox applications." />
      <WebhookMetrics deliveries={webhookDeliveries} />
      <section className="panel">
        <WebhookTable rows={webhookDeliveries} />
      </section>
    </div>
  );
}

function IdempotencyLogsPage() {
  return (
    <div className="page">
      <PageHeader title="Idempotency Logs" description="Inspect request hashes and replay status for payment and transfer calls." />
      <section className="panel">
        <DataTable
          rows={idempotencyRecords}
          getRowKey={(record) => `${record.clientId}-${record.idempotencyKey}`}
          columns={[
            { key: 'client', header: 'Client ID', render: (record) => record.clientId },
            { key: 'key', header: 'Idempotency Key', render: (record) => <code>{record.idempotencyKey}</code> },
            { key: 'hash', header: 'Request Hash', render: (record) => <code>{record.requestHash}</code> },
            { key: 'status', header: 'Status', render: (record) => <StatusBadge status={record.status} /> },
            { key: 'created', header: 'Created At', render: (record) => formatDateTime(record.createdAt) },
            { key: 'updated', header: 'Updated At', render: (record) => formatDateTime(record.updatedAt) },
          ]}
        />
      </section>
    </div>
  );
}

function SignatureTesterPage() {
  const [method, setMethod] = useState('POST');
  const [path, setPath] = useState('/api/v1/payments');
  const [timestamp, setTimestamp] = useState('2026-05-03T09:12:00+07:00');
  const [idempotencyKey, setIdempotencyKey] = useState('idem-mkp-20260503-000001');
  const [body, setBody] = useState('{"amount":100000,"channel":"MARKETPLACE_CHECKOUT"}');
  const canonical = buildCanonicalString({ method, path, timestamp, idempotencyKey, body });

  return (
    <div className="page">
      <PageHeader title="Signature Tester" description="Canonical string preview and generated HMAC placeholder for server-side signing." />
      <div className="content-grid">
        <section className="panel form-panel">
          <h2>Request Fields</h2>
          <label className="field">
            <span>HTTP Method</span>
            <select value={method} onChange={(event) => setMethod(event.target.value)}>
              <option>POST</option>
              <option>GET</option>
              <option>PATCH</option>
            </select>
          </label>
          <label className="field">
            <span>Path</span>
            <input value={path} onChange={(event) => setPath(event.target.value)} />
          </label>
          <label className="field">
            <span>Timestamp</span>
            <input value={timestamp} onChange={(event) => setTimestamp(event.target.value)} />
          </label>
          <label className="field">
            <span>Idempotency Key</span>
            <input value={idempotencyKey} onChange={(event) => setIdempotencyKey(event.target.value)} />
          </label>
          <label className="field">
            <span>Request Body</span>
            <textarea value={body} rows={5} onChange={(event) => setBody(event.target.value)} />
          </label>
        </section>
        <section className="panel">
          <h2>Canonical String</h2>
          <CodeBlock code={canonical} />
          <h2>Generated HMAC Placeholder</h2>
          <CodeBlock code={createSignaturePlaceholder(canonical)} />
          <p className="muted">
            Real HMAC generation must happen on a trusted backend or server-side route because client_secret must not be stored in the
            browser.
          </p>
        </section>
      </div>
    </div>
  );
}

function SwaggerPage() {
  return (
    <div className="page">
      <PageHeader title="Swagger / OpenAPI" description="Developer API documentation entry point." />
      <section className="panel swagger-placeholder">
        <BookOpen size={42} aria-hidden="true" />
        <h2>Swagger documentation</h2>
        <p>Swagger documentation will be available at /api-docs or from docs/openapi.yaml.</p>
        <CodeBlock code="GET /api/v1/accounts/me/balance\nPOST /api/v1/payments\nGET /api/v1/payments/{paymentCode}\nGET /api/v1/ledger" />
      </section>
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="page">
      <PageHeader title="Settings" description="Security and environment preferences for the SmartBank web console." />
      <section className="panel form-panel">
        <h2>Security UX Controls</h2>
        <label className="check-row">
          <input type="checkbox" defaultChecked />
          Confirm destructive admin actions
        </label>
        <label className="check-row">
          <input type="checkbox" defaultChecked />
          Mask tokenized accounts and API keys
        </label>
        <label className="check-row">
          <input type="checkbox" defaultChecked />
          Require transfer review screen
        </label>
      </section>
      <section className="panel">
        <h2>Error State Catalog</h2>
        <div className="error-grid">
          <ErrorState title="Insufficient balance" description="The account cannot cover total debit plus fee." />
          <ErrorState title="Invalid token" description="The bearer token is expired or malformed." />
          <ErrorState title="Idempotency conflict" description="The same key was reused with a different request body." />
          <ErrorState title="Cooldown active" description="Retry is temporarily blocked by risk controls." />
          <ErrorState title="Daily limit exceeded" description="The requested debit exceeds daily transaction limits." />
          <ErrorState title="Webhook failed" description="The target endpoint rejected signed delivery." />
        </div>
      </section>
    </div>
  );
}

function TransactionTable({ rows }: { rows: typeof transactions }) {
  return (
    <DataTable
      rows={rows}
      getRowKey={(tx) => tx.code}
      columns={[
        { key: 'code', header: 'Transaction Code', render: (tx) => <code>{tx.code}</code> },
        { key: 'counterparty', header: 'Counterparty', render: (tx) => tx.counterparty },
        { key: 'direction', header: 'Direction', render: (tx) => <StatusBadge status={tx.direction} /> },
        { key: 'amount', header: 'Amount', align: 'right', render: (tx) => <MoneyText value={tx.amount} strong align="right" /> },
        { key: 'fee', header: 'Fee', align: 'right', render: (tx) => <MoneyText value={tx.fee} align="right" /> },
        { key: 'status', header: 'Status', render: (tx) => <StatusBadge status={tx.status} /> },
        { key: 'channel', header: 'Channel', render: (tx) => tx.channel },
        { key: 'created', header: 'Created At', render: (tx) => formatDateTime(tx.createdAt) },
      ]}
    />
  );
}

function TransactionMiniTable({ rows }: { rows: typeof transactions }) {
  return (
    <DataTable
      rows={rows}
      getRowKey={(tx) => tx.code}
      columns={[
        { key: 'code', header: 'Transaction Code', render: (tx) => <code>{tx.code}</code> },
        { key: 'direction', header: 'Direction', render: (tx) => <StatusBadge status={tx.direction} /> },
        { key: 'amount', header: 'Amount', align: 'right', render: (tx) => <MoneyText value={tx.amount} strong align="right" /> },
        { key: 'status', header: 'Status', render: (tx) => <StatusBadge status={tx.status} /> },
      ]}
    />
  );
}

function PaymentMiniTable({ rows }: { rows: PaymentRequest[] }) {
  return (
    <DataTable
      rows={rows}
      getRowKey={(payment) => payment.paymentCode}
      columns={[
        { key: 'payment', header: 'Payment Code', render: (payment) => payment.paymentCode },
        { key: 'source', header: 'Source', render: (payment) => payment.sourceApp },
        { key: 'debit', header: 'Total Debit', align: 'right', render: (payment) => <MoneyText value={payment.totalDebit} strong align="right" /> },
        { key: 'status', header: 'Status', render: (payment) => <StatusBadge status={payment.status} /> },
      ]}
    />
  );
}

function WebhookMetrics({ deliveries }: { deliveries: WebhookDelivery[] }) {
  const success = deliveries.filter((delivery) => delivery.status === 'SUCCESS').length;
  const failed = deliveries.filter((delivery) => delivery.status === 'FAILED').length;
  const pending = deliveries.filter((delivery) => delivery.status === 'PENDING').length;

  return (
    <div className="stat-grid three">
      <StatCard label="Success Rate" value={`${Math.round((success / deliveries.length) * 100)}%`} icon={Webhook} tone="green" />
      <StatCard label="Pending Deliveries" value={pending} icon={CalendarClock} tone="amber" />
      <StatCard label="Failed Deliveries" value={failed} icon={AlertTriangle} tone="red" />
    </div>
  );
}

function WebhookTable({ rows }: { rows: WebhookDelivery[] }) {
  return (
    <DataTable
      rows={rows}
      getRowKey={(delivery) => delivery.eventId}
      columns={[
        { key: 'event', header: 'Event ID', render: (delivery) => <code>{delivery.eventId}</code> },
        { key: 'type', header: 'Event Type', render: (delivery) => delivery.eventType },
        { key: 'target', header: 'Target Application', render: (delivery) => delivery.targetApplication },
        { key: 'payment', header: 'Payment Code', render: (delivery) => delivery.paymentCode },
        { key: 'status', header: 'Status', render: (delivery) => <StatusBadge status={delivery.status} /> },
        { key: 'attempts', header: 'Attempts', render: (delivery) => delivery.attempts },
        { key: 'error', header: 'Last Error', render: (delivery) => delivery.lastError },
        { key: 'retry', header: 'Next Retry At', render: (delivery) => (delivery.nextRetryAt === '-' ? '-' : formatDateTime(delivery.nextRetryAt)) },
        { key: 'signature', header: 'HMAC Signature', render: (delivery) => <StatusBadge status={delivery.signatureStatus} /> },
      ]}
    />
  );
}

function StepIndicator({ current, labels }: { current: number; labels: string[] }) {
  return (
    <ol className="step-indicator">
      {labels.map((label, index) => (
        <li key={label} className={index + 1 <= current ? 'active' : ''}>
          <span>{index + 1}</span>
          {label}
        </li>
      ))}
    </ol>
  );
}

function SummaryList({ rows }: { rows: Array<[string, ReactNode]> }) {
  return (
    <dl className="summary-list">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function RouteCard({
  title,
  icon: Icon,
  onClick,
}: {
  title: string;
  icon: typeof Home;
  onClick: () => void;
}) {
  return (
    <button type="button" className="route-card" onClick={onClick}>
      <Icon size={20} aria-hidden="true" />
      <strong>{title}</strong>
      <ChevronRight size={18} aria-hidden="true" />
    </button>
  );
}
