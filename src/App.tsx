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
  UserPlus,
  Users,
  WalletCards,
  Workflow,
  X,
} from "lucide-react";
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
import {
  apiLogs,
  apiReference,
  balance,
  financialRules,
  integrations,
  ledgerEntries,
  loans,
  moneySupplyTrend,
  paymentRequests,
  sourceDistribution,
  users,
} from "./data";
import type { LedgerEntry, PaymentRequest, SourceApp, User, UserRole } from "./types";
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
  login: (role: UserRole, email?: string) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
};

type ThemeMode = "dark" | "light";

type ThemeContextValue = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const ThemeContext = createContext<ThemeContextValue | null>(null);

const roleOptions: Array<{ label: string; value: UserRole }> = [
  { label: "User", value: "user" },
  { label: "Admin", value: "admin" },
  { label: "Developer", value: "developer" },
  { label: "Insight Read-only", value: "insight_readonly" },
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

const statusTone: Record<string, string> = {
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

function useAuth() {
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
  return users.find((user) => user.role === role) ?? users[0];
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
      return JSON.parse(raw) as Session;
    } catch {
      localStorage.removeItem("smartbank-session");
      return null;
    }
  });

  const login = (role: UserRole, email?: string) => {
    const user = {
      ...getUserByRole(role),
      email: email?.trim() || getUserByRole(role).email,
    };
    const nextSession = {
      token: `mock-jwt-${role}-smartbank`,
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
    () => ({ session, login, logout, switchRole }),
    [session],
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

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (capability && !canAccess(session.user.role, capability)) {
    return (
      <AppShell>
        <AccessDenied capability={capability} />
      </AppShell>
    );
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
            <strong>{roleLabel(session?.user.role ?? "user")}</strong>
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

function PublicHeader() {
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
  useLandingAnimations();

  const maxVolume = Math.max(...moneySupplyTrend.map((item) => item.volume));
  const successCount = paymentRequests.filter((request) => request.status === "success").length;

  return (
    <div className="landing-page">
      <PublicHeader />

      <section id="overview" className="landing-hero">
        <div className="hero-shell">
          <div className="hero-copy">
            <span className="hero-eyebrow">
              <Sparkles size={18} aria-hidden="true" />
              Smart finance OS untuk transaksi UMKM
            </span>
            <h1>Banking dashboard yang cepat, jelas, dan siap diaudit.</h1>
            <p>
              SmartBank menggabungkan saldo, payment request, fee engine, role guard,
              dan ledger immutable dalam satu pengalaman yang ringan untuk user,
              admin, developer, dan insight team.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary btn-lg" to="/login">
                Buka Demo
                <ArrowRight size={20} />
              </Link>
              <Link className="btn btn-secondary btn-lg" to="/docs/api">
                Lihat API
                <ChevronRight size={20} />
              </Link>
            </div>
            <div className="hero-assurance" aria-label="SmartBank assurance">
              <span>
                <ShieldCheck size={16} aria-hidden="true" />
                Reserve 98%
              </span>
              <span>
                <Activity size={16} aria-hidden="true" />
                Gateway 84 ms
              </span>
              <span>
                <Database size={16} aria-hidden="true" />
                Ledger read-only
              </span>
            </div>
          </div>

          <div className="hero-product" aria-label="Preview produk SmartBank">
            <div className="hero-panel hero-balance-card">
              <div className="hero-panel-top">
                <span>{brandName} Balance</span>
                <StatusBadge status="online" />
              </div>
              <div className="hero-balance-value">
                <span>Available balance</span>
                <strong>{formatRupiah(balance.availableBalance)}</strong>
              </div>
              <div className="hero-action-grid">
                <span>
                  <Send size={18} aria-hidden="true" />
                  Kirim
                </span>
                <span>
                  <Download size={18} aria-hidden="true" />
                  Terima
                </span>
                <span>
                  <CreditCard size={18} aria-hidden="true" />
                  Kartu
                </span>
              </div>
              <div className="hero-chart" aria-label="Weekly transaction volume">
                {moneySupplyTrend.map((item) => (
                  <span key={item.day} style={{ height: `${(item.volume / maxVolume) * 100}%` }}>
                    <b>{item.day}</b>
                  </span>
                ))}
              </div>
            </div>

            <div className="hero-side-panel hero-ledger-panel">
              <div className="hero-panel-top">
                <span>Ledger stream</span>
                <ScrollText size={18} aria-hidden="true" />
              </div>
              {ledgerEntries.slice(0, 3).map((entry, index) => (
                <div
                  className={index === 0 ? "hero-ledger-row is-active" : "hero-ledger-row"}
                  key={entry.id}
                >
                  <span>{entry.id}</span>
                  <strong>{formatRupiah(entry.amount)}</strong>
                </div>
              ))}
            </div>

            <div className="hero-side-panel hero-fee-panel">
              <div className="hero-panel-top">
                <span>Fee preview</span>
                <BadgeCheck size={18} aria-hidden="true" />
              </div>
              <dl>
                <div>
                  <dt>App fee</dt>
                  <dd>2%</dd>
                </div>
                <div>
                  <dt>Gateway</dt>
                  <dd>0.5%</dd>
                </div>
                <div>
                  <dt>Tax</dt>
                  <dd>2%</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <div className="hero-proof">
          <MiniMetric label="Cadangan Bank" value="98.0%" />
          <MiniMetric label="Payment sukses" value={`${successCount} request`} />
          <MiniMetric label="Limit harian" value="10 trx" />
          <MiniMetric label="Gateway" value="84 ms" />
        </div>
      </section>

      <section id="features" className="landing-section motion-reveal">
        <SectionHeading
          title="Semua operasi penting terlihat sejak awal."
          description="Landing page dibuat seperti preview produk sungguhan: status, kontrol, dan aturan finansial tampil jelas tanpa membuat layar terasa padat."
        />
        <div className="feature-grid">
          {[
            {
              icon: Shield,
              title: "Balance guard",
              text: "Marketplace, POS, SupplierHub, dan LogistiKita hanya mengirim payment request melalui Gateway.",
            },
            {
              icon: ReceiptText,
              title: "Fee breakdown",
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
            {
              icon: Users,
              title: "Role-aware routes",
              text: "User, admin, developer, dan insight read-only mendapat akses sesuai permission matrix demo.",
            },
            {
              icon: Banknote,
              title: "Loan preview",
              text: "Limit pinjaman, bunga, repayment, dan status aktif dibuat mudah dipindai sebelum masuk dashboard.",
            },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <article
                className={
                  index === 0
                    ? "feature-card feature-card-wide stagger-item"
                    : "feature-card stagger-item"
                }
                key={item.title}
              >
                <Icon size={24} aria-hidden="true" />
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="flow" className="landing-section flow-band motion-reveal">
        <SectionHeading
          title="Spend, send, settle, audit."
          description="Alur dibuat linear dan mudah dipahami di desktop maupun mobile, dengan SmartBank sebagai pusat validasi sebelum saldo bergerak."
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
              tetap jelas untuk user, admin, developer, dan insight read-only.
            </p>
          </div>
        </div>
      </section>

      <section id="security" className="landing-section motion-reveal">
        <SectionHeading
          title="Security dan rule engine bukan catatan kecil."
          description="Bagian ini memadatkan kontrol finansial menjadi kartu informasi yang rapi, sehingga pengguna paham apa yang dijaga SmartBank."
        />
        <div className="security-grid">
          <article className="security-panel security-panel-large stagger-item">
            <ShieldCheck size={28} aria-hidden="true" />
            <h3>Every request is checked before money moves.</h3>
            <p>
              SmartBank menahan flow di gateway, validasi saldo, hitung fee, lalu
              menulis ledger supaya demo tetap transparan dari awal sampai akhir.
            </p>
            <div className="security-rules">
              {financialRules.slice(0, 6).map(([label, value]) => (
                <span key={label}>
                  <small>{label}</small>
                  <strong>{value}</strong>
                </span>
              ))}
            </div>
          </article>
          <article className="security-panel stagger-item">
            <KeyRound size={24} aria-hidden="true" />
            <h3>Mock JWT session</h3>
            <p>Auth route tetap sederhana untuk demo, tapi status role dan guard terlihat jelas.</p>
          </article>
          <article className="security-panel stagger-item">
            <LineChart size={24} aria-hidden="true" />
            <h3>Realtime posture</h3>
            <p>Latency, error rate, dan request state dirancang untuk cepat dipindai.</p>
          </article>
          <article className="security-panel stagger-item">
            <CircleCheckBig size={24} aria-hidden="true" />
            <h3>Audit ready</h3>
            <p>Ledger read-only menjaga catatan debit, credit, fee, tax, dan loan.</p>
          </article>
        </div>
      </section>

      <section className="landing-cta motion-reveal">
        <div className="landing-cta-brand">SmartBank</div>
        <div>
          <h2>Masuk ke demo dan rasakan flow end-to-end.</h2>
          <p>
            Jalankan demo sebagai user, admin, developer, atau Insight read-only
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
              <strong style={{ fontSize: "2.5rem", color: "var(--text)" }}>{formatRupiah(balance.availableBalance)}</strong>
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
              tetap jelas untuk user, admin, developer, dan insight read-only.
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
          {financialRules.map(([label, value]) => (
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
            Jalankan demo sebagai user, admin, developer, atau Insight read-only
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

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole>("user");
  const [email, setEmail] = useState("ayu@smartbank.local");
  const [password, setPassword] = useState("smartbank-demo");
  const [error, setError] = useState("");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.includes("@")) {
      setError("Email tidak valid.");
      return;
    }
    if (!password.trim()) {
      setError("Password wajib diisi.");
      return;
    }

    setError("");
    login(role, email);
    navigate("/dashboard");
  };

  return (
    <AuthLayout
      title="Masuk ke SmartBank"
      description="Masuk dengan akun demo untuk membuka dashboard sesuai role dan permission."
    >
      <form className="stack-form" onSubmit={submit}>
        <label>
          Email
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
        </label>
        <label>
          Role Demo
          <select value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="auth-form-row">
          <label className="checkbox-row">
            <input type="checkbox" defaultChecked />
            Ingat role demo
          </label>
          <Link className="text-link" to="/docs">
            Bantuan akses
          </Link>
        </div>
        {error && <p className="field-error">{error}</p>}
        <Button type="submit" className="full-width">
          <KeyRound size={18} />
          Masuk Aman
        </Button>
      </form>
      <p className="auth-switch">
        Belum punya akun? <Link to="/register">Daftar user baru</Link>
      </p>
    </AuthLayout>
  );
}

function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("Pemilik UMKM");
  const [email, setEmail] = useState("umkm@smartbank.local");
  const [password, setPassword] = useState("smartbank-demo");
  const [confirm, setConfirm] = useState("smartbank-demo");
  const [error, setError] = useState("");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Nama wajib diisi.");
      return;
    }
    if (!email.includes("@")) {
      setError("Email tidak valid.");
      return;
    }
    if (password.length < 6) {
      setError("Password minimal 6 karakter untuk demo.");
      return;
    }
    if (password !== confirm) {
      setError("Konfirmasi password tidak sama.");
      return;
    }

    setError("");
    login("user", email);
    navigate("/dashboard");
  };

  return (
    <AuthLayout
      title="Register SmartBank"
      description="Buat akun user demo dengan saldo awal dan permission dasar SmartBank."
    >
      <form className="stack-form" onSubmit={submit}>
        <label>
          Nama
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
          />
        </label>
        <label>
          Email
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
          />
        </label>
        <label>
          Confirm Password
          <input
            type="password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            autoComplete="new-password"
          />
        </label>
        <label className="checkbox-row">
          <input type="checkbox" defaultChecked />
          Saya memahami akun ini menggunakan data demo frontend.
        </label>
        {error && <p className="field-error">{error}</p>}
        <Button type="submit" className="full-width">
          <UserPlus size={18} />
          Buat Akun Demo
        </Button>
      </form>
      <p className="auth-switch">
        Sudah punya akses? <Link to="/login">Masuk</Link>
      </p>
    </AuthLayout>
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
  const { session } = useAuth();
  const isAdminLike = session?.user.role === "admin" || session?.user.role === "developer";
  const successfulRequests = paymentRequests.filter((request) => request.status === "success");
  const feeRevenue = successfulRequests.reduce(
    (sum, request) => sum + request.feeTotal + request.taxTotal,
    0,
  );

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
          value={isAdminLike ? formatNumber(paymentRequests.length) : formatRupiah(loans[0].principal)}
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
              <p>Data mock mingguan untuk demo dashboard finansial.</p>
            </div>
            <StatusBadge status={isAdminLike ? "success" : "processing"} />
          </div>
          <AreaVisual
            color={isAdminLike ? "#12d6c5" : "#f8c14a"}
            items={moneySupplyTrend.map((item) => ({
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
          <DonutVisual />
          <div className="legend-list">
            {sourceDistribution.map((entry) => (
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

function DonutVisual() {
  let cursor = 0;
  const gradient = sourceDistribution
    .map((entry) => {
      const start = cursor;
      cursor += entry.value;
      return `${entry.color} ${start}% ${cursor}%`;
    })
    .join(", ");

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
            {paymentRequests.slice(0, 5).map((request) => (
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
  return (
    <Panel>
      <div className="panel-title">
        <div>
          <h2>Integration health</h2>
          <p>Gateway dan klien ekosistem.</p>
        </div>
      </div>
      <div className="integration-list">
        {integrations.map((integration) => (
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
  const movement = ledgerEntries.filter((entry) => entry.accountId === "user_001");

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
            {movement.map((entry) => (
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
  const [recipient, setRecipient] = useState("seller_001");
  const [amount, setAmount] = useState("125000");
  const [note, setNote] = useState("Pembayaran bahan baku");
  const [confirmed, setConfirmed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
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
    if (amountError || !recipient || !confirmed) return;
    setModalOpen(true);
  };

  const confirmTransfer = () => {
    setReceipt({
      id: `TRX-${Math.floor(34000 + Math.random() * 900)}`,
      ledgerId: `LED-${Math.floor(91000 + Math.random() * 900)}`,
      amount: amountNumber,
      totalDebit: fee.totalDebit,
      time: new Date().toISOString(),
    });
    setModalOpen(false);
  };

  return (
    <>
      <PageHeader
        title="Transfer Antar User"
        description="Flow input, process, output dengan preview biaya dan receipt."
      />

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
              Penerima
              <select value={recipient} onChange={(event) => setRecipient(event.target.value)}>
                <option value="seller_001">Warung Sari - seller_001</option>
                <option value="admin_001">Raka Admin - admin_001</option>
              </select>
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
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<PaymentRequest | null>(null);
  const filtered = paymentRequests.filter((request) => status === "all" || request.status === status);

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
              {filtered.map((request) => (
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
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [selected, setSelected] = useState<LedgerEntry | null>(null);
  const filtered = ledgerEntries.filter((entry) => {
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
              {filtered.map((entry) => (
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
  const [amount, setAmount] = useState("80000");
  const amountNumber = Number(amount) || 0;
  const loan = calculateLoan(amountNumber);
  const overLimit = amountNumber > feeRules.loanLimit;
  const remainingLimit = feeRules.loanLimit - loans[0].principal;

  return (
    <>
      <PageHeader
        title="Pinjaman dan Loan Simulator"
        description="Limit 100,000/user dengan bunga 10% dan repayment transparan."
      />

      <div className="form-grid">
        <Panel>
          <div className="panel-title">
            <div>
              <h2>Simulator loan</h2>
              <p>Preview principal, bunga, dan total repayment.</p>
            </div>
          </div>
          <form className="stack-form">
            <label>
              Nominal pinjaman
              <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="numeric" />
            </label>
            {overLimit && <p className="field-error">Nominal melebihi limit pinjaman user.</p>}
            <label className="checkbox-row">
              <input type="checkbox" defaultChecked />
              Saya memahami bunga pinjaman 10%.
            </label>
            <Button type="button" disabled={overLimit || amountNumber <= 0}>
              <HandCoins size={18} />
              Ajukan Loan Mock
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
        <MetricCard icon={HandCoins} label="Active loan" value={formatRupiah(loans[0].principal)} helper={loans[0].id} />
        <MetricCard icon={Gauge} label="Remaining limit" value={formatRupiah(Math.max(remainingLimit, 0))} helper="Limit 100,000/user." tone="green" />
        <MetricCard icon={Clock3} label="Due date" value={formatDateTime(loans[0].dueDate ?? loans[0].createdAt)} helper="Tanggal jatuh tempo loan." tone="amber" />
        <MetricCard icon={BadgeCheck} label="Status" value={loans[0].status} helper="Loan aktif dari ledger." tone="blue" />
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
          {financialRules
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
  const feeRevenue = paymentRequests
    .filter((request) => request.status === "success")
    .reduce((sum, request) => sum + request.feeTotal, 0);

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
          items={moneySupplyTrend.map((item) => ({ label: item.day, value: item.volume }))}
        />
      </Panel>
    </>
  );
}

function IntegrationsPage() {
  return (
    <>
      <PageHeader
        title="Integration Monitor"
        description="Pantau API Gateway dan aplikasi ekosistem yang terhubung ke SmartBank."
      />

      <div className="integration-card-grid">
        {integrations.map((integration) => (
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
              {apiLogs.map((log) => (
                <tr key={log.id}>
                  <td>{log.id}</td>
                  <td>{log.method}</td>
                  <td><code>{log.path}</code></td>
                  <td>
                    <span className={log.status >= 400 ? "http-status danger" : "http-status success"}>{log.status}</span>
                  </td>
                  <td>{log.source}</td>
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
              <p>Data session mock yang dipakai route guard.</p>
            </div>
          </div>
          <dl className="detail-list">
            <div>
              <dt>Name</dt>
              <dd>{session?.user.name}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{session?.user.email}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{roleLabel(session?.user.role ?? "user")}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd><StatusBadge status={session?.user.status ?? "active"} /></dd>
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
            <p>Mock setting untuk kebutuhan UI state.</p>
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
                <th>User</th>
                <th>Admin</th>
                <th>Developer</th>
                <th>Insight</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Balance", "Yes", "Yes", "No", "No"],
                ["Transfer", "Yes", "No", "No", "No"],
                ["Payment Request", "No", "Yes", "Yes", "No"],
                ["Ledger", "Limited", "Yes", "Yes", "Read-only"],
                ["Integrations", "No", "Yes", "Yes", "No"],
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
            {apiReference.map((item) => (
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
        Role {roleLabel(session?.user.role ?? "user")} tidak memiliki permission
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

function sourceLabel(source: SourceApp) {
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

function serviceLabel(service: string) {
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
