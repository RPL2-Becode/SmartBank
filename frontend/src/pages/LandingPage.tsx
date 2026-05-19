import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';



const Nav = ({ radius }: any) => {
  const [scrolled, setScrolled] = React.useState(false);
  const [productsOpen, setProductsOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(scrollY > 8);
    addEventListener('scroll', onScroll);
    return () => removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: scrolled ? 'rgba(248,249,251,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'saturate(180%) blur(14px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(30,64,175,0.08)' : '1px solid transparent',
        transition: 'all 240ms ease',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '18px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 32,
        }}
      >
        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: radius === 'sharp' ? 4 : 9,
 background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700,
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 16,
              letterSpacing: '-0.02em',
            }}
          >
            S
          </div>
          <span
            style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 600,
              fontSize: 19,
              color: '#1E40AF',
              letterSpacing: '-0.02em',
            }}
          >
            SmartBank
          </span>
        </a>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, color: '#64748B' }}>
          {['Personal', 'Bisnis', 'Investasi', 'Promo', 'Bantuan'].map((item) => (
            <a
              key={item}
              href="#"
              onClick={(e) => e.preventDefault()}
              style={{
                padding: '8px 14px',
                borderRadius: radius === 'sharp' ? 0 : 8,
                color: '#64748B',
                textDecoration: 'none',
                transition: 'all 160ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(30,64,175,0.05)';
                e.currentTarget.style.color = '#1E40AF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#64748B';
              }}
            >
              {item}
            </a>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link
            style={{
              padding: '10px 18px',
              fontSize: 14,
              fontWeight: 500,
              background: 'transparent',
              border: 'none',
              color: '#1E40AF',
              cursor: 'pointer',
              borderRadius: radius === 'sharp' ? 0 : 8,
            }}
           to="/login">Masuk</Link>
          <button
            style={{
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 600,
              background: '#1E40AF',
              color: 'white',
              border: 'none',
              borderRadius: radius === 'sharp' ? 2 : 999,
              cursor: 'pointer',
              transition: 'all 160ms',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#3B82F6')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#1E40AF')}
          >
            Buka Rekening
          </button>
        </div>
      </div>
    </header>
  );
};






// Interactive dashboard preview — switchable tabs, animated balance, live tx list
const Dashboard = ({ radius }: any) => {
  const [tab, setTab] = React.useState('beranda');
  const [showBalance, setShowBalance] = React.useState(true);
  const [tick, setTick] = React.useState(0);
  const r = radius === 'sharp' ? 4 : 14;
  const rs = radius === 'sharp' ? 2 : 8;

  React.useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 3500);
    return () => clearInterval(id);
  }, []);

  const balance = 24_847_500 + (tick % 4) * 12500;

  const tabs = [
    { id: 'beranda', label: 'Beranda' },
    { id: 'transfer', label: 'Transfer' },
    { id: 'kartu', label: 'Kartu' },
    { id: 'invest', label: 'Investasi' },
  ];

  return (
    <div
      style={{
        background: 'white',
        borderRadius: r,
        boxShadow: '0 30px 80px -20px rgba(30,64,175,0.35), 0 8px 24px -8px rgba(30,64,175,0.18)',
        overflow: 'hidden',
        border: '1px solid rgba(30,64,175,0.08)',
        width: '100%',
        maxWidth: 640,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Browser chrome */}
      <div
        style={{
 background: '#3B82F6',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderBottom: '1px solid rgba(30,64,175,0.06)',
        }}
      >
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#FF5F57' }} />
          <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#FEBC2E' }} />
          <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#28C840' }} />
        </div>
        <div
          style={{
            flex: 1,
            margin: '0 60px 0 12px',
            padding: '4px 12px',
            background: 'white',
            borderRadius: 6,
            fontSize: 11,
            color: '#94A3B8',
            fontFamily: 'JetBrains Mono, monospace',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span style={{ color: '#28C840' }}>●</span> smartbank.id/dashboard
        </div>
      </div>

      {/* Top bar */}
      <div
        style={{
          padding: '14px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(30,64,175,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: rs,
              background: 'linear-gradient(135deg, #3B82F6, #1E40AF)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700,
              fontSize: 13,
              fontFamily: 'Space Grotesk, sans-serif',
            }}
          >
            S
          </div>
          <span style={{ fontWeight: 600, fontSize: 14, color: '#1E40AF' }}>SmartBank</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative', width: 18, height: 18 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <div
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                width: 8,
                height: 8,
                borderRadius: '50%',
 background: '#3B82F6',
              }}
            />
          </div>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
 background: '#3B82F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 600,
              color: '#1E40AF',
            }}
          >
            DR
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          padding: '0 22px',
          display: 'flex',
          gap: 4,
          borderBottom: '1px solid rgba(30,64,175,0.06)',
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '12px 14px',
              fontSize: 13,
              fontWeight: 500,
              background: 'transparent',
              border: 'none',
              borderBottom: tab === t.id ? '2px solid #1E40AF' : '2px solid transparent',
              color: tab === t.id ? '#1E40AF' : '#94A3B8',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              transition: 'all 160ms',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: 22 }}>
        {tab === 'beranda' && <BerandaTab balance={balance} showBalance={showBalance} setShowBalance={setShowBalance} r={r} rs={rs} />}
        {tab === 'transfer' && <TransferTab r={r} rs={rs} />}
        {tab === 'kartu' && <KartuTab r={r} rs={rs} />}
        {tab === 'invest' && <InvestTab r={r} rs={rs} tick={tick} />}
      </div>
    </div>
  );
};

