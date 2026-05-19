import { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";
import { statusTone } from "../App";
import { FileText, X, LockKeyhole, Gauge } from "lucide-react";

export function Button({
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

export function Panel({
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

export function StatusBadge({ status }: { status: string }) {
  const tone = statusTone[status.toLowerCase()] ?? "neutral";
  return <span className={`status status-${tone}`}>{status.replace("_", " ")}</span>;
}

export function BrandLogo({ compact = false }: { compact?: boolean }) {
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

export function PageHeader({
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

export function Modal({
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

export function Drawer({
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

export function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="code-block">
      <code>{code}</code>
    </pre>
  );
}

export function NotFound() {
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

export function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
  tone = "cyan",
}: {
  icon: any;
  label: string;
  value: string;
  helper: string | React.ReactNode;
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
