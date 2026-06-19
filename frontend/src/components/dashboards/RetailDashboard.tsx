"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, BadgeDollarSign, CheckCircle2, Clock, Copy, RefreshCw, Send, User, Wallet } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { fetchApi } from "@/lib/api";
import KycDocumentCard from "@/components/KycDocumentCard";

type Transaction = {
  id: string;
  transaction_type: string;
  status: string;
  gross_amount: string | number;
  total_debit: string | number;
  created_at: string;
  direction: "CREDIT" | "DEBIT" | "IN" | "OUT";
  other_party?: string;
};

type BalanceInfo = {
  account_number?: string | null;
  holder_name?: string | null;
  wallet_id?: string;
  currency?: string;
  available_balance?: string | number;
  hold_balance?: string | number;
};

type RetailMode = "all" | "overview" | "transfer" | "loans" | "activity" | "kyc";

const money = (value: string | number | null | undefined) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value || 0));

const unwrap = <T,>(response: { data?: T } | T): T =>
  typeof response === "object" && response !== null && "data" in response ? (response as { data: T }).data : (response as T);

const isCredit = (direction: Transaction["direction"]) => direction === "CREDIT" || direction === "IN";

// Format 10 digit menjadi "1234-5678-90" untuk tampilan.
// Memfilter non-digit dulu agar toleran terhadap paste dengan spasi/dash.
const formatAccountDisplay = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 4) return digits;
  if (digits.length <= 8) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
};

const isValidAccountNumberFormat = (value: string): boolean => /^\d{10}$/.test(value.replace(/\D/g, ""));

type RecipientLookup = {
  account_number: string;
  holder_name: string;
  wallet_id: string;
};

type ActiveLoan = {
  id: string;
  principal: number;
  interest_amount: number;
  total_due: number;
  paid_amount: number;
  remaining: number;
  status: "PENDING" | "DISBURSED" | "PARTIAL_PAID";
  created_at: string;
  disbursed_at: string | null;
  due_at: string | null;
  recommended_by: string | null;
  recommended_at: string | null;
  recommendation_note: string | null;
};

type LoanLimit = {
  cap: number;
  outstanding: number;
  remaining: number;
};