const BerandaTab = ({ balance, showBalance, setShowBalance, r, rs }: any) => (
  <>
    {/* Balance card */}
    <div
      style={{
 background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
        borderRadius: r,
        padding: 22,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(30,91,255,0.45) 0%, transparent 70%)',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, position: 'relative' }}>
        <div>
          <div style={{ fontSize: 11, opacity: 0.65, marginBottom: 4, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Total Saldo
          </div>
          <div
            style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {showBalance ? `Rp ${balance.toLocaleString('id-ID')}` : 'Rp ••••••••••'}
          </div>
        </div>
        <button
          onClick={() => setShowBalance((s: boolean) => !s)}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: rs,
            padding: 6,
            cursor: 'pointer',
            color: 'white',
            display: 'flex',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {showBalance ? (
              <>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </>
            ) : (
              <>
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </>
            )}
          </svg>
        </button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 16, position: 'relative' }}>
        {['Transfer', 'Top Up', 'QRIS', 'Tagihan'].map((a) => (
          <button
            key={a}
            style={{
              flex: 1,
              padding: '10px 8px',
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: rs,
              color: 'white',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              transition: 'background 160ms',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.22)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
          >
            {a}
          </button>
        ))}
      </div>
    </div>

    {/* Transactions */}
    <div style={{ marginTop: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1E40AF' }}>Transaksi Terbaru</div>
        <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: 11, color: '#3B82F6', textDecoration: 'none' }}>
          Lihat Semua →
        </a>
      </div>
      {[
        { name: 'Tokopedia', cat: 'Belanja Online', amt: -127500, time: 'Hari ini, 14:32', emoji: '🛍' },
        { name: 'Top Up GoPay', cat: 'E-Wallet', amt: -200000, time: 'Hari ini, 09:15', emoji: '💳' },
        { name: 'Gaji Bulanan', cat: 'Pemasukan', amt: 8500000, time: 'Kemarin, 06:00', emoji: '💼' },
        { name: 'Starbucks ID', cat: 'Makanan', amt: -67000, time: 'Kemarin, 16:42', emoji: '☕' },
      ].map((tx, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '10px 0',
            borderBottom: i < 3 ? '1px solid rgba(30,64,175,0.05)' : 'none',
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: rs,
 background: '#3B82F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              marginRight: 12,
            }}
          >
            {tx.emoji}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#1E40AF' }}>{tx.name}</div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
              {tx.cat} · {tx.time}
            </div>
          </div>
 <div
 style={{
 fontSize: 13,
 fontWeight: 600,
 color: tx.amt > 0 ? '#4ADE80' : 'rgba(255,255,255,0.8)',
 fontVariantNumeric: 'tabular-nums',
 fontFamily: 'Space Grotesk, sans-serif',
 }}
 >
 {tx.amt > 0 ? '+' : ''}Rp {Math.abs(tx.amt).toLocaleString('id-ID')}
 </div>
        </div>
      ))}
    </div>
  </>
);

