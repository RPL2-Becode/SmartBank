import {
  AlertTriangle,
  Ban,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  FileText,
  Loader2,
  ReceiptText,
  RotateCcw,
  Search,
  ShieldCheck,
  X,
  XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import type { FeeBreakdown, LedgerEntry, Status, TimelineEvent } from '../types';
import { formatDateTime, formatMoney, statusLabel } from '../lib/format';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  children,
  variant = 'secondary',
  type = 'button',
  disabled,
  onClick,
  className = '',
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  type?: 'button' | 'submit';
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type={type}
      className={`btn btn-${variant} ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function SmartLogo() {
  return (
    <div className="brand-lockup" aria-label="SmartBank">
      <span className="brand-mark" aria-hidden="true">
        SB
      </span>
      <span>
        <strong>SmartBank</strong>
        <small>Trust Platform</small>
      </span>
    </div>
  );
}

export function EnvironmentBadge({ environment = 'Sandbox' }: { environment?: string }) {
  return (
    <span className="environment-badge">
      <ShieldCheck size={14} aria-hidden="true" />
      {environment}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="page-header-actions">{actions}</div> : null}
    </header>
  );
}

export function StatCard({
  label,
  value,
  detail,
  icon: Icon = ShieldCheck,
  tone = 'blue',
}: {
  label: string;
  value: ReactNode;
  detail?: string;
  icon?: LucideIcon;
  tone?: 'blue' | 'green' | 'amber' | 'red' | 'navy';
}) {
  return (
    <section className={`stat-card stat-card-${tone}`}>
      <span className="stat-icon" aria-hidden="true">
        <Icon size={18} />
      </span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        {detail ? <small>{detail}</small> : null}
      </div>
    </section>
  );
}

export function BalanceCard({
  balance,
  accountCode,
  status,
}: {
  balance: number;
  accountCode: string;
  status: string;
}) {
  return (
    <section className="balance-card">
      <div className="balance-card-top">
        <span>Available Balance</span>
        <StatusBadge status={status} />
      </div>
      <MoneyText value={balance} strong />
      <div className="balance-card-foot">
        <span>{accountCode}</span>
        <span>SMART_COIN</span>
      </div>
    </section>
  );
}

export function MoneyText({
  value,
  strong,
  align = 'left',
}: {
  value: number;
  strong?: boolean;
  align?: 'left' | 'right';
}) {
  return (
    <span className={`money-text ${strong ? 'money-strong' : ''} align-${align}`}>
      {formatMoney(value)}
    </span>
  );
}

const statusIcons: Record<string, LucideIcon> = {
  SUCCESS: CheckCircle2,
  PENDING: Clock3,
  PROCESSING: Loader2,
  FAILED: XCircle,
  CANCELED: Ban,
  REVERSED: RotateCcw,
  ACTIVE: CheckCircle2,
  FROZEN: AlertTriangle,
  CLOSED: Ban,
  DRAFT: FileText,
  SUSPENDED: Ban,
  CONFLICT: AlertTriangle,
  VALID: CheckCircle2,
  INVALID: XCircle,
};

export function StatusBadge({ status }: { status: Status | string }) {
  const Icon = statusIcons[status] ?? Clock3;
  const label = status in statusIcons ? statusLabelSafe(status) : status;

  return (
    <span className={`status-badge status-${status.toLowerCase()}`}>
      <Icon size={13} aria-hidden="true" />
      {label}
    </span>
  );
}

function statusLabelSafe(status: string) {
  if (['SUCCESS', 'PENDING', 'PROCESSING', 'FAILED', 'CANCELED', 'REVERSED'].includes(status)) {
    return statusLabel(status as Status);
  }

  return status
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export type Column<T> = {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  render: (row: T, index: number) => ReactNode;
};

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  caption,
}: {
  columns: Column<T>[];
  rows: T[];
  getRowKey?: (row: T, index: number) => string;
  caption?: string;
}) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        {caption ? <caption>{caption}</caption> : null}
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={`align-${column.align ?? 'left'}`}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={getRowKey?.(row, index) ?? index}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  data-label={column.header}
                  className={`align-${column.align ?? 'left'}`}
                >
                  {column.render(row, index)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 ? <EmptyState title="No records found" description="Adjust filters and try again." /> : null}
    </div>
  );
}

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="filter-bar">{children}</div>;
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="field field-search">
      <span className="sr-only">Search</span>
      <Search size={16} aria-hidden="true" />
      <input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="timeline">
      {events.map((event) => (
        <li key={`${event.title}-${event.timestamp}`} className={`timeline-item status-${event.status.toLowerCase()}`}>
          <span className="timeline-dot" aria-hidden="true" />
          <div>
            <div className="timeline-head">
              <strong>{event.title}</strong>
              <time>{formatDateTime(event.timestamp)}</time>
            </div>
            <p>{event.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function LedgerEntriesTable({ entries }: { entries: LedgerEntry[] }) {
  return (
    <DataTable
      caption="Ledger entries"
      rows={entries}
      getRowKey={(entry) => entry.id}
      columns={[
        { key: 'transactionCode', header: 'Transaction Code', render: (entry) => entry.transactionCode },
        { key: 'accountCode', header: 'Account Code', render: (entry) => entry.accountCode },
        { key: 'direction', header: 'Direction', render: (entry) => <StatusBadge status={entry.direction} /> },
        {
          key: 'amount',
          header: 'Amount',
          align: 'right',
          render: (entry) => <MoneyText value={entry.amount} align="right" />,
        },
        {
          key: 'before',
          header: 'Balance Before',
          align: 'right',
          render: (entry) => <MoneyText value={entry.balanceBefore} align="right" />,
        },
        {
          key: 'after',
          header: 'Balance After',
          align: 'right',
          render: (entry) => <MoneyText value={entry.balanceAfter} align="right" />,
        },
        { key: 'hash', header: 'Entry Hash', render: (entry) => <code>{entry.entryHash}</code> },
        { key: 'createdAt', header: 'Created At', render: (entry) => formatDateTime(entry.createdAt) },
      ]}
    />
  );
}

export function FeeBreakdownCard({ breakdown }: { breakdown: FeeBreakdown }) {
  const rows = [
    ['Base Amount', breakdown.baseAmount],
    ['Marketplace Fee 2%', breakdown.marketplaceFee],
    ['Bank Fee 1%', breakdown.bankFee],
    ['Gateway Fee 0.5%', breakdown.gatewayFee],
    ['System Tax 2%', breakdown.systemTax],
  ] as const;

  return (
    <section className="panel fee-breakdown">
      <h2>Fee Breakdown</h2>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>
              <MoneyText value={value} align="right" />
            </dd>
          </div>
        ))}
        <div className="total">
          <dt>Total Debit</dt>
          <dd>
            <MoneyText value={breakdown.totalDebit} strong align="right" />
          </dd>
        </div>
      </dl>
    </section>
  );
}

export function ReceiptCard({
  title = 'Transaction Receipt',
  reference,
  amount,
  rows,
}: {
  title?: string;
  reference: string;
  amount: number;
  rows: Array<[string, ReactNode]>;
}) {
  return (
    <section className="receipt-card">
      <ReceiptText size={28} aria-hidden="true" />
      <h2>{title}</h2>
      <MoneyText value={amount} strong />
      <p className="receipt-reference">{reference}</p>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function ReviewPanel({
  title,
  description,
  rows,
  actions,
}: {
  title: string;
  description?: string;
  rows: Array<[string, ReactNode]>;
  actions: ReactNode;
}) {
  return (
    <section className="review-panel">
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      <dl>
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div className="review-actions">{actions}</div>
    </section>
  );
}

export function ConfirmationModal({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  danger,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button className="icon-button modal-close" aria-label="Close dialog" type="button" onClick={onClose}>
          <X size={18} />
        </button>
        <AlertTriangle size={28} aria-hidden="true" />
        <h2 id="modal-title">{title}</h2>
        <p>{description}</p>
        <div className="modal-actions">
          <Button onClick={onClose}>Cancel</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <section className="empty-state">
      <FileText size={24} aria-hidden="true" />
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  );
}

export function ErrorState({ title, description }: { title: string; description: string }) {
  return (
    <section className="error-state" role="alert">
      <AlertTriangle size={24} aria-hidden="true" />
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  );
}

export function LoadingSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="loading-skeleton" aria-label="Loading">
      {Array.from({ length: lines }).map((_, index) => (
        <span key={index} />
      ))}
    </div>
  );
}

export function QRCard({ code, dynamic }: { code: string; dynamic?: boolean }) {
  return (
    <section className="qr-card" aria-label="Generated SmartQR">
      <div className="qr-grid" aria-hidden="true">
        {Array.from({ length: 49 }).map((_, index) => (
          <span key={index} className={index % 3 === 0 || index % 7 === 0 ? 'filled' : ''} />
        ))}
      </div>
      <div>
        <strong>{code}</strong>
        <p>{dynamic ? 'Dynamic QR expires in 14:59' : 'Static merchant QR'}</p>
      </div>
    </section>
  );
}

export function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="code-block">
      <code>{code}</code>
    </pre>
  );
}

export function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      className="copy-button"
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1300);
      }}
      aria-label={label}
    >
      {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
      {copied ? 'Copied' : label}
    </button>
  );
}

export function MiniBarChart({
  data,
  label,
}: {
  label: string;
  data: Array<{ name: string; value: number; tone?: string }>;
}) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <section className="panel chart-panel">
      <h2>{label}</h2>
      <div className="bar-chart" role="img" aria-label={label}>
        {data.map((item) => (
          <div key={item.name} className="bar-row">
            <span>{item.name}</span>
            <div className="bar-track">
              <span
                className={`bar-fill ${item.tone ?? ''}`}
                style={{ inlineSize: `${Math.max((item.value / max) * 100, 8)}%` }}
              />
            </div>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
