import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Banknote,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  Calculator,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  CircleCheckBig,
  Clock3,
  Coins,
  Copy,
  CreditCard,
  Database,
  Download,
  FileText,
  Gauge,
  HandCoins,
  KeyRound,
  Landmark,
  LineChart,
  LockKeyhole,
  LogOut,
  Menu,
  Network,
  PlugZap,
  ReceiptText,
  ScrollText,
  Search,
  Send,
  Server,
  Shield,
  ShieldCheck,
  Sparkles,
  Moon,
  Sun,
  TerminalSquare,
  TrendingUp,
  UserPlus,
  Users,
  WalletCards,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import { LoginPage } from "./LoginPage";
import { RegisterPage } from "./RegisterPage";
import { AtmCard3D } from "./components/Landing/AtmCard3D";
import { CountUp, useGlobalReveal } from "./components/Landing/useRevealOnScroll";
import "./components/Landing/landing.css";
import type { LedgerEntry, PaymentRequest, SourceApp, User, UserRole } from "./types";
import {
  createContext,
  useEffect,
  useContext,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { animate, createTimeline, stagger } from "animejs";
import {
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
const LANDING_MONEY_TREND = [
  { day: "Sen", supply: 1000000000, reserve: 982500000, volume: 11800000 },
  { day: "Sel", supply: 1000000000, reserve: 981900000, volume: 15600000 },
  { day: "Rab", supply: 1000000000, reserve: 981200000, volume: 13200000 },
  { day: "Kam", supply: 1000000000, reserve: 980700000, volume: 18900000 },
  { day: "Jum", supply: 1000000000, reserve: 980400000, volume: 21300000 },
  { day: "Sab", supply: 1000000000, reserve: 980150000, volume: 17400000 },
  { day: "Min", supply: 1000000000, reserve: 980010000, volume: 19600000 },
];

const LANDING_LEDGER_ENTRIES = [
  { id: "LED-90001", amount: 185000 },
  { id: "LED-90002", amount: 72500 },
  { id: "LED-90003", amount: 250000 },
];

const LANDING_FINANCIAL_RULES = [
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

const LANDING_BALANCE = {
  availableBalance: 8420000,
};

const DEMO_USERS: User[] = [
  { id: "user_001", name: "Ayu Lestari", email: "ayu@smartbank.local", role: "nasabah", status: "active", createdAt: "2026-04-01T08:00:00.000Z" },
  { id: "seller_001", name: "Warung Sari", email: "sari@pasarkita.local", role: "nasabah", status: "active", createdAt: "2026-04-02T09:00:00.000Z" },
  { id: "admin_001", name: "Raka Admin", email: "admin@smartbank.local", role: "admin", status: "active", createdAt: "2026-04-04T11:30:00.000Z" },
  { id: "teller_001", name: "Tania Teller", email: "teller@smartbank.local", role: "teller", status: "active", createdAt: "2026-04-05T12:00:00.000Z" },
  { id: "manager_001", name: "Budi Manager", email: "manager@smartbank.local", role: "manager", status: "active", createdAt: "2026-04-06T12:00:00.000Z" },
];

const API_REFERENCE_DOCS = [
  { group: "Auth", endpoint: "/smartbank/registrasi_&_login_user/login", method: "POST", purpose: "Login nasabah, admin, teller, dan manager." },
  { group: "Balance", endpoint: "/smartbank/manajemen_saldo/{userId}", method: "GET", purpose: "Query saldo, held balance, limit harian, dan cooldown." },
  { group: "Transfer", endpoint: "/smartbank/transfer_antar_user/preview", method: "POST", purpose: "Preview fee dan total debit sebelum transfer." },
  { group: "Payment", endpoint: "/smartbank/pembayaran_transaksi", method: "POST", purpose: "Menerima payment request dari Marketplace, POS, SupplierHub, dan LogistiKita." },
  { group: "Ledger", endpoint: "/smartbank/ledger_transaksi", method: "GET", purpose: "Membaca ledger immutable sebagai single source of truth." },
  { group: "Fee", endpoint: "/smartbank/pajak_&_biaya/simulate", method: "POST", purpose: "Simulasi app fee, gateway fee, bank fee, pajak, dan total debit." },
];

function normalizeRole(dbRole: string): UserRole {
  const norm = dbRole?.trim().toLowerCase();
  if (norm === "nasabah" || norm === "user") return "nasabah";
  if (norm === "admin") return "admin";
  if (norm === "teller" || norm === "insight_readonly") return "teller";
  if (norm === "manager" || norm === "developer") return "manager";
  return "nasabah"; // default fallback
}
import { getBalanceData, getLedger, api } from "./api/client";
import {
  calculateFee,
  calculateLoan,
  canAccess,
  feeRules,
  formatDateTime,
  formatNumber,
  formatRupiah,
} from "./utils";

const brandName = "SmartBank";

type Session = {
  token: string;
  user: User;
};

type AuthContextValue = {
  session: Session | null;
  login: (role: string, email?: string, realUser?: User) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  balance: any;
  ledgerEntries: any[];
  loans: any[];
  paymentRequests: any[];
  refreshData: () => void;
};

type ThemeMode = "dark" | "light";

type ThemeContextValue = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const ThemeContext = createContext<ThemeContextValue | null>(null);

export const roleOptions: Array<{ label: string; value: UserRole }> = [
  { label: "Nasabah", value: "nasabah" },
  { label: "Admin", value: "admin" },
  { label: "Teller", value: "teller" },
  { label: "Manager", value: "manager" },
];

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: Gauge, capability: "docs" },
  { label: "Balance", path: "/balance", icon: WalletCards, capability: "balance" },
  { label: "Transfer", path: "/transfers", icon: Send, capability: "transfer" },
  {
    label: "Payment Request",
    path: "/payment-requests",
    icon: ReceiptText,
    capability: "paymentRequests",
  },
  { label: "Ledger", path: "/ledger", icon: ScrollText, capability: "ledger" },
  { label: "Loans", path: "/loans", icon: HandCoins, capability: "ledger" },
  { label: "Fee Engine", path: "/fees", icon: Calculator, capability: "fees" },
  { label: "Bank Fees", path: "/bank-fees", icon: Landmark, capability: "fees" },
  {
    label: "Integrations",
    path: "/integrations",
    icon: PlugZap,
    capability: "integrations",
  },
  { label: "API Logs", path: "/api-logs", icon: TerminalSquare, capability: "integrations" },
  { label: "Settings", path: "/settings", icon: ShieldCheck, capability: "docs" },
];

export const statusTone: Record<string, string> = {
  success: "success",
  online: "success",
  active: "success",
  paid: "success",
  pending: "warning",
  validating: "info",
  processing: "info",
  warning: "warning",
  failed: "danger",
  offline: "danger",
  overdue: "danger",
  rejected: "danger",
  readonly: "neutral",
  draft: "neutral",
  blocked: "danger",
};

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthContext");
  }
  return value;
}

function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error("useTheme must be used inside ThemeContext");
  }
  return value;
}

function getUserByRole(role: UserRole) {
  return DEMO_USERS.find((user) => user.role === role) ?? DEMO_USERS[0];
}

type MotionControl = {
  revert: () => unknown;
};

type LoopingMotionControl = MotionControl & {
  pause: () => unknown;
  play: () => unknown;
};

function shouldReduceMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function useLandingAnimations() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".landing-page");
    if (!root || shouldReduceMotion()) return;

    root.classList.add("motion-ready");

    const activeMotions: MotionControl[] = [];
    const loopingMotions: LoopingMotionControl[] = [];
    const intro = createTimeline({
      defaults: {
        duration: 760,
        ease: "out(3)",
      },
    });

    intro
      .add(root.querySelectorAll(".public-header, .hero-eyebrow"), {
        opacity: [0, 1],
        translateY: [-16, 0],
        delay: stagger(90),
      })
      .add(
        root.querySelectorAll(".hero-copy h1, .hero-copy p, .hero-actions"),
        {
          opacity: [0, 1],
          translateY: [28, 0],
          delay: stagger(120),
        },
        "-=430",
      )
      .add(
        root.querySelectorAll(".hero-panel, .hero-side-panel, .hero-proof .mini-metric"),
        {
          opacity: [0, 1],
          translateY: [34, 0],
          scale: [0.96, 1],
          delay: stagger(75),
        },
        "-=520",
      )
      .add(
        root.querySelectorAll(".hero-chart span"),
        {
          opacity: [0.2, 1],
          scaleY: [0.35, 1],
          transformOrigin: "50% 100%",
          delay: stagger(55),
          duration: 620,
        },
        "-=500",
      );

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const target = entry.target as HTMLElement;
          target.classList.add("is-visible");
          activeMotions.push(
            animate(target, {
              opacity: [0, 1],
              translateY: [26, 0],
              duration: 680,
              ease: "out(3)",
            }),
          );

          const children = target.querySelectorAll(".stagger-item");
          if (children.length) {
            activeMotions.push(
              animate(children, {
                opacity: [0, 1],
                translateY: [20, 0],
                scale: [0.97, 1],
                delay: stagger(70),
                duration: 620,
                ease: "out(3)",
              }),
            );
          }

          revealObserver.unobserve(target);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.18 },
    );

    root
      .querySelectorAll<HTMLElement>(".motion-reveal")
      .forEach((element) => revealObserver.observe(element));

    const floatingCards = root.querySelectorAll(".hero-side-panel, .hero-balance-card");
    if (floatingCards.length) {
      loopingMotions.push(
        animate(floatingCards, {
          translateY: [0, -10],
          duration: 2600,
          delay: stagger(180),
          ease: "inOutSine",
          alternate: true,
          loop: true,
          autoplay: false,
        }) as LoopingMotionControl,
      );
    }

    const activeLines = root.querySelectorAll(".hero-ledger-row.is-active");
    if (activeLines.length) {
      loopingMotions.push(
        animate(activeLines, {
          translateX: [0, 8],
          duration: 1400,
          ease: "inOutSine",
          alternate: true,
          loop: true,
          autoplay: false,
        }) as LoopingMotionControl,
      );
    }

    loopingMotions.forEach((motion) => motion.pause());

    const hero = root.querySelector(".landing-hero");
    const loopObserver = hero
      ? new IntersectionObserver(
          ([entry]) => {
            loopingMotions.forEach((motion) => {
              if (entry?.isIntersecting) motion.play();
              else motion.pause();
            });
          },
          { threshold: 0.2 },
        )
      : null;

    if (hero && loopObserver) loopObserver.observe(hero);

    return () => {
      root.classList.remove("motion-ready");
      intro.revert();
      activeMotions.forEach((motion) => motion.revert());
      loopingMotions.forEach((motion) => motion.revert());
      revealObserver.disconnect();
      loopObserver?.disconnect();
    };
  }, []);
}

function useAuthAnimations() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".auth-page");
    if (!root || shouldReduceMotion()) return;

    const intro = createTimeline({
      defaults: {
        duration: 680,
        ease: "out(3)",
      },
    });

    intro
      .add(root.querySelectorAll(".public-header, .auth-card"), {
        opacity: [0, 1],
        translateY: [-14, 0],
        delay: stagger(95),
      })
      .add(
        root.querySelectorAll(
          ".auth-kicker, .auth-card h1, .auth-card > p, .auth-proof-item, .stack-form label, .auth-form-row, .stack-form .btn, .auth-switch",
        ),
        {
          opacity: [0, 1],
          translateY: [18, 0],
          delay: stagger(58),
        },
        "-=360",
      );

    return () => {
      intro.revert();
    };
  }, []);
}

