import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Coins, WalletCards, Landmark, Gauge, ReceiptText, HandCoins, Banknote, Clock3, Settings2, Save, RefreshCcw } from "lucide-react";
import { paymentRequests, moneySupplyTrend, sourceDistribution, integrations, balance, loans } from "../data";
import { useAuth } from "../App";
import { AreaVisual, DonutVisual, BarVisual, RecentPayments, IntegrationSnapshot } from "../components/Visuals";
import { PageHeader, MetricCard, Panel, StatusBadge, Button } from "../components/ui";
import { formatRupiah, formatNumber, feeRules } from "../utils";

export default function DashboardPage() {
  const { session } = useAuth();
  const role = session?.user.role?.toUpperCase() || "NASABAH";
  
  const isAdmin = role === "ADMIN";
  const isManager = role === "MANAGER";
  const isTeller = role === "TELLER";
  const isAdminLike = isAdmin || isManager || isTeller;

  const successfulRequests = paymentRequests.filter((request) => request.status === "success");
  const feeRevenue = successfulRequests.reduce(
    (sum, request) => sum + request.feeTotal + request.taxTotal,
    0,
  );

  return (
    <>
      <PageHeader
        title={isAdminLike ? `${role} Control Center` : "User Banking Dashboard"}
        description={
          isAdminLike
            ? `Panel kendali otoritas ${role.toLowerCase()} untuk manajemen ekosistem SmartBank.`
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

      {isAdmin && <AdminFeeManagement />}

      <div className="dashboard-grid">
        <Panel className="chart-panel wide">
          <div className="panel-title">
            <div>
              <h2>{isAdminLike ? "Economic Stability Monitor" : "Balance movement"}</h2>
              <p>{isAdminLike ? "Pantau arus uang beredar vs cadangan bank." : "Data mock mingguan untuk demo dashboard finansial."}</p>
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
              <h2>{isAdminLike ? "Revenue Source Mix" : "Source mix"}</h2>
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

function AdminFeeManagement() {
  const [rates, setRates] = useState([
    { name: "Pajak Sistem (TAX_RATE)", value: 2.0, key: "tax" },
    { name: "Fee Bank (FEE_BANK)", value: 1.0, key: "bank" },
    { name: "Fee Gateway (FEE_GATEWAY)", value: 0.5, key: "gateway" },
  ]);

  const updateRate = (index: number, newVal: string) => {
    const next = [...rates];
    next[index].value = parseFloat(newVal) || 0;
    setRates(next);
  };

  return (
    <Panel className="fee-management-panel" style={{ marginBottom: '1rem' }}>
      <div className="panel-title">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--blue)' }}>
            <Settings2 size={20} />
            <h2 style={{ margin: 0 }}>Global Fee & Rate Management</h2>
          </div>
          <p>Otoritas Admin: Ubah tarif pajak dan biaya layanan seluruh ekosistem secara realtime.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="secondary" style={{ minHeight: '36px', fontSize: '13px' }}>
            <RefreshCcw size={14} /> Reset
          </Button>
          <Button style={{ minHeight: '36px', fontSize: '13px' }}>
            <Save size={14} /> Simpan Perubahan
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginTop: '1.5rem' }}>
        {rates.map((rate, idx) => (
          <div key={rate.key} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted-strong)' }}>{rate.name}</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="number" 
                value={rate.value} 
                onChange={(e) => updateRate(idx, e.target.value)}
                style={{ paddingRight: '2.5rem' }}
              />
              <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: 'var(--muted)' }}>%</span>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}