const TransferTab = ({ r, rs }: any) => {
  const [amount, setAmount] = React.useState('500000');
  const [step, setStep] = React.useState(1);

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#1E40AF', marginBottom: 14 }}>Transfer Cepat</div>
      <div
        style={{
          background: '#F8FAFC',
          borderRadius: r,
          padding: 18,
          border: '1px solid rgba(30,64,175,0.06)',
        }}
      >
        <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Tujuan</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'white', borderRadius: rs, border: '1px solid rgba(30,64,175,0.08)' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E8EEFB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6', fontWeight: 600, fontSize: 13 }}>BR</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#1E40AF' }}>Budi Rahmadi</div>
            <div style={{ fontSize: 11, color: '#94A3B8' }}>SmartBank · 5471 8829 1102</div>
          </div>
          <div style={{ fontSize: 10, padding: '3px 8px', background: '#E8F5EE', color: '#1E40AF', borderRadius: 999, fontWeight: 600 }}>VERIFIED</div>
        </div>

        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 16, marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Nominal</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', background: 'white', borderRadius: rs, border: '1px solid rgba(30,64,175,0.08)' }}>
          <span style={{ color: '#94A3B8', fontSize: 14 }}>Rp</span>
          <input
            value={Number(amount).toLocaleString('id-ID')}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, '') || '0')}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: 22,
              fontWeight: 600,
              fontFamily: 'Space Grotesk, sans-serif',
              color: '#1E40AF',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.02em',
              background: 'transparent',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          {[100000, 250000, 500000, 1000000].map((v) => (
            <button
              key={v}
              onClick={() => setAmount(String(v))}
              style={{
                flex: 1,
                padding: '6px 4px',
                background: Number(amount) === v ? '#1E40AF' : 'white',
                color: Number(amount) === v ? 'white' : '#64748B',
                border: '1px solid rgba(30,64,175,0.08)',
                borderRadius: rs,
                fontSize: 11,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {v / 1000}rb
            </button>
          ))}
        </div>

        <button
          onClick={() => setStep(step === 1 ? 2 : 1)}
          style={{
            width: '100%',
            marginTop: 16,
            padding: '13px',
            background: '#1E40AF',
            color: 'white',
            border: 'none',
            borderRadius: rs,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          {step === 1 ? 'Lanjutkan' : '✓ Berhasil!'} {step === 1 && '→'}
        </button>
        <div style={{ textAlign: 'center', fontSize: 11, color: '#94A3B8', marginTop: 10 }}>
          Biaya transfer: <span style={{ color: '#22C55E', fontWeight: 600 }}>GRATIS</span> · Real-time
        </div>
      </div>
    </div>
  );
};

const KartuTab = ({ r, rs }: any) => (
  <div>
    <div style={{ fontSize: 13, fontWeight: 600, color: '#1E40AF', marginBottom: 14 }}>Kartu Saya</div>
    <div
      style={{
        background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 60%, #0F172A 100%)',
        borderRadius: r,
        padding: 22,
        color: 'white',
        height: 200,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'repeating-linear-gradient(45deg, transparent 0 18px, rgba(255,255,255,0.03) 18px 19px)',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 16 }}>SmartBank</div>
        <div style={{ fontSize: 10, opacity: 0.6, letterSpacing: '0.1em' }}>VIRTUAL</div>
      </div>
      <div style={{ position: 'absolute', bottom: 22, left: 22, right: 22 }}>
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 17,
            letterSpacing: '0.1em',
            marginBottom: 12,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          5471 •••• •••• 1102
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 9, opacity: 0.6, letterSpacing: '0.1em' }}>CARDHOLDER</div>
            <div style={{ fontSize: 12, fontWeight: 500, marginTop: 2 }}>DAVID R.</div>
          </div>
 <div style={{ display: 'flex', gap: 4 }}>
 <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.85)' }} />
 <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(30, 64, 175, 0.85)', marginLeft: -10 }} />
 </div>
        </div>
      </div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
      {[
        { label: 'Limit Harian', val: 'Rp 50jt' },
        { label: 'Cashback Bulan Ini', val: 'Rp 127rb' },
      ].map((s, i) => (
        <div key={i} style={{ padding: 12, background: '#F8FAFC', borderRadius: rs, border: '1px solid rgba(30,64,175,0.06)' }}>
          <div style={{ fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1E40AF', marginTop: 4, fontFamily: 'Space Grotesk, sans-serif' }}>{s.val}</div>
        </div>
      ))}
    </div>
  </div>
);

const InvestTab = ({ r, rs, tick }: any) => {
  const data = [40, 45, 42, 50, 55, 52, 60, 65, 62, 70, 68, 75, 78, 82, 80 + (tick % 3)];
  const max = Math.max(...data);
  const min = Math.min(...data);
  const path = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((v - min) / (max - min)) * 80 - 10;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#1E40AF', marginBottom: 14 }}>Portofolio Investasi</div>
      <div style={{ background: '#F8FAFC', borderRadius: r, padding: 18, border: '1px solid rgba(30,64,175,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: '#94A3B8' }}>Nilai Total</div>
            <div style={{ fontSize: 24, fontWeight: 600, color: '#1E40AF', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em' }}>
              Rp 12.485.200
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#94A3B8' }}>30 hari</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#22C55E' }}>+8,42%</div>
          </div>
        </div>
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: 80 }} preserveAspectRatio="none">
          <defs>
            <linearGradient id="invGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${path} L 100 100 L 0 100 Z`} fill="url(#invGrad)" />
          <path d={path} stroke="#3B82F6" strokeWidth="1.4" fill="none" vectorEffect="non-scaling-stroke" />
        </svg>
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          {['1H', '7H', '1B', '3B', '1T', 'All'].map((t, i) => (
            <button
              key={t}
              style={{
                padding: '4px 10px',
                background: i === 2 ? '#1E40AF' : 'transparent',
                color: i === 2 ? 'white' : '#94A3B8',
                border: 'none',
                borderRadius: rs,
                fontSize: 11,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        {[
          { name: 'Reksadana Pasar Uang', perf: '+4,2%', val: 'Rp 5.200.000', color: '#22C55E' },
          { name: 'SBN Ritel ORI024', perf: '+6,1%', val: 'Rp 4.500.000', color: '#3B82F6' },
          { name: 'Reksadana Saham', perf: '+12,8%', val: 'Rp 2.785.200', color: '#7B5BFF' },
        ].map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: i < 2 ? '1px solid rgba(30,64,175,0.05)' : 'none' }}>
            <div style={{ width: 6, height: 28, borderRadius: 3, background: p.color, marginRight: 12 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#1E40AF' }}>{p.name}</div>
              <div style={{ fontSize: 11, color: '#22C55E', marginTop: 2, fontWeight: 500 }}>{p.perf}</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1E40AF', fontFamily: 'Space Grotesk, sans-serif', fontVariantNumeric: 'tabular-nums' }}>
              {p.val}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};






// Phone hero variant
const PhoneMock = ({ radius }: any) => {
  const r = radius === 'sharp' ? 16 : 42;
  return (
    <div
      style={{
        width: 280,
        height: 580,
        background: '#0A0E1A',
        borderRadius: r,
        padding: 10,
        boxShadow: '0 40px 80px -20px rgba(30,64,175,0.45), 0 12px 30px -10px rgba(30,64,175,0.25)',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 18,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 100,
          height: 22,
          background: '#0A0E1A',
          borderRadius: 99,
          zIndex: 2,
        }}
      />
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(180deg, #1E40AF 0%, #1E3A8A 100%)',
          borderRadius: r - 6,
          overflow: 'hidden',
          color: 'white',
          fontFamily: 'Inter, sans-serif',
          padding: '40px 18px 18px',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, opacity: 0.7, marginBottom: 16 }}>
          <span>09:41</span>
          <span>●●●● 5G</span>
        </div>

        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Halo, David 👋</div>
          <div style={{ fontSize: 18, fontWeight: 600, fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em' }}>
            Selamat pagi
          </div>
        </div>

        <div
          style={{
            marginTop: 16,
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: radius === 'sharp' ? 4 : 16,
            padding: 16,
            backdropFilter: 'blur(10px)',
          }}
        >
          <div style={{ fontSize: 10, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Saldo</div>
          <div
            style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 22,
              fontWeight: 600,
              marginTop: 4,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.02em',
            }}
          >
            Rp 24.847.500
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 16 }}>
          {[
            { i: '↗', l: 'Transfer' },
            { i: '↓', l: 'Top Up' },
            { i: '⚡', l: 'QRIS' },
            { i: '◉', l: 'Tagihan' },
          ].map((a) => (
            <div
              key={a.l}
              style={{
                background: 'rgba(255,255,255,0.08)',
                borderRadius: radius === 'sharp' ? 2 : 12,
                padding: '10px 4px',
                textAlign: 'center',
                fontSize: 9,
              }}
            >
              <div style={{ fontSize: 18, marginBottom: 2 }}>{a.i}</div>
              {a.l}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 18, fontSize: 11, opacity: 0.7, marginBottom: 8 }}>Transaksi Terbaru</div>
        {[
          { n: 'Tokopedia', a: '-Rp 127.500', e: '🛍' },
          { n: 'GoPay', a: '-Rp 200.000', e: '💳' },
          { n: 'Gaji', a: '+Rp 8.500.000', e: '💼', pos: true },
        ].map((tx, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 0',
              borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}
          >
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, marginRight: 10 }}>
              {tx.e}
            </div>
            <div style={{ flex: 1, fontSize: 11 }}>{tx.n}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: tx.pos ? '#5BE584' : 'white', fontFamily: 'Space Grotesk, sans-serif' }}>{tx.a}</div>
          </div>
        ))}
      </div>
    </div>
  );
};






// Card hero variant — physical/virtual card
const CardMock = ({ radius }: any) => {
  const r = radius === 'sharp' ? 4 : 18;
  return (
    <div style={{ position: 'relative', width: 460, height: 480, perspective: 1200 }}>
      {/* Back card */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          right: 60,
          width: 360,
          height: 224,
 background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
          borderRadius: r,
          transform: 'rotate(-10deg)',
          boxShadow: '0 20px 50px -10px rgba(30,64,175,0.35)',
          padding: 22,
          color: 'white',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'repeating-linear-gradient(45deg, transparent 0 22px, rgba(255,255,255,0.03) 22px 23px)',
          }}
        />
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 15 }}>SmartBank</div>
          <div style={{ fontSize: 10, opacity: 0.55, letterSpacing: '0.12em' }}>WORLD ELITE</div>
        </div>
      </div>

      {/* Front card */}
      <div
        style={{
          position: 'absolute',
          top: 140,
          left: 30,
          width: 360,
          height: 224,
 background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
          borderRadius: r,
          transform: 'rotate(5deg)',
          boxShadow: '0 30px 70px -15px rgba(30,91,255,0.45)',
          padding: 22,
          color: 'white',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
          }}
        />
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 16 }}>SmartBank</div>
          <div
            style={{
              fontSize: 10,
              padding: '3px 8px',
              background: 'rgba(255,255,255,0.18)',
              borderRadius: 999,
              letterSpacing: '0.08em',
              fontWeight: 600,
            }}
          >
            DIGITAL
          </div>
        </div>

        <div
          style={{
            width: 38,
            height: 28,
            borderRadius: 4,
 background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
            marginBottom: 24,
            position: 'relative',
          }}
        >
          <div style={{ position: 'absolute', inset: 4, border: '1px solid rgba(0,0,0,0.18)', borderRadius: 2 }} />
        </div>

        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 18,
            letterSpacing: '0.12em',
            fontVariantNumeric: 'tabular-nums',
            marginBottom: 14,
          }}
        >
          5471 8829 1102 4406
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 9, opacity: 0.6, letterSpacing: '0.1em' }}>CARDHOLDER</div>
            <div style={{ fontSize: 13, fontWeight: 500, marginTop: 2 }}>DAVID RAHARJO</div>
          </div>
 <div style={{ display: 'flex', gap: 4 }}>
 <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.85)' }} />
 <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(30, 64, 175, 0.85)', marginLeft: -12 }} />
 </div>
        </div>
      </div>

      {/* Floating chips */}
      <div
        style={{
          position: 'absolute',
          top: 30,
          left: 0,
          background: 'white',
          borderRadius: 999,
          padding: '8px 14px',
          fontSize: 12,
          fontWeight: 600,
          color: '#1E40AF',
          boxShadow: '0 12px 28px -8px rgba(30,64,175,0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <span style={{ color: '#22C55E' }}>●</span> 5% cashback semua transaksi
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 40,
          right: 10,
          background: 'white',
          borderRadius: 999,
          padding: '8px 14px',
          fontSize: 12,
          fontWeight: 600,
          color: '#1E40AF',
          boxShadow: '0 12px 28px -8px rgba(30,64,175,0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        🌐 Bebas biaya admin global
      </div>
    </div>
  );
};