function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem("smartbank-theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  });
  const [session, setSession] = useState<Session | null>(() => {
    const raw = localStorage.getItem("smartbank-session");
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      if (parsed.token && parsed.user) {
        return {
          token: parsed.token,
          user: {
            ...parsed.user,
            role: normalizeRole(parsed.user.role),
          },
        };
      }
      return null;
    } catch {
      localStorage.removeItem("smartbank-session");
      return null;
    }
  });

  const [balance, setBalance] = useState<any>({
    userId: "",
    currentBalance: 0,
    availableBalance: 0,
    heldBalance: 0,
    initialBalance: 50000,
    dailyTransactionCount: 0,
    dailyTransactionLimit: 10,
    cooldownUntil: null,
    lastUpdatedAt: "",
  });
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<any[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshData = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    if (!session) {
      setBalance({
        userId: "",
        currentBalance: 0,
        availableBalance: 0,
        heldBalance: 0,
        initialBalance: 50000,
        dailyTransactionCount: 0,
        dailyTransactionLimit: 10,
        cooldownUntil: null,
        lastUpdatedAt: "",
      });
      setLedgerEntries([]);
      setLoans([]);
      setPaymentRequests([]);
      return;
    }

    let active = true;

    const fetchData = async () => {
      try {
        const balanceRes = await getBalanceData();
        if (!active) return;

        let ledgerRes: any[] = [];
        if (session.user.role === "admin" || session.user.role === "teller" || session.user.role === "manager") {
          ledgerRes = await getLedger();
        } else {
          ledgerRes = balanceRes.history || [];
        }
        if (!active) return;

        const mappedBalance = {
          userId: session.user.id,
          currentBalance: Number(balanceRes.balance),
          availableBalance: Number(balanceRes.balance),
          heldBalance: 0,
          initialBalance: 50000,
          dailyTransactionCount: balanceRes.history ? balanceRes.history.filter((tx: any) => tx.fromUserId === session.user.email && new Date(tx.created_at).toDateString() === new Date().toDateString()).length : 0,
          dailyTransactionLimit: 10,
          cooldownUntil: null,
          lastUpdatedAt: new Date().toISOString(),
        };

        const mappedLoans = Number(balanceRes.loan) > 0 ? [
          {
            id: "LOAN-001",
            userId: session.user.id,
            principal: Number(balanceRes.loan),
            interestRate: 0.1,
            interestAmount: Number(balanceRes.loan) * 0.1,
            totalRepayment: Number(balanceRes.loan),
            status: "active" as const,
            createdAt: new Date().toISOString(),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          }
        ] : [];

        const mappedLedger: any[] = [];
        const txList = ledgerRes || [];
        txList.forEach((tx: any) => {
          const baseAmount = Number(tx.baseAmount);
          const tax = Number(tx.tax);
          const fee = Number(tx.fee);
          const refId = tx.refId || `TX-${tx.id}`;

          if (tx.type === "TRANSFER" || tx.type.startsWith("PAYMENT_")) {
            mappedLedger.push({
              id: `LED-${tx.id}-DR`,
              transactionId: refId,
              type: "debit" as const,
              accountId: tx.fromUserId,
              accountName: tx.fromUserId,
              amount: baseAmount + tax + fee,
              balanceBefore: 0,
              balanceAfter: 0,
              sourceApp: (tx.type.replace("PAYMENT_", "").toLowerCase() as any) || "manual_transfer",
              createdAt: tx.created_at || new Date().toISOString(),
            });

            mappedLedger.push({
              id: `LED-${tx.id}-CR`,
              transactionId: refId,
              type: "credit" as const,
              accountId: tx.toUserId,
              accountName: tx.toUserId,
              amount: baseAmount,
              balanceBefore: 0,
              balanceAfter: 0,
              sourceApp: (tx.type.replace("PAYMENT_", "").toLowerCase() as any) || "manual_transfer",
              createdAt: tx.created_at || new Date().toISOString(),
            });
          } else if (tx.type === "LOAN_DISBURSEMENT") {
            mappedLedger.push({
              id: `LED-${tx.id}-LN`,
              transactionId: refId,
              type: "loan" as const,
              accountId: tx.toUserId,
              accountName: tx.toUserId,
              amount: baseAmount,
              balanceBefore: 0,
              balanceAfter: 0,
              sourceApp: "loan" as const,
              createdAt: tx.created_at || new Date().toISOString(),
            });
          } else if (tx.type === "LOAN_REPAYMENT") {
            mappedLedger.push({
              id: `LED-${tx.id}-RP`,
              transactionId: refId,
              type: "repayment" as const,
              accountId: tx.fromUserId,
              accountName: tx.fromUserId,
              amount: baseAmount,
              balanceBefore: 0,
              balanceAfter: 0,
              sourceApp: "loan" as const,
              createdAt: tx.created_at || new Date().toISOString(),
            });
          }
        });

        const mappedPaymentRequests = txList
          .filter((tx: any) => tx.type.startsWith("PAYMENT_"))
          .map((tx: any) => ({
            id: tx.refId,
            sourceApp: tx.type.replace("PAYMENT_", "").toLowerCase() as SourceApp,
            fromUserId: tx.fromUserId,
            toUserId: tx.toUserId,
            amount: Number(tx.baseAmount),
            feeTotal: Number(tx.fee),
            taxTotal: Number(tx.tax),
            totalDebit: Number(tx.baseAmount) + Number(tx.fee) + Number(tx.tax),
            status: "success" as const,
            metadata: { description: tx.description },
            createdAt: tx.created_at || new Date().toISOString(),
          }));

        setBalance(mappedBalance);
        setLedgerEntries(mappedLedger);
        setLoans(mappedLoans);
        setPaymentRequests(mappedPaymentRequests);
      } catch (err) {
        console.error("Error fetching stateful backend data:", err);
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [session, refreshTrigger]);

  const login = (role: string, email?: string, realUser?: User) => {
    const normalized = normalizeRole(role);
    let user: User;

    if (realUser) {
      user = {
        ...realUser,
        role: normalized,
      };
    } else {
      const defaultUser = getUserByRole(normalized);
      user = {
        ...defaultUser,
        email: email?.trim() || defaultUser.email,
        role: normalized,
      };
    }

    const nextSession = {
      token: `mock-jwt-${normalized}-smartbank`,
      user,
    };

    localStorage.setItem("smartbank-session", JSON.stringify(nextSession));
    setSession(nextSession);
  };

  const logout = () => {
    localStorage.removeItem("smartbank-session");
    setSession(null);
  };

  const switchRole = (role: UserRole) => {
    login(role, session?.user.email);
  };

  const value = useMemo(
    () => ({
      session,
      login,
      logout,
      switchRole,
      balance,
      ledgerEntries,
      loans,
      paymentRequests,
      refreshData,
    }),
    [session, balance, ledgerEntries, loans, paymentRequests],
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem("smartbank-theme", theme);
  }, [theme]);

  const themeValue = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme((current) => (current === "dark" ? "light" : "dark")),
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={themeValue}>
      <AuthContext.Provider value={value}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/login" element={<Navigate to="/login" replace />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/register" element={<Navigate to="/register" replace />} />
          <Route path="/docs" element={<DocsPage variant="home" />} />
          <Route path="/docs/api" element={<DocsPage variant="api" />} />
          <Route path="/docs/payment-flow" element={<DocsPage variant="payment-flow" />} />
          <Route path="/docs/database" element={<DocsPage variant="database" />} />
          <Route path="/docs/testing" element={<DocsPage variant="testing" />} />
          <Route path="/dashboard" element={<PrivatePage page={<DashboardPage />} />} />
          <Route
            path="/balance"
            element={<PrivatePage capability="balance" page={<BalancePage />} />}
          />
          <Route
            path="/transfers"
            element={<PrivatePage capability="transfer" page={<TransferPage />} />}
          />
          <Route
            path="/payment-requests"
            element={
              <PrivatePage capability="paymentRequests" page={<PaymentRequestsPage />} />
            }
          />
          <Route
            path="/ledger"
            element={<PrivatePage capability="ledger" page={<LedgerPage />} />}
          />
          <Route path="/loans" element={<PrivatePage page={<LoansPage />} />} />
          <Route
            path="/fees"
            element={<PrivatePage capability="fees" page={<FeesPage />} />}
          />
          <Route
            path="/bank-fees"
            element={<PrivatePage capability="fees" page={<BankFeesPage />} />}
          />
          <Route
            path="/integrations"
            element={<PrivatePage capability="integrations" page={<IntegrationsPage />} />}
          />
          <Route
            path="/api-logs"
            element={<PrivatePage capability="integrations" page={<ApiLogsPage />} />}
          />
          <Route path="/settings" element={<PrivatePage page={<SettingsPage />} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  );
}

