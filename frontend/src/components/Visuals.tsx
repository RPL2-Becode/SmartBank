import { Link } from "react-router-dom";
import { paymentRequests, moneySupplyTrend, sourceDistribution, integrations } from "../data";
import { sourceLabel, serviceLabel } from "../App";
import { Panel, StatusBadge } from "./ui";
import { formatRupiah, formatDateTime } from "../utils";

export function AreaVisual({
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

export function DonutVisual() {
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

export function BarVisual({ items }: { items: Array<{ label: string; value: number }> }) {
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

export function RecentPayments() {
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

export function IntegrationSnapshot() {
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