const Hero = ({ variant, radius }: any) => {
  const r = radius === 'sharp' ? 2 : 999;
  return (
    <section
      style={{
        position: 'relative',
        padding: '60px 32px 100px',
        background:
          'radial-gradient(ellipse at top right, rgba(30,91,255,0.08) 0%, transparent 50%), linear-gradient(180deg, #F8FAFC 0%, white 100%)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1.05fr',
          gap: 60,
          alignItems: 'center',
          minHeight: 600,
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              background: 'rgba(30,91,255,0.08)',
              border: '1px solid rgba(30,91,255,0.18)',
              borderRadius: 999,
              fontSize: 12,
              color: '#3B82F6',
              fontWeight: 600,
              marginBottom: 24,
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
 background: '#3B82F6',
                animation: 'pulse 2s infinite',
              }}
            />
            DIAWASI_OJK · DIJAMIN_LPS
          </div>

          <h1
            style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 'clamp(44px, 5.6vw, 76px)',
              fontWeight: 600,
              lineHeight: 0.98,
              letterSpacing: '-0.035em',
              color: '#1E40AF',
              margin: '0 0 24px',
              textWrap: 'balance',
            }}
          >
            Banking yang{' '}
 <span style={{ color: '#3B82F6', fontStyle: 'italic', fontWeight: 500 }}>finally</span>
            <br /> ngerti hidup kamu.
          </h1>

          <p
            style={{
              fontSize: 'clamp(16px, 1.3vw, 19px)',
              color: '#64748B',
              lineHeight: 1.55,
              maxWidth: 520,
              margin: '0 0 36px',
              textWrap: 'pretty',
            }}
          >
            Transfer gratis tanpa syarat. Investasi mulai Rp 10rb. Pinjaman cair 30 menit.
            Semua dalam satu app, tanpa antre cabang.
          </p>

          <div style={{ display: 'flex', gap: 12, marginBottom: 36, flexWrap: 'wrap' }}>
            <button
              style={{
                padding: '15px 28px',
                background: '#1E40AF',
                color: 'white',
                border: 'none',
                borderRadius: r,
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 200ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#3B82F6';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#1E40AF';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Buka Rekening Gratis →
            </button>
            <button
              style={{
                padding: '15px 28px',
                background: 'white',
                color: '#1E40AF',
                border: '1px solid rgba(30,64,175,0.15)',
                borderRadius: r,
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ width: 24, height: 24, background: '#1E40AF', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>▶</span>
              Lihat demo (1:24)
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: -4 }}>
              {['#E0E7FF', '#D4E5C2', '#C2D4FF', '#EFEAFE'].map((c, i) => (
                <div
                  key={i}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: c,
                    border: '2px solid white',
                    marginLeft: i > 0 ? -10 : 0,
                  }}
                />
              ))}
            </div>
            <div style={{ fontSize: 13, color: '#64748B' }}>
              <strong style={{ color: '#1E40AF' }}>3,2 juta+</strong> orang sudah bergabung tahun ini
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 600 }}>
          {variant === 'dashboard' && <Dashboard radius={radius} />}
          {variant === 'phone' && <PhoneMock radius={radius} />}
          {variant === 'card' && <CardMock radius={radius} />}

          {variant === 'dashboard' && (
            <>
              <div
                style={{
                  position: 'absolute',
                  top: 30,
                  right: 0,
                  background: 'white',
                  padding: '10px 14px',
                  borderRadius: 999,
                  boxShadow: '0 12px 30px -8px rgba(30,64,175,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#1E40AF',
                  border: '1px solid rgba(30,64,175,0.06)',
                }}
              >
                <span style={{ color: '#22C55E' }}>↑</span> Transfer berhasil · Rp 500.000
              </div>
              <div
                style={{
                  position: 'absolute',
                  bottom: 60,
                  left: -20,
                  background: 'white',
                  padding: '12px 16px',
                  borderRadius: 12,
                  boxShadow: '0 12px 30px -8px rgba(30,64,175,0.2)',
                  border: '1px solid rgba(30,64,175,0.06)',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                <div style={{ fontSize: 10, color: '#94A3B8', letterSpacing: '0.05em' }}>BUNGA TAHUNAN</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#22C55E', fontFamily: 'Space Grotesk, sans-serif' }}>4,5% p.a.</div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};






// Sections: Features, App, Promo, Invest, Loan, Security, Testi, Branch, FAQ, CTA, Footer
const Section = ({ children, bg = "transparent", style = {} }: any) => (
  <section style={{ background: bg || 'transparent', padding: '100px 32px', ...style }}>
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>{children}</div>
  </section>
);

const Eyebrow = ({ children, color = "#3B82F6" }: any) => (
  <div
    style={{
      fontSize: 12,
      fontWeight: 600,
      color,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      marginBottom: 16,
      fontFamily: 'JetBrains Mono, monospace',
    }}
  >
    {children}
  </div>
);

const H2 = ({ children, light = false, style = {} }: any) => (
  <h2
    style={{
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: 'clamp(36px, 4.4vw, 56px)',
      fontWeight: 600,
      lineHeight: 1.05,
      letterSpacing: '-0.03em',
      color: light ? 'white' : '#1E40AF',
      margin: '0 0 18px',
      textWrap: 'balance',
      ...style,
    }}
  >
    {children}
  </h2>
);

const Features = ({ radius }: any) => {
  const r = radius === 'sharp' ? 4 : 16;
  const features = [
    { i: '↗', title: 'Transfer Gratis', desc: 'Transfer ke semua bank lokal, bebas biaya tanpa syarat saldo minimum.', tag: 'Real-time' },
    { i: '⚡', title: 'QRIS Universal', desc: 'Bayar di mana aja pakai satu QR. Otomatis cashback tiap transaksi.', tag: 'Instan' },
    { i: '◉', title: 'Top Up E-Wallet', desc: 'GoPay, OVO, DANA, ShopeePay. Top up langsung tanpa biaya admin.', tag: 'Gratis' },
    { i: '☰', title: 'Bayar Tagihan', desc: 'Listrik, BPJS, internet, pulsa, sampai langganan streaming.', tag: '300+ biller' },
    { i: '◐', title: 'Multi Pocket', desc: 'Pisahkan dana untuk gaji, tabungan, dan budget harian.', tag: 'Up to 10' },
    { i: '✦', title: 'Kartu Virtual', desc: 'Buat kartu instan untuk belanja online, atur limit kapan aja.', tag: 'Unlimited' },
  ];
  return (
    <Section bg="transparent">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 56, gap: 40, flexWrap: 'wrap' }}>
        <div style={{ maxWidth: 620 }}>
          <Eyebrow>FITUR_HARIAN</Eyebrow>
          <H2>Semua keuangan kamu, dalam satu app yang ngerti.</H2>
        </div>
        <p style={{ fontSize: 16, color: '#64748B', maxWidth: 380, lineHeight: 1.6, margin: 0 }}>
          Dirancang untuk generasi yang nggak punya waktu antre. Cepat, gratis, dan tanpa basa-basi.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {features.map((f, i) => (
          <div
            key={i}
            style={{
              background: 'white',
              border: '1px solid rgba(30,64,175,0.08)',
              borderRadius: r,
              padding: 28,
              transition: 'all 220ms',
              cursor: 'pointer',
              position: 'relative',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 20px 40px -15px rgba(30,64,175,0.18)';
              e.currentTarget.style.borderColor = 'rgba(30,91,255,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = 'rgba(30,64,175,0.08)';
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 22,
                right: 22,
                fontSize: 10,
                padding: '3px 8px',
 background: '#3B82F6',
                color: '#3B82F6',
                borderRadius: 999,
                fontWeight: 600,
                fontFamily: 'JetBrains Mono, monospace',
                letterSpacing: '0.04em',
              }}
            >
              {f.tag}
            </div>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: radius === 'sharp' ? 2 : 12,
 background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                color: '#3B82F6',
                marginBottom: 22,
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 600,
              }}
            >
              {f.i}
            </div>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 19, fontWeight: 600, color: '#1E40AF', margin: '0 0 8px', letterSpacing: '-0.01em' }}>
              {f.title}
            </h3>
            <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.55, margin: 0 }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </Section>
  );
};