export default function RetailDashboard({ mode = "all" }: { mode?: RetailMode } = {}) {
  const [balance, setBalance] = useState(0);
  const [balanceInfo, setBalanceInfo] = useState<BalanceInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [kycTier, setKycTier] = useState("BASIC");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState("");
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [transfer, setTransfer] = useState({ accountNumber: "", amount: "", note: "", pin: "" });
  // Map digit-only account number → lookup result. Key null/undefined = "not found".
  const [lookupCache, setLookupCache] = useState<Record<string, RecipientLookup | null>>({});
  const [lookingUp, setLookingUp] = useState(false);
  const [loan, setLoan] = useState({ amount: "", term: "12" });
  // Daftar pinjaman aktif (PENDING/DISBURSED/PARTIAL_PAID) — auto-load dari
  // /loans/me sehingga Nasabah tidak perlu input loanId manual saat bayar.
  const [activeLoans, setActiveLoans] = useState<ActiveLoan[]>([]);
  const [loanLimit, setLoanLimit] = useState<LoanLimit>({ cap: 100_000, outstanding: 0, remaining: 100_000 });
  // Loan ID yang sedang expand form pembayarannya. Null = semua collapse.
  const [expandedRepayId, setExpandedRepayId] = useState<string | null>(null);
  const [repayDraft, setRepayDraft] = useState<{ amount: string; pin: string }>({ amount: "", pin: "" });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [balanceResponse, transactionResponse, kycResponse, loansResponse] = await Promise.all([
        fetchApi<{ data?: BalanceInfo } | BalanceInfo>("/api/wallet/v1/wallets/me/balance"),
        fetchApi<{ data?: Transaction[] } | Transaction[]>("/api/wallet/v1/wallets/me/transactions"),
        fetchApi<{ data?: { kycTier?: string }; kycTier?: string }>("/api/wallet/v1/wallets/me/kyc-document"),
        // /loans/me bisa 403 kalau KYC BASIC — tetap coba, fallback ke list kosong.
        fetchApi<{ data?: { loans?: ActiveLoan[]; limit?: LoanLimit } } | { loans: ActiveLoan[]; limit: LoanLimit }>(
          "/api/wallet/v1/loans/me",
        ).catch(() => null),
      ]);
      const balanceData = unwrap(balanceResponse);
      const transactionData = unwrap(transactionResponse);
      const kycData = unwrap(kycResponse);
      setBalance(Number(balanceData.available_balance || 0));
      setBalanceInfo(balanceData);
      setTransactions(Array.isArray(transactionData) ? transactionData : []);
      setKycTier(kycData.kycTier || "BASIC");
      if (loansResponse) {
        const loansData = unwrap(loansResponse);
        setActiveLoans(Array.isArray(loansData.loans) ? loansData.loans : []);
        if (loansData.limit) setLoanLimit(loansData.limit);
      } else {
        setActiveLoans([]);
      }
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Data dompet gagal dimuat." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const chartData = useMemo(() => {
    let running = balance;
    return [...transactions].slice(0, 12).map((item) => {
      const debit = !isCredit(item.direction);
      const amount = Number(debit ? item.total_debit : item.gross_amount);
      const point = { date: new Date(item.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }), value: running };
      running += debit ? amount : -amount;
      return point;
    }).reverse();
  }, [balance, transactions]);

  const mutate = async (key: string, endpoint: string, payload: object, success: string) => {
    setProcessing(key);
    setNotice(null);
    try {
      await fetchApi(endpoint, { method: "POST", body: JSON.stringify(payload) });
      setNotice({ tone: "success", text: success });
      await refresh();
      return true;
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Permintaan gagal diproses." });
      return false;
    } finally {
      setProcessing("");
    }
  };

  // Lookup nomor rekening tujuan saat user selesai mengisi 10 digit.
  // Debounce 400ms untuk menghindari spam request saat paste bertahap.
  const transferDigits = transfer.accountNumber.replace(/\D/g, "");
  useEffect(() => {
    if (transferDigits.length !== 10) return;
    if (Object.prototype.hasOwnProperty.call(lookupCache, transferDigits)) return;
    const timer = window.setTimeout(async () => {
      setLookingUp(true);
      try {
        const data = await fetchApi<{ data?: RecipientLookup } | RecipientLookup>(
          `/api/wallet/v1/wallets/lookup?account_number=${transferDigits}`
        );
        const recipient = unwrap(data);
        setLookupCache((prev) => ({ ...prev, [transferDigits]: recipient }));
      } catch {
        setLookupCache((prev) => ({ ...prev, [transferDigits]: null }));
      } finally {
        setLookingUp(false);
      }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [transferDigits, lookupCache]);

  // Derived: recipient untuk digit yang sedang diketik (atau null).
  const recipient: RecipientLookup | null =
    transferDigits.length === 10 && Object.prototype.hasOwnProperty.call(lookupCache, transferDigits)
      ? lookupCache[transferDigits]
      : null;
  const recipientLookupAttempted =
    transferDigits.length === 10 && Object.prototype.hasOwnProperty.call(lookupCache, transferDigits);

  const submitTransfer = async (event: FormEvent) => {
    event.preventDefault();
    const digits = transfer.accountNumber.replace(/\D/g, "");
    if (!isValidAccountNumberFormat(digits)) {
      setNotice({ tone: "error", text: "Nomor rekening tujuan harus 10 digit." });
      return;
    }
    if (!recipient) {
      setNotice({ tone: "error", text: "Nomor rekening tujuan belum diverifikasi. Tunggu konfirmasi nama pemilik." });
      return;
    }
    if (await mutate(
      "transfer",
      "/api/wallet/v1/transfers",
      {
        to_account_number: digits,
        amount: transfer.amount,
        note: transfer.note.trim() || "Transfer",
        pin: transfer.pin,
      },
      `Transfer ke ${recipient.holder_name} berhasil diproses.`,
    )) {
      setTransfer({ accountNumber: "", amount: "", note: "", pin: "" });
      setLookupCache({});
    }
  };

  const submitLoan = async (event: FormEvent) => {
    event.preventDefault();
    if (kycTier !== "VERIFIED") {
      setNotice({ tone: "error", text: "Pengajuan pinjaman hanya tersedia setelah KYC diverifikasi Teller." });
      return;
    }
    if (await mutate("loan", "/api/wallet/v1/loans/apply", { amount: loan.amount, term_months: Number(loan.term) }, "Pengajuan pinjaman tercatat dan menunggu persetujuan Manager.")) {
      setLoan({ amount: "", term: "12" });
    }
  };

  const submitRepayment = async (event: FormEvent, loanId: string) => {
    event.preventDefault();
    if (await mutate(
      `repayment-${loanId}`,
      `/api/wallet/v1/loans/${loanId}/repay`,
      { amount: repayDraft.amount, pin: repayDraft.pin },
      "Pembayaran pinjaman berhasil diproses.",
    )) {
      setRepayDraft({ amount: "", pin: "" });
      setExpandedRepayId(null);
    }
  };

  // Buka form repay inline untuk loan tertentu. Pre-fill amount dengan sisa tagihan.
  const openRepayForm = (loan: ActiveLoan) => {
    if (expandedRepayId === loan.id) {
      setExpandedRepayId(null);
      setRepayDraft({ amount: "", pin: "" });
      return;
    }
    setExpandedRepayId(loan.id);
    setRepayDraft({ amount: String(loan.remaining), pin: "" });
  };

  const copyAccountNumber = async () => {
    if (!balanceInfo?.account_number) return;
    try {
      await navigator.clipboard.writeText(balanceInfo.account_number);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API tidak tersedia (mis. http non-localhost) — silent fail.
    }
  };

  const showOverview = mode === "all" || mode === "overview";
  const showKyc = mode === "all" || mode === "kyc";
  const showTransfer = mode === "transfer";
  const showLoans = mode === "all" || mode === "loans";
  const showActivity = mode === "all" || mode === "activity";

  const ownAccountDisplay = balanceInfo?.account_number ? formatAccountDisplay(balanceInfo.account_number) : "—";
  const ownAccountDigits = balanceInfo?.account_number?.replace(/\D/g, "") ?? "";
  const ownHolderName = balanceInfo?.holder_name?.trim();
  const lookupError: boolean = transferDigits.length === 10 && !lookingUp && recipientLookupAttempted && !recipient;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 font-mono text-xs font-semibold uppercase text-primary">Retail wallet</p>
          <h1 className="text-balance font-display text-3xl font-semibold">Kendalikan uang digital Anda</h1>
          <p className="mt-2 text-pretty text-sm text-muted-foreground">Saldo, transfer, KYC, aktivitas, dan pinjaman dalam route yang terpisah namun tetap terhubung ke ledger.</p>
        </div>
        <button onClick={() => void refresh()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold shadow-sm hover:bg-secondary disabled:opacity-50">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Segarkan
        </button>
      </header>

      {notice && <div className={`rounded-xl border p-4 text-sm ${notice.tone === "success" ? "border-primary/30 bg-primary/10 text-primary" : "border-destructive/30 bg-destructive/10 text-destructive"}`}>{notice.text}</div>}

      {showOverview && (
        <section id="overview" className="grid scroll-mt-8 gap-6 lg:grid-cols-5">
          <article className="rounded-2xl bg-primary p-6 text-primary-foreground shadow-sm lg:col-span-3">
            <div className="flex items-center gap-2 text-sm text-primary-foreground/75"><Wallet size={18} /> Saldo tersedia</div>
            <p className="mt-4 font-mono text-4xl font-semibold tabular-nums md:text-5xl">{loading ? "Memuat..." : money(balance)}</p>

            {/* Nomor rekening pemilik — alamat wallet publik untuk menerima transfer masuk. */}
            <div className="mt-6 rounded-xl border border-primary-foreground/20 bg-primary-foreground/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-primary-foreground/70">Nomor rekening Anda</p>
                  <p className="mt-1 font-mono text-xl font-semibold tracking-wider tabular-nums md:text-2xl">{ownAccountDisplay}</p>
                  {ownHolderName && <p className="mt-1 text-xs text-primary-foreground/75">a/n {ownHolderName}</p>}
                </div>
                <button
                  type="button"
                  onClick={copyAccountNumber}
                  disabled={!ownAccountDigits}
                  className="inline-flex items-center gap-2 rounded-lg border border-primary-foreground/30 bg-primary-foreground/10 px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary-foreground/20 disabled:opacity-40"
                  title="Salin nomor rekening"
                >
                  <Copy size={14} /> {copied ? "Tersalin" : "Salin"}
                </button>
              </div>
              <p className="mt-3 text-xs text-primary-foreground/70">
                Bagikan nomor ini untuk menerima dana. Jangan gunakan Wallet ID internal Anda.
              </p>
            </div>

            <div className="mt-6 h-32">
              {chartData.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}><XAxis dataKey="date" hide /><Tooltip formatter={(value) => money(Number(value))} /><Area dataKey="value" type="monotone" stroke="currentColor" fill="currentColor" fillOpacity={0.16} isAnimationActive={false} /></AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-xl border border-primary-foreground/20 text-sm text-primary-foreground/70">Grafik akan terbentuk setelah ada aktivitas transaksi.</div>
              )}
            </div>
          </article>
          <article className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
            <h2 className="font-display text-xl font-semibold">Status KYC dan limit</h2>
            <p className="mt-2 text-sm text-muted-foreground">Nasabah BASIC dibatasi saldo Rp100.000 dan tidak bisa mengajukan pinjaman. Upload dokumen lalu minta Teller memverifikasi.</p>
            <span className={`mt-5 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${kycTier === "VERIFIED" ? "bg-primary/10 text-primary" : "bg-amber-500/10 text-amber-700"}`}>{kycTier}</span>

            {showLoans && <LoanLimitCard kycTier={kycTier} limit={loanLimit} />}
          </article>
        </section>
      )}

      {showKyc && <KycDocumentCard onStatusChange={setKycTier} />}

      {showTransfer && (
        <section id="transfer" className="grid scroll-mt-8 gap-6 lg:grid-cols-2">
          <form onSubmit={submitTransfer} className="space-y-3 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-2 flex items-center gap-3"><Send size={19} className="text-primary" /><h2 className="font-display text-xl font-semibold">Transfer cepat</h2></div>
            <p className="text-xs text-muted-foreground">Masukkan nomor rekening tujuan (10 digit, termasuk checksum Luhn). Wallet ID internal tidak lagi dipakai untuk transfer.</p>

            <div className="space-y-1">
              <label htmlFor="to-account" className="text-xs font-medium text-muted-foreground">Nomor rekening tujuan</label>
              <input
                id="to-account"
                required
                value={formatAccountDisplay(transfer.accountNumber)}
                onChange={(e) => setTransfer({ ...transfer, accountNumber: e.target.value })}
                placeholder="1234-5678-90"
                inputMode="numeric"
                maxLength={12}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono tabular-nums outline-none focus:border-primary"
              />
            </div>

            {/* Konfirmasi pemilik rekening hasil lookup realtime. */}
            {transferDigits.length === 10 && (
              <div className={`flex items-start gap-2 rounded-lg border p-3 text-xs ${
                recipient
                  ? "border-primary/30 bg-primary/5 text-primary"
                  : lookingUp
                    ? "border-border bg-secondary/40 text-muted-foreground"
                    : "border-destructive/30 bg-destructive/5 text-destructive"
              }`}>
                <User size={14} className="mt-0.5 shrink-0" />
                <div>
                  {recipient ? (
                    <>
                      <p className="font-semibold">{recipient.holder_name}</p>
                      <p className="text-[11px] opacity-80">Pemilik rekening terverifikasi. Pastikan nama sesuai sebelum kirim.</p>
                    </>
                  ) : lookingUp || !recipientLookupAttempted ? (
                    <p>Memverifikasi nomor rekening…</p>
                  ) : (
                    <p>Nomor rekening tidak ditemukan atau belum aktif.</p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="tx-amount" className="text-xs font-medium text-muted-foreground">Nominal</label>
              <input id="tx-amount" required min="1" type="number" value={transfer.amount} onChange={(e) => setTransfer({ ...transfer, amount: e.target.value })} placeholder="Contoh: 10000" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono outline-none focus:border-primary" />
            </div>
            <div className="space-y-1">
              <label htmlFor="tx-note" className="text-xs font-medium text-muted-foreground">Catatan (opsional)</label>
              <input id="tx-note" value={transfer.note} onChange={(e) => setTransfer({ ...transfer, note: e.target.value })} placeholder="Catatan transaksi" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
            <div className="space-y-1">
              <label htmlFor="tx-pin" className="text-xs font-medium text-muted-foreground">PIN 6 digit</label>
              <input id="tx-pin" required inputMode="numeric" maxLength={6} type="password" value={transfer.pin} onChange={(e) => setTransfer({ ...transfer, pin: e.target.value })} placeholder="••••••" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono outline-none focus:border-primary" />
            </div>
            <button disabled={processing === "transfer" || !recipient || lookupError} className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {processing === "transfer" ? "Memproses..." : recipient ? `Kirim ke ${recipient.holder_name}` : "Kirim dana"}
            </button>
          </form>
          <article className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-display text-xl font-semibold">Catatan transfer</h2>
            <p className="mt-2 text-sm text-muted-foreground">Transfer membutuhkan PIN dan akan masuk ke settlement Central Bank dengan biaya, pajak, idempotency, cooldown, dan daily limit. Tujuan transfer hanyaboleh nomor rekening — bukan Wallet ID internal — untuk mencegah salah kirim.</p>
          </article>
        </section>
      )}

      {showLoans && (
        <section id="loans" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <form onSubmit={submitLoan} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3"><BadgeDollarSign className="text-primary" size={20} /><h2 className="font-display text-xl font-semibold">Ajukan pinjaman</h2></div>
              <p className="text-sm text-muted-foreground">Pengajuan tidak langsung dicairkan. Manager harus meninjau dan menyetujuinya. Pinjaman kecil (≤ 50.000) akan di-screening Teller terlebih dahulu.</p>
              {kycTier !== "VERIFIED" && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700">
                  <AlertTriangle size={17} />
                  Upload dokumen dan tunggu Teller memverifikasi KYC sebelum mengajukan pinjaman.
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  required
                  min="1"
                  type="number"
                  value={loan.amount}
                  onChange={(e) => setLoan({ ...loan, amount: e.target.value })}
                  placeholder={`Nominal (max ${money(loanLimit.remaining)})`}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono outline-none focus:border-primary"
                />
                <select value={loan.term} onChange={(e) => setLoan({ ...loan, term: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"><option value="3">3 bulan</option><option value="6">6 bulan</option><option value="12">12 bulan</option><option value="24">24 bulan</option></select>
              </div>
              <button
                disabled={processing === "loan" || kycTier !== "VERIFIED" || loanLimit.remaining <= 0}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {processing === "loan" ? "Mengirim..." : loanLimit.remaining <= 0 ? "Limit habis" : "Kirim pengajuan"}
              </button>
            </form>

            {/* Daftar pinjaman aktif + form bayar inline per card */}
            <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3"><CheckCircle2 className="text-primary" size={20} /><h2 className="font-display text-xl font-semibold">Pinjaman Anda</h2></div>
              {activeLoans.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada pinjaman aktif. Ajukan pinjaman di samping untuk memulai.</p>
              ) : (
                <div className="space-y-3">
                  {activeLoans.map((ln) => {
                    const isExpanded = expandedRepayId === ln.id;
                    const progressPct = ln.total_due > 0 ? Math.min(100, (ln.paid_amount / ln.total_due) * 100) : 0;
                    return (
                      <article key={ln.id} className="rounded-xl border border-border bg-background p-4 text-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-mono text-xs uppercase text-muted-foreground">{ln.status.replaceAll("_", " ")}</p>
                            <p className="mt-1 font-display text-lg font-semibold tabular-nums">{money(ln.total_due)}</p>
                            <p className="text-xs text-muted-foreground">Pokok {money(ln.principal)} • Terbayar {money(ln.paid_amount)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Sisa</p>
                            <p className="font-mono text-base font-semibold tabular-nums text-primary">{money(ln.remaining)}</p>
                          </div>
                        </div>
                        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                          <div className="h-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
                        </div>
                        {ln.recommended_by && (
                          <p className="mt-2 text-[11px] text-muted-foreground">Sudah di-screening Teller</p>
                        )}
                        {(ln.status === "DISBURSED" || ln.status === "PARTIAL_PAID") && (
                          <button
                            type="button"
                            onClick={() => openRepayForm(ln)}
                            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                          >
                            {isExpanded ? "Tutup" : "Bayar cicilan"}
                          </button>
                        )}
                        {isExpanded && (
                          <form onSubmit={(e) => submitRepayment(e, ln.id)} className="mt-3 space-y-2 border-t border-border pt-3">
                            <div className="grid gap-2 sm:grid-cols-2">
                              <input
                                required
                                min="1"
                                type="number"
                                value={repayDraft.amount}
                                onChange={(e) => setRepayDraft({ ...repayDraft, amount: e.target.value })}
                                placeholder="Nominal bayar"
                                className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-mono outline-none focus:border-primary"
                              />
                              <input
                                required
                                type="password"
                                inputMode="numeric"
                                maxLength={6}
                                value={repayDraft.pin}
                                onChange={(e) => setRepayDraft({ ...repayDraft, pin: e.target.value })}
                                placeholder="PIN 6 digit"
                                className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-mono outline-none focus:border-primary"
                              />
                            </div>
                            <button
                              disabled={processing === `repayment-${ln.id}`}
                              className="w-full rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                            >
                              {processing === `repayment-${ln.id}` ? "Memproses..." : `Bayar ${money(ln.remaining)}`}
                            </button>
                          </form>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {showActivity && (
        <section id="activity" className="scroll-mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border p-5"><h2 className="font-display text-xl font-semibold">Aktivitas terbaru</h2><Clock size={17} className="text-muted-foreground" /></div>
          {transactions.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">Belum ada transaksi untuk ditampilkan.</p> : transactions.slice(0, 10).map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 border-b border-border p-4 last:border-0 md:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2 text-primary">{isCredit(item.direction) ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}</div>
                <div className="min-w-0"><p className="truncate text-sm font-semibold">{item.transaction_type.replaceAll("_", " ")}</p><p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString("id-ID")} - {item.status}</p></div>
              </div>
              <p className={`shrink-0 font-mono text-sm font-semibold tabular-nums ${isCredit(item.direction) ? "text-primary" : ""}`}>{isCredit(item.direction) ? "+" : "-"} {money(isCredit(item.direction) ? item.gross_amount : item.total_debit)}</p>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

// Sub-component: card progress limit pinjaman
// Ditampilkan di overview kalau user boleh lihat section loans (mode overview atau all).
function LoanLimitCard({ kycTier, limit }: { kycTier: string; limit: LoanLimit }) {
  const usedPct = limit.cap > 0 ? Math.min(100, (limit.outstanding / limit.cap) * 100) : 0;
  return (
    <div className="mt-5 rounded-xl border border-border bg-background p-4">
      <p className="text-xs font-medium uppercase text-muted-foreground">Limit Pinjaman</p>
      {kycTier !== "VERIFIED" ? (
        <>
          <p className="mt-2 text-sm text-amber-700">Selesaikan verifikasi KYC untuk membuka akses pinjaman.</p>
          <p className="mt-1 text-xs text-muted-foreground">Setelah KYC VERIFIED, limit hingga {money(limit.cap)}.</p>
        </>
      ) : (
        <>
          <p className="mt-1 font-mono text-lg font-semibold tabular-nums">{money(limit.remaining)} <span className="text-xs text-muted-foreground">/ {money(limit.cap)}</span></p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={`h-full transition-all ${limit.remaining <= 0 ? "bg-destructive" : "bg-primary"}`}
              style={{ width: `${usedPct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Pinjaman aktif {money(limit.outstanding)} • Sisa limit {money(limit.remaining)}</p>
        </>
      )}
    </div>
  );
}
