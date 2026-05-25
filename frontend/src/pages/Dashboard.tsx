import { Link } from "react-router-dom";
import { ArrowRight, Coins, WalletCards, Landmark, Gauge, ReceiptText, HandCoins, Banknote, Clock3 } from "lucide-react";
import { paymentRequests, moneySupplyTrend, sourceDistribution, integrations, balance, loans } from "../data";
import { useAuth } from "../App";
import { AreaVisual, DonutVisual, BarVisual, RecentPayments, IntegrationSnapshot } from "../components/Visuals";
import { PageHeader, MetricCard, Panel, StatusBadge } from "../components/ui";
import { formatRupiah, formatNumber, feeRules } from "../utils";

export default function DashboardPage() {
  const { session } = useAuth();
  const isAdminLike = session?.user.role === "admin" || session?.user.role === "developer" || session?.user.role === "insight_readonly";
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