const AppShowcase = ({ radius }: any) => {
  const r = radius === 'sharp' ? 4 : 14;
  return (
    <Section bg="#1E40AF">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
        <div>
          <Eyebrow color="#5B8DFF">APP_MOBILE</Eyebrow>
          <H2 light>Bawa bank di kantong, kontrol penuh di tangan.</H2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: 32 }}>
            Notifikasi real-time, biometrik dual-layer, dan UI yang dirancang untuk kecepatan. Buka rekening dalam 3 menit, tanpa ke kantor cabang.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18, marginBottom: 36 }}>
            {[
              { n: '4.9', l: 'App Store rating' },
              { n: '3jt+', l: 'Pengguna aktif' },
              { n: '<2s', l: 'Waktu transfer' },
              { n: '99.9%', l: 'Uptime tahunan' },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 32, fontWeight: 600, color: 'white', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                  {s.n}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {['App Store', 'Google Play'].map((s) => (
              <button
                key={s}
                style={{
                  padding: '12px 20px',
                  background: 'white',
                  color: '#1E40AF',
                  border: 'none',
                  borderRadius: radius === 'sharp' ? 2 : 999,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                <span style={{ fontSize: 18 }}>{s.includes('App') ? '' : '▶'}</span> Download di {s}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
          <PhoneMock radius={radius} />
        </div>
      </div>
    </Section>
  );
};

const Promo = ({ radius }: any) => {
  const r = radius === 'sharp' ? 4 : 16;
  const promos = [
 { tag: 'CASHBACK', color: '#3B82F6', bg: '#E8EEFB', title: 'Cashback 25% di Tokopedia', sub: 'Min. transaksi Rp 100rb · s/d 31 Mei' },
    { tag: 'F&B', color: '#1E40AF', bg: '#FFEAD9', title: 'Diskon Rp 50rb di Starbucks', sub: 'Berlaku weekday · Min. order Rp 75rb' },
    { tag: 'TRAVEL', color: '#22C55E', bg: '#E0F4E8', title: 'Voucher hotel Rp 200rb', sub: 'Booking via Traveloka & Tiket.com' },
    { tag: 'STREAMING', color: '#7B5BFF', bg: '#EFEAFE', title: '3 bulan Spotify Premium', sub: 'Khusus pengguna baru SmartBank' },
  ];
  return (
    <Section bg="transparent">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40, gap: 24, flexWrap: 'wrap' }}>
        <div>
          <Eyebrow>PROMO_AKTIF</Eyebrow>
          <H2 style={{ fontSize: 'clamp(32px, 3.6vw, 44px)' }}>Promo yang beneran kepake.</H2>
        </div>
        <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: 14, color: '#3B82F6', fontWeight: 600, textDecoration: 'none' }}>
          Lihat 240+ promo lainnya →
        </a>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {promos.map((p, i) => (
          <div
            key={i}
            style={{
              background: 'white',
              border: '1px solid rgba(30,64,175,0.08)',
              borderRadius: r,
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'all 220ms',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <div
              style={{
                height: 140,
                background: p.bg,
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: 56,
                  fontWeight: 700,
                  color: p.color,
                  opacity: 0.18,
                  letterSpacing: '-0.04em',
                }}
              >
                {p.tag}
              </div>
              <div
                style={{
                  position: 'absolute',
                  top: 14,
                  left: 14,
                  fontSize: 10,
                  padding: '4px 10px',
                  background: 'white',
                  color: p.color,
                  borderRadius: 999,
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                {p.tag}
              </div>
            </div>
            <div style={{ padding: 18 }}>
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 16, fontWeight: 600, color: '#1E40AF', marginBottom: 6, letterSpacing: '-0.01em', textWrap: 'balance' }}>
                {p.title}
              </div>
              <div style={{ fontSize: 12, color: '#94A3B8' }}>{p.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
};

const Invest = ({ radius }: any) => {
  const r = radius === 'sharp' ? 4 : 16;
  return (
    <Section bg="#F8FAFC">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
        <div
          style={{
            background: 'white',
            borderRadius: r,
            padding: 32,
            border: '1px solid rgba(30,64,175,0.08)',
            boxShadow: '0 20px 50px -20px rgba(30,64,175,0.15)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 12, color: '#94A3B8' }}>Imbal hasil tahunan</div>
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 36, fontWeight: 600, color: '#1E40AF', letterSpacing: '-0.02em' }}>
                +12,4% <span style={{ fontSize: 14, color: '#22C55E' }}>p.a.</span>
              </div>
            </div>
            <div
              style={{
                fontSize: 11,
                padding: '4px 10px',
 background: '#3B82F6',
 color: '#3B82F6',
                borderRadius: 999,
                fontWeight: 600,
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              ↑ 8.42% MoM
            </div>
          </div>
          {[
            { n: 'Reksadana Pasar Uang', risk: 'Risiko Rendah', perf: '+4,2%', color: '#22C55E' },
            { n: 'SBN Ritel ORI024', risk: 'Risiko Rendah', perf: '+6,1%', color: '#1E5BFF' },
            { n: 'Reksadana Saham IDX30', risk: 'Risiko Tinggi', perf: '+12,8%', color: '#7B5BFF' },
            { n: 'Emas Digital', risk: 'Risiko Rendah', perf: '+9,4%', color: '#4F46E5' },
          ].map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '14px 0', borderBottom: i < 3 ? '1px solid rgba(30,64,175,0.06)' : 'none' }}>
              <div style={{ width: 6, height: 32, borderRadius: 3, background: p.color, marginRight: 14 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#1E40AF' }}>{p.n}</div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{p.risk}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#22C55E', fontFamily: 'Space Grotesk, sans-serif' }}>{p.perf}</div>
            </div>
          ))}
        </div>

        <div>
          <Eyebrow>INVESTASI</Eyebrow>
          <H2>Investasi mulai dari Rp 10rb.</H2>
          <p style={{ fontSize: 17, color: '#64748B', lineHeight: 1.6, marginBottom: 28 }}>
            Reksadana, SBN, emas digital, dan deposito — semuanya di app yang sama. Diawasi OJK, terdaftar resmi, dan bebas komisi pembelian.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              ['✓', 'Bebas biaya pembelian dan penjualan'],
              ['✓', 'Imbal hasil harian, transparan tiap detik'],
              ['✓', 'Auto-invest mulai Rp 10rb per minggu'],
              ['✓', 'Diawasi & terdaftar OJK + KSEI'],
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#E0F4E8', color: '#1E40AF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                  {row[0]}
                </div>
                <div style={{ fontSize: 15, color: '#1E40AF' }}>{row[1]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
};

const Loan = ({ radius }: any) => {
  const [amount, setAmount] = React.useState(15);
  const [tenor, setTenor] = React.useState(12);
  const r = radius === 'sharp' ? 4 : 16;
  const monthly = Math.round((amount * 1_000_000 * 1.07) / tenor);

  return (
    <Section bg="transparent">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
        <div>
          <Eyebrow>PINJAMAN</Eyebrow>
          <H2>Dana cair sampai Rp 200jt, bunga mulai 0,9% per bulan.</H2>
          <p style={{ fontSize: 17, color: '#64748B', lineHeight: 1.6, marginBottom: 24 }}>
            Tanpa agunan, proses online 100%. Persetujuan dalam 30 menit, dana cair hari yang sama.
          </p>
          <button
            style={{
              padding: '14px 24px',
              background: '#1E40AF',
              color: 'white',
              border: 'none',
              borderRadius: radius === 'sharp' ? 2 : 999,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Cek limit pinjaman →
          </button>
        </div>

        <div
          style={{
 background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
            borderRadius: r,
            padding: 32,
            border: '1px solid rgba(30,64,175,0.08)',
          }}
        >
          <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Simulasi Cicilan</div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: '#64748B' }}>Jumlah pinjaman</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#1E40AF', fontFamily: 'Space Grotesk, sans-serif' }}>
                Rp {amount}jt
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="200"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#1E5BFF' }}
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: '#64748B' }}>Tenor</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#1E40AF', fontFamily: 'Space Grotesk, sans-serif' }}>
                {tenor} bulan
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[6, 12, 24, 36].map((t) => (
                <button
                  key={t}
                  onClick={() => setTenor(t)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: tenor === t ? '#1E40AF' : 'white',
                    color: tenor === t ? 'white' : '#64748B',
                    border: '1px solid rgba(30,64,175,0.08)',
                    borderRadius: radius === 'sharp' ? 2 : 8,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {t} bln
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              padding: 20,
              background: 'white',
              borderRadius: radius === 'sharp' ? 2 : 12,
              border: '1px solid rgba(30,64,175,0.08)',
            }}
          >
            <div style={{ fontSize: 12, color: '#94A3B8' }}>Cicilan per bulan</div>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 32, fontWeight: 600, color: '#1E40AF', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
              Rp {monthly.toLocaleString('id-ID')}
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>Bunga efektif 0,9%/bulan · Tanpa biaya tersembunyi</div>
          </div>
        </div>
      </div>
    </Section>
  );
};

const Security = ({ radius }: any) => {
  const r = radius === 'sharp' ? 4 : 16;
  return (
    <Section bg="#1E40AF">
      <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 56px' }}>
        <Eyebrow color="#5B8DFF">KEAMANAN</Eyebrow>
        <H2 light>Dana kamu aman, kami pastikan.</H2>
        <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
          Diawasi OJK, dijamin LPS hingga Rp 2 miliar. Standar enkripsi setara perbankan global.
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { i: '◆', t: 'Enkripsi 256-bit', d: 'Standar AES-256 untuk semua data sensitif.' },
          { i: '◉', t: 'Biometrik Dual', d: 'Face ID + fingerprint untuk login & transaksi.' },
          { i: '✦', t: 'Diawasi OJK', d: 'Terdaftar resmi & diawasi Otoritas Jasa Keuangan.' },
          { i: '◈', t: 'Dijamin LPS', d: 'Simpanan dijamin hingga Rp 2 miliar oleh LPS.' },
        ].map((f, i) => (
          <div
            key={i}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: r,
              padding: 28,
              backdropFilter: 'blur(10px)',
            }}
          >
            <div style={{ fontSize: 28, color: '#5B8DFF', marginBottom: 16, fontFamily: 'Space Grotesk, sans-serif' }}>{f.i}</div>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 17, fontWeight: 600, color: 'white', marginBottom: 6, letterSpacing: '-0.01em' }}>
              {f.t}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{f.d}</div>
          </div>
        ))}
      </div>
    </Section>
  );
};

const Testi = ({ radius }: any) => {
  const r = radius === 'sharp' ? 4 : 16;
  const [active, setActive] = React.useState(0);
  const items = [
    { name: 'Rina Wijaya', role: 'UX Designer · Jakarta', text: 'Transfer ke tukang ojek yang beda bank, gratis dan instan. Notifikasi masuk sebelum saya selesai cek HP. Banking yang feels like 2026.', avatar: '#E0E7FF', initial: 'RW' },
    { name: 'Aldo Pratama', role: 'Founder, Kopi Kenangan Lokal', text: 'Multi pocket buat misahin dana operasional sama personal — game changer. Rekonsiliasi keuangan bisnis jadi 5x lebih cepat.', avatar: '#D4E5C2', initial: 'AP' },
    { name: 'Maya Salim', role: 'Content Creator', text: 'Bunga deposito kompetitif, plus reksadana pasar uang yang likuid. Saya pindah dari 3 bank ke SmartBank dan nggak nyesel.', avatar: '#C2D4FF', initial: 'MS' },
  ];
  return (
    <Section bg="transparent">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 80, alignItems: 'center' }}>
        <div>
          <Eyebrow>CERITA_PENGGUNA</Eyebrow>
          <H2>Dipakai 3 juta+ orang yang nggak suka ribet.</H2>
          <div style={{ display: 'flex', gap: 8, marginTop: 28 }}>
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: 'none',
                  background: active === i ? '#1E40AF' : 'rgba(30,64,175,0.08)',
                  color: active === i ? 'white' : '#64748B',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
        <div
          style={{
            background: '#F8FAFC',
            borderRadius: r,
            padding: 40,
            border: '1px solid rgba(30,64,175,0.08)',
            position: 'relative',
          }}
        >
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 80, color: 'rgba(30,91,255,0.18)', position: 'absolute', top: 16, left: 32, lineHeight: 1 }}>
            "
          </div>
          <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 22, color: '#1E40AF', lineHeight: 1.4, marginBottom: 28, letterSpacing: '-0.01em', textWrap: 'pretty', position: 'relative' }}>
            {items[active].text}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: items[active].avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: '#1E40AF' }}>
              {items[active].initial}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: '#1E40AF' }}>{items[active].name}</div>
              <div style={{ fontSize: 13, color: '#94A3B8' }}>{items[active].role}</div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