function Button({
  children,
  className = "",
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  return (
    <button className={`btn btn-${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}

function Panel({
  children,
  className = "",
  as = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: "article" | "section" | "div";
}) {
  const Component = as;
  return <Component className={`panel ${className}`}>{children}</Component>;
}

function StatusBadge({ status }: { status: string }) {
  const tone = statusTone[status.toLowerCase()] ?? "neutral";
  return <span className={`status status-${tone}`}>{status.replace("_", " ")}</span>;
}

function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      className={compact ? "brand-logo brand-logo-compact" : "brand-logo"}
      to="/"
      aria-label="SmartBank home"
    >
      <span>Smart</span>
      <strong>Bank</strong>
    </Link>
  );
}

function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const Icon = theme === "dark" ? Sun : Moon;
  const label = theme === "dark" ? "Aktifkan light theme" : "Aktifkan dark theme";

  return (
    <button
      className={compact ? "theme-toggle theme-toggle-compact" : "theme-toggle"}
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      <Icon size={17} aria-hidden="true" />
      <span>{theme === "dark" ? "Light" : "Dark"}</span>
    </button>
  );
}

function PrivatePage({
  page,
  capability,
}: {
  page: ReactNode;
  capability?: string;
}) {
  return (
    <ProtectedRoute capability={capability}>
      <AppShell>{page}</AppShell>
    </ProtectedRoute>
  );
}

function ProtectedRoute({
  children,
  capability,
}: {
  children: ReactNode;
  capability?: string;
}) {
  const { session } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (capability && !canAccess(session?.user?.role || "nasabah", capability)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppShell({ children }: { children: ReactNode }) {
  const { session, logout, switchRole } = useAuth();
  const [showMobileMore, setShowMobileMore] = useState(false);
  const visibleNav = navItems.filter((item) =>
    session ? canAccess(session.user.role, item.capability) : false,
  );

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Navigasi aplikasi">
        <div className="sidebar-brand">
          <BrandLogo />
          <span>Core finance OS</span>
        </div>

        <nav className="sidebar-nav">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.path} className="nav-link" to={item.path}>
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-foot">
          <div className="sidebar-foot-brand">SmartBank</div>
          <p>Ledger immutable, reserve guarded, gateway logged.</p>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div>
            <button className="icon-button mobile-only" aria-label="Buka menu" onClick={() => setShowMobileMore(!showMobileMore)}>
              <Menu size={20} />
            </button>
            <p>{session?.user.name}</p>
            <strong>{roleLabel(session?.user.role ?? "nasabah")}</strong>
          </div>

          <div className="topbar-actions">
            <label className="search-field">
              <Search size={16} aria-hidden="true" />
              <input aria-label="Cari data SmartBank" placeholder="Cari request, ledger, endpoint" />
            </label>
            <select
              value={session?.user.role}
              onChange={(event) => switchRole(event.target.value as UserRole)}
              aria-label="Ganti role demo"
            >
              {roleOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
            <button className="icon-button" aria-label="Notifikasi">
              <Bell size={18} />
            </button>
            <ThemeToggle compact />
            <Button variant="ghost" onClick={logout}>
              <LogOut size={17} />
              Keluar
            </Button>
          </div>
        </header>

        <main className="page-frame">{children}</main>
      </div>

      <nav className="bottom-nav" aria-label="Navigasi mobile">
        {visibleNav.slice(0, 3).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.path} to={item.path} aria-label={item.label} onClick={() => setShowMobileMore(false)}>
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
        {visibleNav.length > 3 && (
          <button type="button" aria-label="Lainnya" onClick={() => setShowMobileMore(!showMobileMore)} className={showMobileMore ? "active" : ""}>
            <Menu size={20} />
            <span>Lainnya</span>
          </button>
        )}
      </nav>
      {showMobileMore && (
        <div className="mobile-more-menu">
          {visibleNav.slice(3).map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.path} to={item.path} aria-label={item.label} onClick={() => setShowMobileMore(false)}>
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}

function roleLabel(role: UserRole) {
  return roleOptions.find((item) => item.value === role)?.label ?? "User";
}

export function PublicHeader() {
  return (
    <header className="public-header">
      <BrandLogo />
      <nav aria-label="Navigasi publik">
        <a href="#overview">Ikhtisar</a>
        <a href="#features">Fitur</a>
        <a href="#flow">Alur</a>
        <a href="#security">Keamanan</a>
        <Link to="/docs">Bantuan</Link>
      </nav>
      <div className="public-actions">
        <ThemeToggle />
        <Link className="btn btn-ghost" to="/login">
          Masuk
        </Link>
        <Link className="btn btn-primary" to="/register">
          Daftar
        </Link>
      </div>
    </header>
  );
}

function LandingPage() {
  useGlobalReveal();

  return (
    <div className="landing-page landing-redesign">
      <PublicHeader />

      {/* ============== HERO ============== */}
      <section id="overview" className="lr-hero">
        <div className="lr-orbs" aria-hidden="true">
          <span className="lr-orb lr-orb-1" />
          <span className="lr-orb lr-orb-2" />
          <span className="lr-orb lr-orb-3" />
          <span className="lr-orb lr-orb-4" />
          <span className="lr-orb lr-orb-5" />
        </div>

        <div className="lr-hero-grid">
          <div className="lr-hero-copy">
            <span className="lr-eyebrow">
              <Sparkles size={14} aria-hidden="true" />
              Smart finance OS untuk UMKM Indonesia
            </span>

            <h1 className="lr-headline">
              Banking yang <span className="lr-grad">cerdas, cepat,</span> dan
              transparan untuk bisnismu.
            </h1>

            <p className="lr-sub">
              {brandName} menggabungkan saldo, transfer, payment request, fee
              engine, hingga pinjaman dalam satu dashboard yang ringan, modern,
              dan siap diaudit.
            </p>

            <div className="lr-cta-row">
              <Link to="/register" className="lr-btn-primary">
                Buka Rekening Gratis
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link to="/docs/api" className="lr-btn-ghost">
                Lihat Dokumentasi
                <ChevronRight size={18} aria-hidden="true" />
              </Link>
            </div>

            <div className="lr-trust" aria-label="SmartBank assurance">
              <span>
                <ShieldCheck size={15} aria-hidden="true" />
                Reserve 98%
              </span>
              <span>
                <Activity size={15} aria-hidden="true" />
                Gateway 84 ms
              </span>
              <span>
                <Database size={15} aria-hidden="true" />
                Ledger immutable
              </span>
              <span>
                <LockKeyhole size={15} aria-hidden="true" />
                Enkripsi end-to-end
              </span>
            </div>
          </div>

          <div className="lr-card-area">
            <AtmCard3D
              brand="SmartBank"
              holderName="MITRA UMKM"
              cardNumber="5421  ••••  ••••  9824"
              expiry="12/29"
            />

            <div className="lr-widget lr-widget-1" aria-hidden="true">
              <div className="lr-widget-icon is-green">
                <ShieldCheck size={18} />
              </div>
              <div>
                <small>Saldo aman</small>
                <strong>{formatRupiah(LANDING_BALANCE.availableBalance)}</strong>
              </div>
            </div>

            <div className="lr-widget lr-widget-2" aria-hidden="true">
              <div className="lr-widget-icon">
                <Zap size={18} />
              </div>
              <div>
                <small>Transfer instan</small>
                <strong>~84 ms</strong>
              </div>
            </div>

            <div className="lr-widget lr-widget-3" aria-hidden="true">
              <div className="lr-widget-icon is-amber">
                <Banknote size={18} />
              </div>
              <div>
                <small>Bunga loan</small>
                <strong>1.5% / bulan</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============== STATS ============== */}
      <section className="lr-section" style={{ paddingTop: 0 }}>
        <div className="lr-stats">
          <article className="lr-stat-card reveal-on-scroll" data-delay="1">
            <div className="lr-stat-icon">
              <Users size={20} aria-hidden="true" />
            </div>
            <span className="lr-stat-value">
              <CountUp to={12500} suffix="+" />
            </span>
            <span className="lr-stat-label">UMKM aktif terdaftar</span>
          </article>

          <article className="lr-stat-card reveal-on-scroll" data-delay="2">
            <div className="lr-stat-icon">
              <TrendingUp size={20} aria-hidden="true" />
            </div>
            <span className="lr-stat-value">
              Rp <CountUp to={84} suffix=" M+" />
            </span>
            <span className="lr-stat-label">Volume transaksi bulanan</span>
          </article>

          <article className="lr-stat-card reveal-on-scroll" data-delay="3">
            <div className="lr-stat-icon">
              <CheckCircle2 size={20} aria-hidden="true" />
            </div>
            <span className="lr-stat-value">
              <CountUp to={99.98} decimals={2} suffix="%" format={false} />
            </span>
            <span className="lr-stat-label">Uptime layanan SLA</span>
          </article>

          <article className="lr-stat-card reveal-on-scroll" data-delay="4">
            <div className="lr-stat-icon">
              <ShieldCheck size={20} aria-hidden="true" />
            </div>
            <span className="lr-stat-value">
              <CountUp to={5} suffix=" Layer" />
            </span>
            <span className="lr-stat-label">Proteksi keamanan</span>
          </article>
        </div>
      </section>

      {/* ============== FEATURES ============== */}
      <section id="features" className="lr-section">
        <div className="lr-section-head reveal-on-scroll">
          <span className="lr-section-eyebrow">Fitur Unggulan</span>
          <h2 className="lr-section-title">
            Semua operasi finansial dalam satu tempat
          </h2>
          <p className="lr-section-desc">
            Kontrol penuh atas saldo, payment request, fee, pajak, dan ledger.
            Dirancang transparan agar setiap rupiah bisa dilacak.
          </p>
        </div>

        <div className="lr-features">
          {[
            {
              icon: Shield,
              title: "Balance Guard",
              text:
                "Saldo hanya berubah setelah validasi gateway. Setiap request dicek role, limit, dan saldo sebelum eksekusi.",
            },
            {
              icon: ReceiptText,
              title: "Fee Breakdown",
              text:
                "App fee, gateway fee, bank fee, pajak, dan total debit selalu terlihat sebelum transaksi dikonfirmasi.",
            },
            {
              icon: ScrollText,
              title: "Ledger Immutable",
              text:
                "Setiap debit, kredit, fee, pajak, loan, dan repayment menjadi entry audit read-only yang tidak bisa diubah.",
            },
            {
              icon: Network,
              title: "Integration Health",
              text:
                "Pantau status gateway dan aplikasi ekosistem dengan latency, error rate, dan API logs realtime.",
            },
            {
              icon: HandCoins,
              title: "Loan Engine",
              text:
                "Limit pinjaman berbasis tier, bunga transparan, jadwal repayment, dan status aktif dalam satu tampilan.",
            },
            {
              icon: Users,
              title: "Role-aware Access",
              text:
                "Nasabah, admin, teller, dan manager mendapat akses sesuai permission matrix yang tegas dan teraudit.",
            },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <article
                className="lr-feature reveal-on-scroll"
                data-delay={(index % 3) + 1}
                key={item.title}
                onMouseMove={(event) => {
                  const target = event.currentTarget;
                  const rect = target.getBoundingClientRect();
                  target.style.setProperty(
                    "--mx",
                    `${event.clientX - rect.left}px`,
                  );
                  target.style.setProperty(
                    "--my",
                    `${event.clientY - rect.top}px`,
                  );
                }}
              >
                <div className="lr-feature-icon">
                  <Icon size={22} aria-hidden="true" />
                </div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* ============== HOW IT WORKS ============== */}
      <section id="flow" className="lr-section">
        <div className="lr-section-head reveal-on-scroll">
          <span className="lr-section-eyebrow">Cara Kerja</span>
          <h2 className="lr-section-title">Mulai dalam 4 langkah sederhana</h2>
          <p className="lr-section-desc">
            Onboarding ringkas, validasi cepat, dan langsung bertransaksi
            dengan keamanan kelas perbankan.
          </p>
        </div>

        <div className="lr-steps">
          {[
            {
              num: "01",
              title: "Daftar Akun",
              desc: "Isi data UMKM, verifikasi identitas, dan dapatkan tier reguler.",
            },
            {
              num: "02",
              title: "Top-up Saldo",
              desc: "Isi saldo melalui transfer atau gateway pembayaran terpercaya.",
            },
            {
              num: "03",
              title: "Transaksi & Bayar",
              desc: "Transfer, terima payment request, atau bayar supplier dalam satu klik.",
            },
            {
              num: "04",
              title: "Audit & Skala",
              desc: "Pantau ledger, ajukan loan, dan kembangkan bisnis dengan data jernih.",
            },
          ].map((step, index) => (
            <div
              className="lr-step reveal-on-scroll"
              data-delay={index + 1}
              key={step.num}
            >
              <div className="lr-step-num">{step.num}</div>
              <h4>{step.title}</h4>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============== TESTIMONIALS ============== */}
      <section className="lr-section">
        <div className="lr-section-head reveal-on-scroll">
          <span className="lr-section-eyebrow">Cerita Pengguna</span>
          <h2 className="lr-section-title">Dipercaya UMKM dari seluruh Indonesia</h2>
          <p className="lr-section-desc">
            Pelaku usaha menjadi lebih cepat, lebih hemat, dan lebih aman dengan
            SmartBank sebagai tulang punggung finansial mereka.
          </p>
        </div>

        <div className="lr-testimonials">
          {[
            {
              quote:
                "Transfer ke supplier sekarang cuma hitungan detik dan rincian fee-nya jelas. Pembukuan jadi auto-rapi tanpa rekap manual.",
              name: "Rina Hartati",
              role: "Owner, WarungSenja",
              initials: "RH",
            },
            {
              quote:
                "Fitur loan-nya life-saver waktu cashflow tipis. Bunganya transparan, jadwal cicilan jelas, dan approval cepat.",
              name: "Budi Santoso",
              role: "Founder, KopiKencana",
              initials: "BS",
            },
            {
              quote:
                "Ledger immutable bikin tim akunting tenang waktu audit pajak. Semua jejak transaksi tinggal dipindai.",
              name: "Citra Wulandari",
              role: "Finance Lead, BatikLuwes",
              initials: "CW",
            },
          ].map((testi, index) => (
            <article
              className="lr-testi reveal-on-scroll"
              data-delay={index + 1}
              key={testi.name}
            >
              <p className="lr-testi-quote">{testi.quote}</p>
              <div className="lr-testi-author">
                <div className="lr-testi-avatar" aria-hidden="true">
                  {testi.initials}
                </div>
                <div>
                  <span className="lr-testi-name">{testi.name}</span>
                  <span className="lr-testi-role">{testi.role}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ============== CTA BANNER ============== */}
      <section className="lr-cta reveal-on-scroll" id="security">
        <div className="lr-cta-text">
          <h2>Siap kembangkan bisnis dengan banking yang transparan?</h2>
          <p>
            Coba demo lengkap untuk melihat alur end-to-end, lalu daftar gratis
            untuk mulai bertransaksi dengan SmartBank.
          </p>
        </div>
        <Link to="/login" className="lr-btn-cta">
          Masuk ke Demo
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </section>

      <PublicFooter />
    </div>
  );
}

function LegacyLandingPage() {
  return (
    <div className="landing-page">
      <PublicHeader />

      <section className="landing-hero">
        <div className="hero-shell">
          <div className="hero-copy animate-rise">
            <span className="hero-eyebrow">
              <Sparkles size={18} aria-hidden="true" />
              Dompet finansial yang ramah dan aman
            </span>
            <h1>Teman terpercaya untuk transaksi dan finansial Anda</h1>
            <p>
              SmartBank memberi Anda kendali penuh atas aset, pembayaran, dan ledger secara instan. Bergabunglah dengan masa depan finansial yang aman dan transparan.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" to="/login" style={{ padding: "0.8rem 1.5rem", fontSize: "1.1rem" }}>
                Mulai Sekarang
                <ArrowRight size={20} />
              </Link>
              <Link className="btn btn-secondary" to="/docs/api" style={{ padding: "0.8rem 1.5rem", fontSize: "1.1rem" }}>
                Jelajahi Fitur
                <ChevronRight size={20} />
              </Link>
            </div>
            <div className="hero-assurance" aria-label="SmartBank assurance">
              <span>
                <ShieldCheck size={16} aria-hidden="true" />
                Terjamin Aman
              </span>
              <span>
                <Activity size={16} aria-hidden="true" />
                Real-time
              </span>
              <span>
                <Database size={16} aria-hidden="true" />
                Desentralisasi
              </span>
            </div>
          </div>

          <div className="phantom-product-stack animate-scale" aria-label="Preview produk SmartBank">
            <div className="wallet-card wallet-card-primary">
              <div className="wallet-card-top">
                <span style={{ fontWeight: 800, color: "var(--text)" }}>{brandName}</span>
                <StatusBadge status="online" />
              </div>
              <p style={{ marginTop: "1.5rem" }}>Total Saldo</p>
              <strong style={{ fontSize: "2.5rem", color: "var(--text)" }}>{formatRupiah(LANDING_BALANCE.availableBalance)}</strong>
              <div className="wallet-actions" style={{ marginTop: "2rem", gap: "1rem" }}>
                <span className="phantom-action-btn"><Send size={18}/> Kirim</span>
                <span className="phantom-action-btn"><Download size={18}/> Terima</span>
                <span className="phantom-action-btn"><CreditCard size={18}/> Kartu</span>
              </div>
            </div>
            <div className="wallet-card wallet-card-secondary" style={{ backdropFilter: "blur(20px)", background: "rgba(26,26,26,0.6)" }}>
              <span>Aktivitas Terakhir</span>
              <strong style={{ color: "var(--text)" }}>LED-90001</strong>
              <p>Gateway 84ms • Sukses</p>
            </div>
            <div className="wallet-card wallet-card-tertiary" style={{ backdropFilter: "blur(20px)", background: "rgba(26,26,26,0.6)" }}>
              <span>Keamanan</span>
              <div className="mini-flow">
                <Shield size={16} style={{ color: "var(--green)" }}/>
                <b style={{ color: "var(--text)" }}>Enkripsi Aktif</b>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-proof">
          <MiniMetric label="Cadangan Bank" value="98.0%" />
          <MiniMetric label="Batas Harian" value="10 Trx" />
          <MiniMetric label="Limit Pinjaman" value="Rp 100K" />
          <MiniMetric label="Gateway" value="84ms" />
        </div>
      </section>

      <section id="capabilities" className="landing-section">
        <SectionHeading
          title="Alat finansial untuk semua"
          description="SmartBank dirancang dengan antarmuka yang intuitif dan fitur keamanan kelas enterprise, memberikan pengalaman yang mudah namun kuat bagi siapa saja."
        />
        <div className="feature-grid">
          {[
            {
              icon: Shield,
              title: "Saldo hanya berubah di SmartBank",
              text: "Marketplace, POS, SupplierHub, dan LogistiKita hanya mengirim payment request melalui Gateway.",
            },
            {
              icon: ReceiptText,
              title: "Fee breakdown sebelum submit",
              text: "App fee, gateway fee, bank fee, pajak, dan total debit selalu terlihat sebelum transaksi dikonfirmasi.",
            },
            {
              icon: ScrollText,
              title: "Ledger immutable",
              text: "Setiap debit, kredit, fee, pajak, loan, repayment, dan stimulus menjadi entry audit read-only.",
            },
            {
              icon: Network,
              title: "Integration health",
              text: "Status Gateway dan aplikasi ekosistem dipantau dengan latency, error rate, dan API logs.",
            },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <article
                className="feature-card"
                key={item.title}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <Icon size={24} aria-hidden="true" />
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="flow" className="landing-section flow-band">
        <SectionHeading
          title="Spend, send, & settle"
          description="Semua aplikasi eksternal melewati API Gateway, lalu SmartBank melakukan validasi, debit kredit, fee, pajak, dan pencatatan ledger."
        />
        <div className="flow-layout">
          <EcosystemFlow />
          <div className="flow-control-panel">
            <div>
              <Sparkles size={18} aria-hidden="true" />
              <span>Operational posture</span>
            </div>
            <strong>Every request is validated before balance movement.</strong>
            <p>
              UI mengutamakan status, limit, dan audit trail supaya alur demo
              tetap jelas untuk nasabah, admin, teller, dan manager.
            </p>
          </div>
        </div>
      </section>

      <section id="rules" className="landing-section">
        <SectionHeading
          title="Controlled by you, secured by SmartBank"
          description="Rule engine dibuat terlihat supaya demo RPL mudah diuji dan keputusan finansial tidak tersembunyi."
        />
        <div className="rules-grid">
          {LANDING_FINANCIAL_RULES.map(([label, value]) => (
            <div className="rule-tile" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-cta">
        <div className="landing-cta-brand">SmartBank</div>
        <div>
          <h2>Get started. Open SmartBank.</h2>
          <p>
            Jalankan demo sebagai nasabah, admin, teller, atau manager
            untuk melihat permission matrix dan alur transaksi berbeda.
          </p>
        </div>
        <Link className="btn btn-primary" to="/login">
          Masuk ke Demo
          <ArrowRight size={18} />
        </Link>
      </section>


      <PublicFooter />
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="mini-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="section-heading">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

function EcosystemFlow() {
  const flow = [
    { label: "Marketplace", icon: Building2 },
    { label: "WarungPOS", icon: CreditCard },
    { label: "SupplierHub", icon: Server },
    { label: "LogistiKita", icon: Workflow },
    { label: "API Gateway", icon: Network },
    { label: "SmartBank", icon: Landmark },
    { label: "Immutable Ledger", icon: ScrollText },
  ];

  return (
    <div className="ecosystem-flow">
      {flow.map((item, index) => {
        const Icon = item.icon;
        return (
          <div className="flow-item-wrap" key={item.label}>
            <div className={item.label === "SmartBank" ? "flow-item active" : "flow-item"}>
              <Icon size={23} aria-hidden="true" />
              <span>{item.label}</span>
            </div>
            {index < flow.length - 1 && <ChevronRight size={20} aria-hidden="true" />}
          </div>
        );
      })}
    </div>
  );
}

function PublicFooter() {
  return (
    <footer className="public-footer">
      <BrandLogo />
      <p>SmartBank Web Frontend. Built for transparent UMKM finance control.</p>
      <Link to="/docs/api">API Reference</Link>
    </footer>
  );
}

function AuthLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  useAuthAnimations();

  return (
    <div className="auth-page">
      <PublicHeader />
      <main className="auth-main">
        <section className="auth-card auth-card-unified" aria-label="SmartBank authentication">
          <div className="auth-info-panel">
            <span className="auth-kicker">
              <ShieldCheck size={17} aria-hidden="true" />
              Secure demo access
            </span>
            <h1>{title}</h1>
            <p>{description}</p>
            <div className="auth-proof-grid" aria-label="Kontrol keamanan SmartBank">
              <span className="auth-proof-item">
                <KeyRound size={16} aria-hidden="true" />
                JWT demo session
              </span>
              <span className="auth-proof-item">
                <Shield size={16} aria-hidden="true" />
                Role guard matrix
              </span>
              <span className="auth-proof-item">
                <ScrollText size={16} aria-hidden="true" />
                Ledger read-only
              </span>
            </div>
            <dl className="auth-ledger-preview">
              <div>
                <dt>Reserve status</dt>
                <dd>98.0%</dd>
              </div>
              <div>
                <dt>Gateway latency</dt>
                <dd>84 ms</dd>
              </div>
              <div>
                <dt>Session mode</dt>
                <dd>Mock JWT</dd>
              </div>
            </dl>
          </div>

          <div className="auth-form-panel">
            <div className="auth-form-header">
              <span>SmartBank access</span>
              <strong>Role demo</strong>
            </div>
            {children}
          </div>
        </section>
      </main>
    </div>
  );
}

function LegacyAuthLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="auth-page">
      <PublicHeader />
      <main className="auth-main">
        <section className="auth-card">
          <div className="auth-wordmark">SmartBank</div>
          <h1>{title}</h1>
          <p>{description}</p>
          {children}
        </section>
        <section className="auth-visual" aria-label="Trust panel SmartBank">
          <div className="auth-visual-top">
            <strong>SmartBank</strong>
            <span>Secure banking access</span>
          </div>
          <div className="auth-visual-copy">
            <ShieldCheck size={30} />
            <h2>Akses masuk yang fokus, aman, dan siap untuk demo role.</h2>
            <p>
              Form dibuat ringkas seperti auth screen SaaS/fintech modern:
              satu alur utama, status keamanan terlihat, dan konteks produk
              tetap hadir tanpa dekorasi berlebihan.
            </p>
          </div>
          <div className="auth-trust-list" aria-label="Kontrol keamanan login">
            <span>
              <KeyRound size={16} aria-hidden="true" />
              JWT demo session
            </span>
            <span>
              <Shield size={16} aria-hidden="true" />
              Role guard matrix
            </span>
            <span>
              <ScrollText size={16} aria-hidden="true" />
              Ledger read-only
            </span>
          </div>
          <dl className="auth-ledger-preview">
            <div>
              <dt>Reserve status</dt>
              <dd>98.0%</dd>
            </div>
            <div>
              <dt>Gateway latency</dt>
              <dd>84ms</dd>
            </div>
            <div>
              <dt>Session mode</dt>
              <dd>Mock JWT</dd>
            </div>
          </dl>
        </section>
      </main>
    </div>
  );
}


function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
  tone = "cyan",
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
  helper: string;
  tone?: "cyan" | "green" | "amber" | "blue" | "pink";
}) {
  return (
    <Panel className={`metric-card metric-${tone}`} as="article">
      <Icon size={22} aria-hidden="true" />
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{helper}</p>
    </Panel>
  );
}

function DashboardPage() {
  const { session, balance, loans, paymentRequests, ledgerEntries } = useAuth();
  const isAdminLike = session?.user.role === "admin" || session?.user.role === "teller" || session?.user.role === "manager";
  const successfulRequests = paymentRequests.filter((request: any) => request.status === "success");
  const feeRevenue = successfulRequests.reduce(
    (sum: number, request: any) => sum + request.feeTotal + request.taxTotal,
    0,
  );

  // Dynamic moneySupplyTrend calculated from actual ledgerEntries
  const daysOfWeek = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const dynamicMoneySupplyTrend = daysOfWeek.map((dayLabel, index) => {
    const dayVolume = ledgerEntries
      .filter((entry) => {
        const txDate = new Date(entry.createdAt);
        return txDate.getDay() === index && (entry.type === "debit" || entry.type === "credit");
      })
      .reduce((sum, entry) => sum + entry.amount, 0);

    const baseReserve = 980000000;
    const dynamicFees = ledgerEntries
      .filter((entry) => {
        const txDate = new Date(entry.createdAt);
        return txDate.getDay() === index && (entry.type === "fee" || entry.type === "tax");
      })
      .reduce((sum, entry) => sum + entry.amount, 0);

    return {
      day: dayLabel,
      supply: 1000000000,
      reserve: baseReserve + dynamicFees,
      volume: dayVolume > 0 ? dayVolume : 50000 + (index * 8000), // elegant visual baseline
    };
  });

  // Dynamic sourceDistribution calculated from actual paymentRequests
  const dynamicSourceDistribution = [
    { name: "Marketplace", key: "marketplace", color: "#12d6c5", value: 0 },
    { name: "POS", key: "pos", color: "#4f8cff", value: 0 },
    { name: "SupplierHub", key: "supplierhub", color: "#f8c14a", value: 0 },
    { name: "LogistiKita", key: "logistikita", color: "#f472b6", value: 0 },
    { name: "Transfer", key: "manual_transfer", color: "#9ae66e", value: 0 },
  ];

  paymentRequests.forEach((req: any) => {
    const found = dynamicSourceDistribution.find((s) => s.key === req.sourceApp);
    if (found) found.value += 1;
  });

  const totalReqs = paymentRequests.length;
  const sourceDistributionList = totalReqs > 0
    ? dynamicSourceDistribution.map((s) => ({
        name: s.name,
        color: s.color,
        value: Math.round((s.value / totalReqs) * 100),
      })).filter((s) => s.value > 0)
    : [
        { name: "Marketplace", color: "#12d6c5", value: 40 },
        { name: "POS", color: "#4f8cff", value: 25 },
        { name: "SupplierHub", color: "#f8c14a", value: 15 },
        { name: "LogistiKita", color: "#f472b6", value: 15 },
        { name: "Transfer", color: "#9ae66e", value: 5 },
      ]; // elegant baseline mix

  return (
    <>
      <PageHeader
        title={isAdminLike ? "Admin Control Center" : "User Banking Dashboard"}
        description={
          isAdminLike
            ? "Pantau money supply, reserve, payment request, fee, pajak, loan, dan ledger dari satu layar."
            : "Lihat saldo, limit harian, transaksi terbaru, pinjaman, dan status cooldown."
        }
        action={
          <Link className="btn btn-primary" to={isAdminLike ? "/payment-requests" : "/transfers"}>
            {isAdminLike ? "Review Request" : "Transfer"}
            <ArrowRight size={18} />
          </Link>
        }
      />

      <div className="metric-grid">
        <MetricCard
          icon={isAdminLike ? Coins : WalletCards}
          label={isAdminLike ? "Total money supply" : "Available balance"}
          value={
            isAdminLike
              ? formatRupiah(feeRules.totalSupply)
              : formatRupiah(balance.availableBalance)
          }
          helper={isAdminLike ? "Supply tetap, tidak dibuat bebas." : "Siap dipakai untuk transaksi."}
          tone="cyan"
        />
        <MetricCard
          icon={isAdminLike ? Landmark : Gauge}
          label={isAdminLike ? "Bank reserve" : "Daily limit"}
          value={isAdminLike ? "98.0%" : `${balance.dailyTransactionCount}/${balance.dailyTransactionLimit}`}
          helper={isAdminLike ? "Minimum reserve plan terpenuhi." : "Cooldown 10-30 detik aktif."}
          tone="green"
        />
        <MetricCard
          icon={isAdminLike ? ReceiptText : HandCoins}
          label={isAdminLike ? "Payment requests" : "Active loan"}
          value={isAdminLike ? formatNumber(paymentRequests.length) : formatRupiah(loans[0]?.principal ?? 0)}
          helper={isAdminLike ? "Semua sumber masuk via Gateway." : "Bunga 10%, limit 100K/user."}
          tone="amber"
        />
        <MetricCard
          icon={isAdminLike ? Banknote : Clock3}
          label={isAdminLike ? "Fee and tax collected" : "Held balance"}
          value={isAdminLike ? formatRupiah(feeRevenue) : formatRupiah(balance.heldBalance)}
          helper={isAdminLike ? "App fee, bank fee, gateway, pajak." : "Dana tertahan dari request aktif."}
          tone="blue"
        />
      </div>

      <div className="dashboard-grid">
        <Panel className="chart-panel wide">
          <div className="panel-title">
            <div>
              <h2>{isAdminLike ? "Money supply and reserve" : "Balance movement"}</h2>
              <p>Data dari ledger transaksi ekosistem SmartBank secara realtime.</p>
            </div>
            <StatusBadge status={isAdminLike ? "success" : "processing"} />
          </div>
          <AreaVisual
            color={isAdminLike ? "#12d6c5" : "#f8c14a"}
            items={dynamicMoneySupplyTrend.map((item) => ({
              label: item.day,
              value: isAdminLike ? item.reserve : item.volume,
            }))}
          />
        </Panel>

        <Panel className="chart-panel">
          <div className="panel-title">
            <div>
              <h2>Source mix</h2>
              <p>Distribusi request ekosistem.</p>
            </div>
          </div>
          <DonutVisual items={sourceDistributionList} />
          <div className="legend-list">
            {sourceDistributionList.map((entry) => (
              <span key={entry.name}>
                <i style={{ background: entry.color }} />
                {entry.name}
              </span>
            ))}
          </div>
        </Panel>
      </div>


      <div className="dashboard-grid">
        <RecentPayments />
        <IntegrationSnapshot />
      </div>
    </>
  );
}

function AreaVisual({
  items,
  color,
}: {
  items: Array<{ label: string; value: number }>;
  color: string;
}) {
  const max = Math.max(...items.map((item) => item.value));
  const min = Math.min(...items.map((item) => item.value));
  const range = Math.max(max - min, 1);
  const width = 640;
  const height = 250;
  const padding = 28;
  const points = items.map((item, index) => {
    const x = padding + (index / Math.max(items.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - ((item.value - min) / range) * (height - padding * 2);
    return { ...item, x, y };
  });
  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <div className="chart-svg-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Grafik area SmartBank">
        <defs>
          <linearGradient id={`area-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.6" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((line) => {
          const y = padding + line * ((height - padding * 2) / 3);
          return <line key={line} x1={padding} x2={width - padding} y1={y} y2={y} />;
        })}
        <path d={areaPath} fill={`url(#area-${color.replace("#", "")})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r="5" fill={color} />
            <text x={point.x} y={height - 6} textAnchor="middle">
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function DonutVisual({ items }: { items: Array<{ name: string; color: string; value: number }> }) {
  let cursor = 0;
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const normalized = items.map((item) => ({
    ...item,
    value: total > 0 ? (item.value / total) * 100 : 0,
  }));

  const gradient = normalized.length > 0
    ? normalized
        .map((entry) => {
          const start = cursor;
          cursor += entry.value;
          return `${entry.color} ${start}% ${cursor}%`;
        })
        .join(", ")
    : "var(--border) 0% 100%";

  return (
    <div className="donut-wrap">
      <div className="donut-visual" style={{ background: `conic-gradient(${gradient})` }}>
        <div>
          <strong>100%</strong>
          <span>request</span>
        </div>
      </div>
    </div>
  );
}

function BarVisual({ items }: { items: Array<{ label: string; value: number }> }) {
  const max = Math.max(...items.map((item) => item.value));

  return (
    <div className="bar-visual" role="img" aria-label="Grafik bar volume transaksi mingguan">
      {items.map((item) => (
        <div className="bar-column" key={item.label}>
          <div
            className="bar-track"
            title={`${item.label}: ${formatRupiah(item.value)}`}
          >
            <span style={{ height: `${Math.max((item.value / max) * 100, 8)}%` }} />
          </div>
          <strong>{item.label}</strong>
        </div>
      ))}
    </div>
  );
}

function RecentPayments() {
  const { paymentRequests } = useAuth();

  return (
    <Panel className="wide">
      <div className="panel-title">
        <div>
          <h2>Payment request terbaru</h2>
          <p>Request dari aplikasi lain tetap berakhir di SmartBank.</p>
        </div>
        <Link className="text-link" to="/payment-requests">
          Lihat semua
        </Link>
      </div>
      <div className="responsive-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Source</th>
              <th>Amount</th>
              <th>Total debit</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {paymentRequests.slice(0, 5).map((request: any) => (
              <tr key={request.id}>
                <td>{request.id}</td>
                <td>{sourceLabel(request.sourceApp)}</td>
                <td>{formatRupiah(request.amount)}</td>
                <td>{formatRupiah(request.totalDebit)}</td>
                <td>
                  <StatusBadge status={request.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function IntegrationSnapshot() {
  const { paymentRequests } = useAuth();
  
  const baseIntegrations = [
    { service: "gateway", status: "online", errorRate: 0.2, averageLatencyMs: 84 },
    { service: "marketplace", status: "online", errorRate: 0.5, averageLatencyMs: 122 },
    { service: "pos", status: "online", errorRate: 0.3, averageLatencyMs: 96 },
    { service: "supplierhub", status: "warning", errorRate: 4.8, averageLatencyMs: 420 },
    { service: "logistikita", status: "online", errorRate: 1.1, averageLatencyMs: 188 },
    { service: "umkm_insight", status: "readonly", errorRate: 0, averageLatencyMs: 140 },
  ];

  const dynamicIntegrations = baseIntegrations.map((item) => {
    const matchingRequests = paymentRequests.filter(
      (r: any) => r.sourceApp === item.service || (item.service === "gateway" && r.sourceApp !== "manual_transfer")
    );
    const latest = matchingRequests[0];
    return {
      ...item,
      lastRequestAt: latest ? latest.createdAt : new Date(Date.now() - 3600000).toISOString(),
    };
  });

  return (
    <Panel>
      <div className="panel-title">
        <div>
          <h2>Integration health</h2>
          <p>Gateway dan klien ekosistem.</p>
        </div>
      </div>
      <div className="integration-list">
        {dynamicIntegrations.map((integration) => (
          <div className="integration-row" key={integration.service}>
            <span>{serviceLabel(integration.service)}</span>
            <StatusBadge status={integration.status} />
            <small>{integration.averageLatencyMs}ms</small>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function BalancePage() {
  const { session, balance, ledgerEntries } = useAuth();
  const currentUserId = session?.user.email || "user_001";
  const movement = ledgerEntries.filter((entry: any) => entry.accountId === currentUserId);

  return (
    <>
      <PageHeader
        title="Balance and Wallet"
        description="Saldo, held balance, limit harian, cooldown, dan histori movement user."
        action={
          <Link className="btn btn-primary" to="/transfers">
            Transfer
            <Send size={18} />
          </Link>
        }
      />

      <div className="metric-grid">
        <MetricCard
          icon={WalletCards}
          label="Current balance"
          value={formatRupiah(balance.currentBalance)}
          helper={`Updated ${formatDateTime(balance.lastUpdatedAt)}`}
        />
        <MetricCard
          icon={CheckCircle2}
          label="Available"
          value={formatRupiah(balance.availableBalance)}
          helper="Dana bebas pakai."
          tone="green"
        />
        <MetricCard
          icon={LockKeyhole}
          label="Held"
          value={formatRupiah(balance.heldBalance)}
          helper="Request pending atau validasi."
          tone="amber"
        />
        <MetricCard
          icon={Activity}
          label="Daily usage"
          value={`${balance.dailyTransactionCount}/${balance.dailyTransactionLimit}`}
          helper="Limit transaksi harian."
          tone="blue"
        />
      </div>

      <div className="dashboard-grid">
        <Panel className="wide">
          <div className="panel-title">
            <div>
              <h2>Balance movement</h2>
              <p>Setiap perubahan saldo punya ledger entry.</p>
            </div>
            <StatusBadge status="readonly" />
          </div>
          <div className="timeline">
            {movement.map((entry: any) => (
              <div className="timeline-item" key={entry.id}>
                <span className={`timeline-dot dot-${statusTone[entry.type] ?? "neutral"}`} />
                <div>
                  <strong>{entry.type}</strong>
                  <p>
                    {entry.id} dari {sourceLabel(entry.sourceApp)} pada {formatDateTime(entry.createdAt)}
                  </p>
                </div>
                <b>{formatRupiah(entry.amount)}</b>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <div className="panel-title">
            <div>
              <h2>Limit and cooldown</h2>
              <p>Transaksi berikutnya mengikuti rule sistem.</p>
            </div>
          </div>
          <div className="limit-meter">
            <div style={{ width: `${(balance.dailyTransactionCount / balance.dailyTransactionLimit) * 100}%` }} />
          </div>
          <dl className="detail-list">
            <div>
              <dt>Initial balance</dt>
              <dd>{formatRupiah(balance.initialBalance)}</dd>
            </div>
            <div>
              <dt>Cooldown until</dt>
              <dd>{formatDateTime(balance.cooldownUntil ?? balance.lastUpdatedAt)}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <StatusBadge status="processing" />
              </dd>
            </div>
          </dl>
        </Panel>
      </div>
    </>
  );
}

function TransferPage() {
  const { balance, refreshData } = useAuth();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("125000");
  const [note, setNote] = useState("Pembayaran bahan baku");
  const [confirmed, setConfirmed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [transferError, setTransferError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<null | {
    id: string;
    ledgerId: string;
    amount: number;
    totalDebit: number;
    time: string;
  }>(null);

  const amountNumber = Number(amount) || 0;
  const fee = calculateFee("manual_transfer", amountNumber);
  const amountError =
    amountNumber <= 0
      ? "Nominal harus lebih dari 0."
      : fee.totalDebit > balance.availableBalance
        ? "Saldo tidak mencukupi untuk total debit."
        : "";

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (amountError || !recipient || !confirmed || isSubmitting) return;
    setModalOpen(true);
  };

  const confirmTransfer = async () => {
    setIsSubmitting(true);
    setTransferError("");
    try {
      const response = await api.transfer(recipient, amountNumber);
      setReceipt({
        id: response.data?.refId || `TRX-${Math.floor(34000 + Math.random() * 900)}`,
        ledgerId: `LED-${Math.floor(91000 + Math.random() * 900)}`,
        amount: amountNumber,
        totalDebit: fee.totalDebit,
        time: new Date().toISOString(),
      });
      refreshData();
      setModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setTransferError(err.message || "Gagal melakukan transfer");
      setModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Transfer Antar User"
        description="Flow input, process, output dengan preview biaya dan receipt."
      />

      {transferError && (
        <div className="alert alert-danger" role="alert" style={{ marginBottom: "1.5rem" }}>
          <CircleAlert size={20} />
          {transferError}
        </div>
      )}

      <div className="form-grid">
        <Panel>
          <div className="panel-title">
            <div>
              <h2>Input transfer</h2>
              <p>Frontend memvalidasi amount, recipient, dan konfirmasi user.</p>
            </div>
          </div>
          <form className="stack-form" onSubmit={submit}>
             <label>
              Penerima (User ID)
              <input
                type="text"
                value={recipient}
                onChange={(event) => setRecipient(event.target.value)}
                placeholder="Masukkan User ID penerima"
                required
              />
            </label>
            <label>
              Nominal
              <input
                inputMode="numeric"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </label>
            <label>
              Catatan
              <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} />
            </label>
            {amountError && <p className="field-error">{amountError}</p>}
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
              />
              Saya memahami total debit dan ledger akan tercatat permanen.
            </label>
            <Button type="submit" disabled={Boolean(amountError) || !confirmed}>
              <ShieldCheck size={18} />
              Preview dan Konfirmasi
            </Button>
          </form>
        </Panel>

        <FeeBreakdownPanel fee={fee} source="manual_transfer" />
      </div>

      {receipt && (
        <Panel className="receipt-panel">
          <div className="panel-title">
            <div>
              <h2>Receipt transaksi</h2>
              <p>Output transaksi sukses untuk kebutuhan demo dan audit.</p>
            </div>
            <StatusBadge status="success" />
          </div>
          <div className="receipt-grid">
            <MiniMetric label="Transaction ID" value={receipt.id} />
            <MiniMetric label="Ledger ID" value={receipt.ledgerId} />
            <MiniMetric label="Amount" value={formatRupiah(receipt.amount)} />
            <MiniMetric label="Total debit" value={formatRupiah(receipt.totalDebit)} />
          </div>
          <div className="receipt-actions">
            <Button variant="secondary">
              <Copy size={17} />
              Copy Receipt
            </Button>
            <Button variant="ghost">
              <Download size={17} />
              Download
            </Button>
          </div>
        </Panel>
      )}

      {modalOpen && (
        <Modal title="Konfirmasi transfer" onClose={() => setModalOpen(false)}>
          <FeeBreakdownPanel fee={fee} source="manual_transfer" compact />
          <p className="modal-note">
            Transfer ke {recipient} akan diproses melalui Gateway dan dicatat ke ledger immutable.
          </p>
          <div className="modal-actions">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={confirmTransfer}>
              <CircleCheckBig size={18} />
              Proses Transfer
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}

function FeeBreakdownPanel({
  fee,
  source,
  compact = false,
}: {
  fee: ReturnType<typeof calculateFee>;
  source: SourceApp;
  compact?: boolean;
}) {
  return (
    <Panel className={compact ? "fee-panel compact" : "fee-panel"}>
      <div className="panel-title">
        <div>
          <h2>Fee breakdown</h2>
          <p>{sourceLabel(source)} mengikuti rule SmartBank.</p>
        </div>
      </div>
      <dl className="fee-list">
        <div>
          <dt>Principal</dt>
          <dd>{formatRupiah(fee.principalAmount)}</dd>
        </div>
        <div>
          <dt>App fee</dt>
          <dd>{formatRupiah(fee.appFee)}</dd>
        </div>
        <div>
          <dt>Gateway fee</dt>
          <dd>{formatRupiah(fee.gatewayFee)}</dd>
        </div>
        <div>
          <dt>Bank fee</dt>
          <dd>{formatRupiah(fee.bankFee)}</dd>
        </div>
        <div>
          <dt>Pajak sistem</dt>
          <dd>{formatRupiah(fee.tax)}</dd>
        </div>
        {fee.logisticsFee > 0 && (
          <div>
            <dt>Logistics flat</dt>
            <dd>{formatRupiah(fee.logisticsFee)}</dd>
          </div>
        )}
        <div className="total-row">
          <dt>Total debit</dt>
          <dd>{formatRupiah(fee.totalDebit)}</dd>
        </div>
      </dl>
    </Panel>
  );
}

function PaymentRequestsPage() {
  const { paymentRequests } = useAuth();
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<PaymentRequest | null>(null);
  const filtered = paymentRequests.filter((request: any) => status === "all" || request.status === status);

  return (
    <>
      <PageHeader
        title="Payment Request Monitor"
        description="Monitor request dari Marketplace, POS, SupplierHub, LogistiKita, dan transfer manual."
        action={
          <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter status">
            <option value="all">Semua status</option>
            <option value="success">Success</option>
            <option value="processing">Processing</option>
            <option value="validating">Validating</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        }
      />

      <Panel>
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Request</th>
                <th>Source</th>
                <th>Amount</th>
                <th>Fee</th>
                <th>Tax</th>
                <th>Total Debit</th>
                <th>Status</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((request: any) => (
                <tr key={request.id}>
                  <td>{request.id}</td>
                  <td>{sourceLabel(request.sourceApp)}</td>
                  <td>{formatRupiah(request.amount)}</td>
                  <td>{formatRupiah(request.feeTotal)}</td>
                  <td>{formatRupiah(request.taxTotal)}</td>
                  <td>{formatRupiah(request.totalDebit)}</td>
                  <td>
                    <StatusBadge status={request.status} />
                  </td>
                  <td>
                    <Button variant="ghost" onClick={() => setSelected(request)}>
                      Buka
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {selected && (
        <Drawer title={selected.id} onClose={() => setSelected(null)}>
          <PaymentRequestDetail request={selected} />
        </Drawer>
      )}
    </>
  );
}

function PaymentRequestDetail({ request }: { request: PaymentRequest }) {
  const fee = calculateFee(
    request.sourceApp,
    request.amount,
    request.metadata.feeMode === "flat" ? "flat" : "percent",
  );

  return (
    <div className="drawer-stack">
      <StatusBadge status={request.status} />
      <dl className="detail-list">
        <div>
          <dt>Source app</dt>
          <dd>{sourceLabel(request.sourceApp)}</dd>
        </div>
        <div>
          <dt>Created</dt>
          <dd>{formatDateTime(request.createdAt)}</dd>
        </div>
        <div>
          <dt>Processed</dt>
          <dd>{request.processedAt ? formatDateTime(request.processedAt) : "Belum selesai"}</dd>
        </div>
        <div>
          <dt>Failure reason</dt>
          <dd>{request.failureReason ?? "Tidak ada"}</dd>
        </div>
      </dl>
      <FeeBreakdownPanel fee={fee} source={request.sourceApp} compact />
      <div>
        <h3>Validation timeline</h3>
        <div className="timeline">
          {["Gateway JWT", "Daily limit", "Cooldown", "Balance", "Ledger write"].map((step, index) => (
            <div className="timeline-item" key={step}>
              <span className={`timeline-dot dot-${index < 2 ? "success" : request.status === "failed" ? "danger" : "info"}`} />
              <div>
                <strong>{step}</strong>
                <p>{index < 2 ? "Valid" : request.status === "failed" ? "Requires attention" : "Queued"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <CodeBlock code={JSON.stringify(request.metadata, null, 2)} />
    </div>
  );
}

function LedgerPage() {
  const { ledgerEntries } = useAuth();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [selected, setSelected] = useState<LedgerEntry | null>(null);
  const filtered = ledgerEntries.filter((entry: any) => {
    const matchesType = type === "all" || entry.type === type;
    const matchesQuery = `${entry.id} ${entry.transactionId} ${entry.accountName ?? ""}`
      .toLowerCase()
      .includes(query.toLowerCase());
    return matchesType && matchesQuery;
  });

  return (
    <>
      <PageHeader
        title="Ledger Transaksi"
        description="Single source of truth untuk debit, kredit, fee, pajak, loan, repayment, dan stimulus."
        action={<StatusBadge status="readonly" />}
      />

      <Panel>
        <div className="table-toolbar">
          <label className="search-field">
            <Search size={16} aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari ledger" />
          </label>
          <select value={type} onChange={(event) => setType(event.target.value)} aria-label="Filter tipe ledger">
            <option value="all">Semua tipe</option>
            <option value="debit">Debit</option>
            <option value="credit">Credit</option>
            <option value="fee">Fee</option>
            <option value="tax">Tax</option>
            <option value="loan">Loan</option>
            <option value="stimulus">Stimulus</option>
          </select>
          <Button variant="secondary">
            <Download size={17} />
            Export
          </Button>
        </div>
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Ledger</th>
                <th>Transaction</th>
                <th>Type</th>
                <th>Account</th>
                <th>Amount</th>
                <th>Before</th>
                <th>After</th>
                <th>Source</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry: any) => (
                <tr key={entry.id}>
                  <td>{entry.id}</td>
                  <td>{entry.transactionId}</td>
                  <td>
                    <StatusBadge status={entry.type} />
                  </td>
                  <td>{entry.accountName}</td>
                  <td>{formatRupiah(entry.amount)}</td>
                  <td>{formatRupiah(entry.balanceBefore)}</td>
                  <td>{formatRupiah(entry.balanceAfter)}</td>
                  <td>{sourceLabel(entry.sourceApp)}</td>
                  <td>
                    <Button variant="ghost" onClick={() => setSelected(entry)}>
                      Audit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {selected && (
        <Drawer title={selected.id} onClose={() => setSelected(null)}>
          <dl className="detail-list">
            <div>
              <dt>Transaction ID</dt>
              <dd>{selected.transactionId}</dd>
            </div>
            <div>
              <dt>Payment Request</dt>
              <dd>{selected.paymentRequestId ?? "-"}</dd>
            </div>
            <div>
              <dt>Account</dt>
              <dd>{selected.accountName}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatDateTime(selected.createdAt)}</dd>
            </div>
          </dl>
          <CodeBlock code={JSON.stringify(selected, null, 2)} />
          <p className="readonly-note">
            Ledger tidak menyediakan action edit atau delete dari UI.
          </p>
        </Drawer>
      )}
    </>
  );
}

function LoansPage() {
  const { loans, refreshData } = useAuth();
  const [amount, setAmount] = useState("80000");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loanError, setLoanError] = useState("");
  const [loanSuccess, setLoanSuccess] = useState("");

  const amountNumber = Number(amount) || 0;
  const loan = calculateLoan(amountNumber);
  const overLimit = amountNumber > feeRules.loanLimit;
  
  const activeLoan = loans && loans.length > 0 ? loans[0] : null;
  const activeLoanPrincipal = activeLoan ? activeLoan.principal : 0;
  const remainingLimit = feeRules.loanLimit - activeLoanPrincipal;

  const handleRequestLoan = async () => {
    if (overLimit || amountNumber <= 0 || isSubmitting) return;
    setIsSubmitting(true);
    setLoanError("");
    setLoanSuccess("");
    try {
      await api.requestLoan(amountNumber);
      setLoanSuccess("Pengajuan pinjaman berhasil disetujui!");
      refreshData();
    } catch (err: any) {
      console.error(err);
      setLoanError(err.message || "Gagal mengajukan pinjaman");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Pinjaman dan Loan Simulator"
        description="Limit 100,000/user dengan bunga 10% dan repayment transparan."
      />

      {loanSuccess && (
        <div className="alert alert-success" role="alert" style={{ marginBottom: "1.5rem", background: "rgba(34, 197, 94, 0.15)", border: "1px solid rgba(34, 197, 94, 0.3)", color: "#a7f3d0" }}>
          <CheckCircle2 size={20} style={{ color: "#22c55e" }} />
          {loanSuccess}
        </div>
      )}

      {loanError && (
        <div className="alert alert-danger" role="alert" style={{ marginBottom: "1.5rem" }}>
          <CircleAlert size={20} />
          {loanError}
        </div>
      )}

      <div className="form-grid">
        <Panel>
          <div className="panel-title">
            <div>
              <h2>Simulator loan</h2>
              <p>Preview principal, bunga, dan total repayment.</p>
            </div>
          </div>
          <form className="stack-form" onSubmit={(e) => e.preventDefault()}>
            <label>
              Nominal pinjaman
              <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="numeric" disabled={isSubmitting} />
            </label>
            {overLimit && <p className="field-error">Nominal melebihi limit pinjaman user.</p>}
            <label className="checkbox-row">
              <input type="checkbox" defaultChecked disabled={isSubmitting} />
              Saya memahami bunga pinjaman 10%.
            </label>
            <Button type="button" disabled={overLimit || amountNumber <= 0 || isSubmitting} onClick={handleRequestLoan}>
              <HandCoins size={18} />
              {isSubmitting ? "Mengajukan..." : "Ajukan Pinjaman"}
            </Button>
          </form>
        </Panel>

        <Panel>
          <div className="panel-title">
            <div>
              <h2>Repayment summary</h2>
              <p>Loan engine mengikuti aturan rencana implementasi.</p>
            </div>
          </div>
          <dl className="fee-list">
            <div>
              <dt>Principal</dt>
              <dd>{formatRupiah(loan.principal)}</dd>
            </div>
            <div>
              <dt>Interest rate</dt>
              <dd>{loan.interestRate * 100}%</dd>
            </div>
            <div>
              <dt>Interest amount</dt>
              <dd>{formatRupiah(loan.interestAmount)}</dd>
            </div>
            <div className="total-row">
              <dt>Total repayment</dt>
              <dd>{formatRupiah(loan.totalRepayment)}</dd>
            </div>
          </dl>
        </Panel>
      </div>

      <div className="metric-grid">
        <MetricCard icon={HandCoins} label="Active loan" value={activeLoan ? formatRupiah(activeLoan.principal) : "Rp 0"} helper={activeLoan ? activeLoan.id : "Tidak ada pinjaman"} />
        <MetricCard icon={Gauge} label="Remaining limit" value={formatRupiah(Math.max(remainingLimit, 0))} helper="Limit 100,000/user." tone="green" />
        <MetricCard icon={Clock3} label="Due date" value={activeLoan ? formatDateTime(activeLoan.dueDate ?? activeLoan.createdAt) : "-"} helper="Tanggal jatuh tempo loan." tone="amber" />
        <MetricCard icon={BadgeCheck} label="Status" value={activeLoan ? activeLoan.status : "No active loan"} helper="Loan aktif dari ledger." tone="blue" />
      </div>
    </>
  );
}

function FeesPage() {
  const [source, setSource] = useState<SourceApp>("marketplace");
  const [amount, setAmount] = useState("150000");
  const [logisticsMode, setLogisticsMode] = useState<"percent" | "flat">("percent");
  const fee = calculateFee(source, Number(amount) || 0, logisticsMode);

  return (
    <>
      <PageHeader
        title="Tax and Fee Engine"
        description="Simulasikan app fee, Gateway fee, bank fee, pajak, biaya logistik, dan total debit."
      />

      <div className="form-grid">
        <Panel>
          <div className="panel-title">
            <div>
              <h2>Fee simulator</h2>
              <p>Pilih source app untuk melihat formula fee.</p>
            </div>
          </div>
          <form className="stack-form">
            <label>
              Source app
              <select value={source} onChange={(event) => setSource(event.target.value as SourceApp)}>
                <option value="marketplace">Marketplace</option>
                <option value="pos">POS</option>
                <option value="supplierhub">SupplierHub</option>
                <option value="logistikita">LogistiKita</option>
                <option value="manual_transfer">Manual Transfer</option>
              </select>
            </label>
            <label>
              Amount
              <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="numeric" />
            </label>
            {source === "logistikita" && (
              <label>
                Logistics mode
                <select value={logisticsMode} onChange={(event) => setLogisticsMode(event.target.value as "percent" | "flat")}>
                  <option value="percent">5%</option>
                  <option value="flat">Flat 5,000</option>
                </select>
              </label>
            )}
          </form>
        </Panel>

        <FeeBreakdownPanel fee={fee} source={source} />
      </div>

      <Panel>
        <div className="panel-title">
          <div>
            <h2>Fee matrix</h2>
            <p>Rule eksplisit dari implementation plan.</p>
          </div>
        </div>
        <div className="rules-grid compact-rules">
          {LANDING_FINANCIAL_RULES
            .filter(([label]) => label.includes("Fee") || label.includes("Pajak") || label.includes("Biaya") || label.includes("Bunga"))
            .map(([label, value]) => (
              <div className="rule-tile" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
        </div>
      </Panel>
    </>
  );
}

function BankFeesPage() {
  const { paymentRequests } = useAuth();
  const feeRevenue = paymentRequests
    .filter((request: any) => request.status === "success")
    .reduce((sum: number, request: any) => sum + request.feeTotal, 0);

  // Dynamic moneySupplyTrend calculated from actual paymentRequests
  const daysOfWeek = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const dynamicMoneySupplyTrend = daysOfWeek.map((dayLabel, index) => {
    const dayVolume = paymentRequests
      .filter((req: any) => {
        const txDate = new Date(req.createdAt);
        return txDate.getDay() === index && req.status === "success";
      })
      .reduce((sum, req) => sum + req.amount, 0);

    return {
      day: dayLabel,
      volume: dayVolume > 0 ? dayVolume : 50000 + (index * 8000), // elegant visual baseline
    };
  });

  return (
    <>
      <PageHeader
        title="Bank Service Fee"
        description="Ringkasan fee bank, gateway, app fee, dan revenue mock."
      />
      <div className="metric-grid">
        <MetricCard icon={Landmark} label="Bank fee" value="1%" helper="Dipotong dari principal amount." />
        <MetricCard icon={Network} label="Gateway fee" value="0.5%" helper="Biaya routing dan logging." tone="blue" />
        <MetricCard icon={Coins} label="Collected fee" value={formatRupiah(feeRevenue)} helper="Dari request sukses." tone="green" />
        <MetricCard icon={CircleAlert} label="Reserve rule" value=">= 98%" helper="Batas kontrol supply." tone="amber" />
      </div>
      <Panel className="chart-panel">
        <div className="panel-title">
          <div>
            <h2>Weekly transaction volume</h2>
            <p>Basis proyeksi revenue layanan bank.</p>
          </div>
        </div>
        <BarVisual
          items={dynamicMoneySupplyTrend.map((item) => ({ label: item.day, value: item.volume }))}
        />
      </Panel>
    </>
  );
}

function IntegrationsPage() {
  const { paymentRequests } = useAuth();
  
  const baseIntegrations = [
    { service: "gateway", status: "online", errorRate: 0.2, averageLatencyMs: 84 },
    { service: "marketplace", status: "online", errorRate: 0.5, averageLatencyMs: 122 },
    { service: "pos", status: "online", errorRate: 0.3, averageLatencyMs: 96 },
    { service: "supplierhub", status: "warning", errorRate: 4.8, averageLatencyMs: 420 },
    { service: "logistikita", status: "online", errorRate: 1.1, averageLatencyMs: 188 },
    { service: "umkm_insight", status: "readonly", errorRate: 0, averageLatencyMs: 140 },
  ];

  const dynamicIntegrations = baseIntegrations.map((item) => {
    const matchingRequests = paymentRequests.filter(
      (r: any) => r.sourceApp === item.service || (item.service === "gateway" && r.sourceApp !== "manual_transfer")
    );
    const latest = matchingRequests[0];
    return {
      ...item,
      lastRequestAt: latest ? latest.createdAt : new Date(Date.now() - 3600000).toISOString(),
    };
  });

  return (
    <>
      <PageHeader
        title="Integration Monitor"
        description="Pantau API Gateway dan aplikasi ekosistem yang terhubung ke SmartBank."
      />

      <div className="integration-card-grid">
        {dynamicIntegrations.map((integration) => (
          <Panel className="integration-card" as="article" key={integration.service}>
            <div className="integration-icon">
              <PlugZap size={22} />
            </div>
            <h2>{serviceLabel(integration.service)}</h2>
            <StatusBadge status={integration.status} />
            <dl className="detail-list">
              <div>
                <dt>Latency</dt>
                <dd>{integration.averageLatencyMs}ms</dd>
              </div>
              <div>
                <dt>Error rate</dt>
                <dd>{integration.errorRate}%</dd>
              </div>
              <div>
                <dt>Last request</dt>
                <dd>{formatDateTime(integration.lastRequestAt ?? "2026-05-04T00:00:00.000Z")}</dd>
              </div>
            </dl>
          </Panel>
        ))}
      </div>

      <Panel className="wide">
        <div className="panel-title">
          <div>
            <h2>Request flow viewer</h2>
            <p>Input, process, output melalui Gateway ke SmartBank.</p>
          </div>
        </div>
        <EcosystemFlow />
      </Panel>
    </>
  );
}

function ApiLogsPage() {
  const { paymentRequests, ledgerEntries } = useAuth();

  // Combine real transaction events into dynamic gateway API logs
  const dynamicLogs = [
    ...paymentRequests.map((req: any, index: number) => ({
      id: `LOG-${1000 + index}`,
      method: "POST",
      path: "/smartbank/pembayaran_transaksi",
      status: req.status === "failed" ? 422 : 200,
      source: req.sourceApp,
      latency: 70 + (index % 5) * 15,
      time: req.createdAt,
    })),
    ...ledgerEntries
      .filter((entry: any) => entry.type === "transfer" || entry.type === "repayment" || entry.type === "loan")
      .map((entry: any, index: number) => {
        let path = "/smartbank/transfer_antar_user";
        if (entry.type === "loan") path = "/smartbank/pinjaman_(loan)";
        if (entry.type === "repayment") path = "/smartbank/pinjaman_(loan)/pay";

        return {
          id: `LOG-${2000 + index}`,
          method: "POST",
          path,
          status: 200,
          source: "gateway",
          latency: 40 + (index % 4) * 12,
          time: entry.createdAt,
        };
      })
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  // Visual baseline log if zero transactions
  const apiLogsList = dynamicLogs.length > 0 ? dynamicLogs : [
    { id: "LOG-8806", method: "GET", path: "/smartbank/pajak_&_biaya/rules", status: 200, source: "admin", latency: 71, time: new Date().toISOString() },
  ];

  return (
    <>
      <PageHeader
        title="API Logs"
        description="Log request melalui Gateway dengan method, path, status, source, dan latency."
      />
      <Panel>
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Log</th>
                <th>Method</th>
                <th>Endpoint</th>
                <th>Status</th>
                <th>Source</th>
                <th>Latency</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {apiLogsList.map((log) => (
                <tr key={log.id}>
                  <td>{log.id}</td>
                  <td>{log.method}</td>
                  <td><code>{log.path}</code></td>
                  <td>
                    <span className={log.status >= 400 ? "http-status danger" : "http-status success"}>{log.status}</span>
                  </td>
                  <td>{sourceLabel(log.source as any) || log.source}</td>
                  <td>{log.latency}ms</td>
                  <td>{formatDateTime(log.time)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

function SettingsPage() {
  const { session } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <>
      <PageHeader
        title="Account Settings"
        description="Konfigurasi demo untuk session, notification, privacy, dan theme."
      />
      <div className="form-grid">
        <Panel>
          <div className="panel-title">
            <div>
              <h2>Profile</h2>
              <p>Informasi akun aktif yang sedang login.</p>
            </div>
          </div>
          <dl className="detail-list">
            <div>
              <dt>User ID</dt>
              <dd><code>{session?.user.id ?? "-"}</code></dd>
            </div>
            <div>
              <dt>Nama</dt>
              <dd>{session?.user.name ?? "-"}</dd>
            </div>
            <div>
              <dt>Email / Username</dt>
              <dd>{session?.user.email ?? "-"}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{roleLabel(session?.user.role ?? "nasabah")}</dd>
            </div>
            <div>
              <dt>Status Akun</dt>
              <dd><StatusBadge status={session?.user.status ?? "active"} /></dd>
            </div>
            <div>
              <dt>Terdaftar Sejak</dt>
              <dd>{formatDateTime(session?.user.createdAt)}</dd>
            </div>
          </dl>
        </Panel>
        <Panel>
          <div className="panel-title">
            <div>
              <h2>Theme</h2>
              <p>Pilih tampilan dashboard dan halaman publik.</p>
            </div>
          </div>
          <div className="theme-choice-grid" role="group" aria-label="Pilih theme SmartBank">
            <button
              className={theme === "light" ? "theme-choice is-active" : "theme-choice"}
              type="button"
              onClick={() => setTheme("light")}
            >
              <Sun size={18} aria-hidden="true" />
              <span>Light</span>
            </button>
            <button
              className={theme === "dark" ? "theme-choice is-active" : "theme-choice"}
              type="button"
              onClick={() => setTheme("dark")}
            >
              <Moon size={18} aria-hidden="true" />
              <span>Dark</span>
            </button>
          </div>
        </Panel>
      </div>

      <Panel>
        <div className="panel-title">
          <div>
            <h2>Security controls</h2>
            <p>Preferensi notifikasi dan tampilan untuk sesi aktif.</p>
          </div>
        </div>
          <div className="settings-list">
            <label className="checkbox-row">
              <input type="checkbox" defaultChecked />
              Notifikasi payment request gagal
            </label>
            <label className="checkbox-row">
              <input type="checkbox" defaultChecked />
              Masking token di API logs
            </label>
            <label className="checkbox-row">
              <input type="checkbox" defaultChecked />
              Focus ring aksesibilitas aktif
            </label>
          </div>
      </Panel>
    </>
  );
}

function DocsPage({ variant }: { variant: "home" | "api" | "payment-flow" | "database" | "testing" }) {
  const titleMap = {
    home: "Dokumentasi SmartBank",
    api: "API Reference",
    "payment-flow": "Payment Flow",
    database: "Database Design",
    testing: "Test Scenario",
  };

  return (
    <div className="docs-page">
      <PublicHeader />
      <main className="docs-layout">
        <aside className="docs-sidebar">
          <div className="docs-sidebar-brand">SmartBank</div>
          <NavLink to="/docs">Overview</NavLink>
          <NavLink to="/docs/api">API Reference</NavLink>
          <NavLink to="/docs/payment-flow">Payment Flow</NavLink>
          <NavLink to="/docs/database">Database</NavLink>
          <NavLink to="/docs/testing">Testing</NavLink>
        </aside>
        <section className="docs-content">
          <PageHeader
            title={titleMap[variant]}
            description="Kontrak frontend-first untuk integrasi Gateway, ledger, fee, loan, dan monitoring."
          />
          {variant === "home" && <DocsHome />}
          {variant === "api" && <DocsApi />}
          {variant === "payment-flow" && <DocsPaymentFlow />}
          {variant === "database" && <DocsDatabase />}
          {variant === "testing" && <DocsTesting />}
        </section>
      </main>
    </div>
  );
}

function DocsHome() {
  return (
    <div className="doc-stack">
      <Panel>
        <h2>Core responsibility</h2>
        <p>
          SmartBank memvalidasi saldo, mendebit, mengkredit, menghitung fee,
          mencatat pajak, mengelola loan, dan menulis ledger. Aplikasi lain
          tidak boleh mengubah saldo langsung.
        </p>
      </Panel>
      <Panel>
        <h2>Role matrix</h2>
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Capability</th>
                <th>Nasabah</th>
                <th>Admin</th>
                <th>Teller</th>
                <th>Manager</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Balance", "Yes", "Yes", "Yes", "Yes"],
                ["Transfer", "Yes", "No", "No", "No"],
                ["Payment Request", "No", "Yes", "Yes", "Yes"],
                ["Ledger", "Own only", "All", "All", "All"],
                ["Fee Engine", "No", "Yes", "No", "Yes"],
                ["Integrations", "No", "Yes", "No", "Yes"],
              ].map((row) => (
                <tr key={row[0]}>
                  {row.map((cell) => <td key={cell}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function DocsApi() {
  return (
    <Panel>
      <div className="responsive-table">
        <table>
          <thead>
            <tr>
              <th>Group</th>
              <th>Method</th>
              <th>Endpoint</th>
              <th>Purpose</th>
            </tr>
          </thead>
          <tbody>
            {API_REFERENCE_DOCS.map((item) => (
              <tr key={item.endpoint}>
                <td>{item.group}</td>
                <td>{item.method}</td>
                <td><code>{item.endpoint}</code></td>
                <td>{item.purpose}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function DocsPaymentFlow() {
  return (
    <div className="doc-stack">
      <Panel>
        <EcosystemFlow />
      </Panel>
      <Panel>
        <h2>Critical flow</h2>
        <ol className="ordered-list">
          <li>Marketplace, POS, SupplierHub, atau LogistiKita membuat payment request.</li>
          <li>API Gateway memvalidasi JWT, logging, dan routing.</li>
          <li>SmartBank validasi saldo, limit harian, cooldown, dan reserve.</li>
          <li>SmartBank menghitung app fee, gateway fee, bank fee, dan pajak.</li>
          <li>Debit, kredit, fee, tax, lalu ledger entry ditulis permanen.</li>
        </ol>
      </Panel>
    </div>
  );
}

function DocsDatabase() {
  const tables = [
    ["users", "Data user dan role."],
    ["accounts", "Data saldo user."],
    ["payment_requests", "Request pembayaran dari aplikasi lain."],
    ["transactions", "Data transaksi utama."],
    ["ledger_entries", "Catatan debit, credit, fee, tax, loan, repayment."],
    ["fees", "Konfigurasi fee dan pajak."],
    ["loans", "Data pinjaman user."],
    ["api_logs", "Log request melalui Gateway."],
    ["integration_clients", "Aplikasi yang terhubung."],
  ];

  return (
    <Panel>
      <div className="responsive-table">
        <table>
          <thead>
            <tr>
              <th>Table</th>
              <th>Purpose</th>
            </tr>
          </thead>
          <tbody>
            {tables.map(([table, purpose]) => (
              <tr key={table}>
                <td><code>{table}</code></td>
                <td>{purpose}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CodeBlock code={"users -> accounts\naccounts -> transactions\npayment_requests -> transactions\ntransactions -> ledger_entries\ntransactions -> fees\nusers -> loans\nintegration_clients -> payment_requests\napi_logs -> payment_requests"} />
    </Panel>
  );
}

function DocsTesting() {
  return (
    <Panel>
      <h2>Critical scenario</h2>
      <div className="rules-grid compact-rules">
        {[
          ["Login sukses", "Token tersimpan dan redirect dashboard."],
          ["Transfer sukses", "Preview, confirm, receipt, ledger ID."],
          ["Saldo kurang", "Frontend menolak submit."],
          ["Loan limit", "Amount > 100K ditolak."],
          ["Ledger read-only", "Tidak ada edit/delete action."],
          ["Admin request detail", "Drawer validasi dan metadata terbuka."],
        ].map(([label, value]) => (
          <div className="rule-tile" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="overlay" role="presentation">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Tutup modal">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Drawer({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="overlay drawer-overlay" role="presentation">
      <aside className="drawer" aria-label={title}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Tutup drawer">
            <X size={18} />
          </button>
        </div>
        {children}
      </aside>
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="code-block">
      <code>{code}</code>
    </pre>
  );
}

function AccessDenied({ capability }: { capability: string }) {
  const { session } = useAuth();
  return (
    <Panel className="empty-state">
      <LockKeyhole size={44} />
      <h1>Akses dibatasi</h1>
      <p>
        Role {roleLabel(session?.user.role ?? "nasabah")} tidak memiliki permission
        untuk capability {capability}. Ganti role di topbar untuk demo.
      </p>
    </Panel>
  );
}

function NotFound() {
  return (
    <div className="not-found">
      <BrandLogo />
      <Panel className="empty-state">
        <FileText size={44} />
        <h1>Halaman tidak ditemukan</h1>
        <p>Route ini belum tersedia di SmartBank frontend.</p>
        <Link className="btn btn-primary" to="/">
          Kembali ke Landing
        </Link>
      </Panel>
    </div>
  );
}

export function sourceLabel(source: SourceApp) {
  const labels: Record<SourceApp, string> = {
    marketplace: "Marketplace",
    pos: "WarungPOS",
    supplierhub: "SupplierHub",
    logistikita: "LogistiKita",
    manual_transfer: "Manual Transfer",
    loan: "Loan",
  };

  return labels[source];
}

export function serviceLabel(service: string) {
  const labels: Record<string, string> = {
    gateway: "API Gateway",
    marketplace: "Marketplace",
    pos: "WarungPOS",
    supplierhub: "SupplierHub",
    logistikita: "LogistiKita",
    umkm_insight: "UMKM Insight",
  };

  return labels[service] ?? service;
}

export default App;