const Branch = ({ radius }: any) => {
  const r = radius === 'sharp' ? 4 : 16;
  return (
    <Section bg="#F8FAFC">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 60, alignItems: 'center' }}>
        <div>
          <Eyebrow>JARINGAN</Eyebrow>
          <H2 style={{ fontSize: 'clamp(32px, 3.6vw, 44px)' }}>1.200+ ATM & 80+ kantor cabang di Indonesia.</H2>
          <p style={{ fontSize: 16, color: '#64748B', lineHeight: 1.6, marginBottom: 24 }}>
            Tarik tunai gratis di semua jaringan ATM Bersama, Prima, dan ALTO. Atau datang ke cabang terdekat.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              placeholder="Cari kota atau kode pos..."
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid rgba(30,64,175,0.12)',
                borderRadius: radius === 'sharp' ? 2 : 999,
                fontSize: 14,
                outline: 'none',
                background: 'white',
                fontFamily: 'Inter, sans-serif',
              }}
            />
            <button
              style={{
                padding: '12px 20px',
                background: '#1E40AF',
                color: 'white',
                border: 'none',
                borderRadius: radius === 'sharp' ? 2 : 999,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Cari
            </button>
          </div>
        </div>
        <div
          style={{
            position: 'relative',
            height: 380,
 background: '#3B82F6',
            borderRadius: r,
            overflow: 'hidden',
            border: '1px solid rgba(30,64,175,0.08)',
          }}
        >
          {/* Stylized map */}
          <svg viewBox="0 0 600 380" style={{ width: '100%', height: '100%', position: 'absolute' }}>
            <defs>
              <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(30,64,175,0.08)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="600" height="380" fill="url(#grid)" />
            {/* Indonesia silhouette stylized */}
            <path d="M 80 200 Q 120 170 180 180 T 280 200 Q 320 195 360 210 L 410 215 Q 450 220 480 215 L 520 220" stroke="rgba(30,64,175,0.25)" strokeWidth="20" fill="none" strokeLinecap="round" />
            <path d="M 90 240 Q 130 250 170 245 L 220 250" stroke="rgba(30,64,175,0.18)" strokeWidth="14" fill="none" strokeLinecap="round" />
          </svg>
          {[
            { x: '20%', y: '52%', label: 'Jakarta', count: '320' },
            { x: '38%', y: '55%', label: 'Surabaya', count: '180' },
            { x: '52%', y: '60%', label: 'Bali', count: '45' },
            { x: '68%', y: '52%', label: 'Makassar', count: '60' },
            { x: '15%', y: '40%', label: 'Medan', count: '120' },
          ].map((p, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: p.x,
                top: p.y,
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
 background: '#3B82F6',
                  boxShadow: '0 0 0 4px rgba(30,91,255,0.2), 0 0 0 10px rgba(30,91,255,0.08)',
                }}
              />
              <div style={{ background: 'white', padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, color: '#1E40AF', boxShadow: '0 4px 12px -2px rgba(30,64,175,0.15)', whiteSpace: 'nowrap' }}>
                {p.label} · {p.count}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
};

const FAQ = ({ radius }: any) => {
  const r = radius === 'sharp' ? 4 : 12;
  const [open, setOpen] = React.useState(0);
  const items = [
    { q: 'Apakah SmartBank diawasi OJK?', a: 'Ya, SmartBank adalah bank umum yang terdaftar dan diawasi oleh Otoritas Jasa Keuangan (OJK), serta menjadi peserta penjaminan LPS.' },
    { q: 'Berapa biaya buka rekening?', a: 'Gratis. Tidak ada biaya pembukaan, biaya admin bulanan, atau saldo minimum.' },
    { q: 'Berapa lama proses verifikasi?', a: 'Verifikasi identitas dan biometrik selesai dalam 3-5 menit. Rekening langsung aktif setelah verifikasi berhasil.' },
    { q: 'Apakah transfer ke bank lain benar-benar gratis?', a: 'Ya. Transfer ke semua bank lokal gratis tanpa batas, tanpa syarat saldo minimum.' },
    { q: 'Bisa tarik tunai di mana saja?', a: 'Tarik tunai gratis di lebih dari 1.200 ATM SmartBank dan semua jaringan ATM Bersama, Prima, dan ALTO di seluruh Indonesia.' },
  ];
  return (
    <Section bg="transparent">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 80 }}>
        <div>
          <Eyebrow>PERTANYAAN</Eyebrow>
          <H2>Yang sering ditanyakan.</H2>
          <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.6, marginTop: 16 }}>
            Tidak menemukan jawaban?{' '}
            <a href="#" onClick={(e) => e.preventDefault()} style={{ color: '#3B82F6', fontWeight: 600 }}>
              Chat dengan tim kami →
            </a>
          </p>
        </div>
        <div>
          {items.map((it, i) => (
            <div
              key={i}
              style={{
                borderBottom: '1px solid rgba(30,64,175,0.1)',
                cursor: 'pointer',
              }}
              onClick={() => setOpen(open === i ? -1 : i)}
            >
              <div style={{ padding: '20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, fontWeight: 500, color: '#1E40AF', letterSpacing: '-0.01em' }}>
                  {it.q}
                </div>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: open === i ? '#1E40AF' : 'transparent',
                    color: open === i ? 'white' : '#1E40AF',
                    border: open === i ? 'none' : '1px solid rgba(30,64,175,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    flexShrink: 0,
                    transition: 'all 200ms',
                    transform: open === i ? 'rotate(45deg)' : 'rotate(0)',
                  }}
                >
                  +
                </div>
              </div>
              <div
                style={{
                  maxHeight: open === i ? 200 : 0,
                  overflow: 'hidden',
                  transition: 'max-height 280ms ease, padding 280ms',
                  paddingBottom: open === i ? 20 : 0,
                }}
              >
                <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.6, margin: 0, maxWidth: 580 }}>{it.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
};

const CTA = ({ radius }: any) => (
  <Section bg="#1E40AF" style={{ padding: '120px 32px', position: 'relative', overflow: 'hidden' }}>
    <div
      style={{
        position: 'absolute',
        top: '-30%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 800,
        height: 800,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(30,91,255,0.25) 0%, transparent 60%)',
        pointerEvents: 'none',
      }}
    />
    <div style={{ textAlign: 'center', position: 'relative', maxWidth: 720, margin: '0 auto' }}>
      <H2 light style={{ fontSize: 'clamp(40px, 5vw, 68px)' }}>
        Buka rekening dalam 3 menit. Hari ini.
      </H2>
      <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: '0 0 36px' }}>
        Tanpa antre, tanpa setoran awal, tanpa biaya tersembunyi.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          style={{
            padding: '16px 32px',
            background: 'white',
            color: '#1E40AF',
            border: 'none',
            borderRadius: radius === 'sharp' ? 2 : 999,
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Buka Rekening Sekarang →
        </button>
        <button
          style={{
            padding: '16px 32px',
            background: 'transparent',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: radius === 'sharp' ? 2 : 999,
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Pelajari lebih lanjut
        </button>
      </div>
      <div style={{ marginTop: 44, display: 'flex', gap: 32, justifyContent: 'center', fontSize: 13, color: 'rgba(255,255,255,0.5)', flexWrap: 'wrap' }}>
        <span>✓ Diawasi OJK</span>
        <span>✓ Dijamin LPS hingga Rp 2 M</span>
        <span>✓ ISO 27001 Certified</span>
      </div>
    </div>
  </Section>
);

const Footer = () => (
  <footer style={{ background: '#0F172A', color: 'rgba(255,255,255,0.7)', padding: '64px 32px 32px' }}>
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr', gap: 40, marginBottom: 56 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif' }}>
              S
            </div>
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 19, color: 'white' }}>SmartBank</span>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
            Bank digital pertama yang dirancang untuk generasi yang nggak punya waktu antre.
          </p>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
            PT Bank Smart Indonesia Tbk<br />
            Diawasi OJK · Anggota LPS
          </div>
        </div>
        {[
          { t: 'Produk', l: ['Rekening Tabungan', 'Kartu Debit', 'Pinjaman', 'Investasi', 'Deposito'] },
          { t: 'Bisnis', l: ['SmartBank Bisnis', 'Payroll', 'Payment Gateway', 'API Documentation'] },
          { t: 'Bantuan', l: ['Pusat Bantuan', 'Hubungi Kami', 'Lokasi ATM', 'Karir', 'Blog'] },
          { t: 'Legal', l: ['Syarat & Ketentuan', 'Kebijakan Privasi', 'Keamanan', 'Lisensi & Regulasi'] },
        ].map((c) => (
          <div key={c.t}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'white', marginBottom: 14, fontFamily: 'Space Grotesk, sans-serif' }}>
              {c.t}
            </div>
            {c.l.map((it) => (
              <a
                key={it}
                href="#"
                onClick={(e) => e.preventDefault()}
                style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.55)', textDecoration: 'none', padding: '5px 0' }}
              >
                {it}
              </a>
            ))}
          </div>
        ))}
      </div>
      <div style={{ paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
        <div>© 2026 PT Bank Smart Indonesia Tbk. Semua hak dilindungi.</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <span>Bahasa Indonesia</span>
          <span>·</span>
          <a href="#" onClick={(e) => e.preventDefault()} style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>English</a>
        </div>
      </div>
    </div>
  </footer>
);














export default function NewLanding() {
  const radius = 'rounded';
  return (
    <div style={{ background: '#1E40AF', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      <Nav radius={radius} />
      <Hero variant="dashboard" radius={radius} />
      <Features radius={radius} />
      <AppShowcase radius={radius} />
      <Promo radius={radius} />
      <Invest radius={radius} />
      <Loan radius={radius} />
      <Security radius={radius} />
      <Testi radius={radius} />
      <Branch radius={radius} />
      <FAQ radius={radius} />
      <CTA radius={radius} />
      <Footer />
    </div>
  );
}
