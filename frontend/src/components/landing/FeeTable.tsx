"use client";

import { motion } from "framer-motion";
import { Calculator, Percent } from "lucide-react";

const rows = [
  { source: "Bank", app: "CentralBank Core", bps: 100, flat: "—", note: "Otoritas moneter" },
  { source: "Gateway", app: "API Gateway", bps: 50, flat: "—", note: "Integrasi lintas service" },
  { source: "Marketplace", app: "PasarKita", bps: 200, flat: "—", note: "Fee marketplace opsional" },
  { source: "POS", app: "WarungPOS", bps: 100, flat: "—", note: "Fee toko fisik" },
  { source: "Supplier", app: "SupplierHub", bps: 300, flat: "—", note: "Fee supplier" },
  { source: "Logistik", app: "LogistiKita", bps: 250, flat: "—", note: "Fee ongkir" },
  { source: "Pajak", app: "Tax Sink", bps: 200, flat: "—", note: "Tax simulatif" },
];

const exampleAmount = 100_000;
const totalBps = rows.reduce((s, r) => s + r.bps, 0);
const exampleFee = Math.round((exampleAmount * totalBps) / 10_000);
const exampleTotal = exampleAmount + exampleFee;

export default function FeeTable() {
  return (
    <section className="px-6 py-20">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 space-y-3"
        >
          <p className="text-xs font-mono text-primary uppercase tracking-widest">
            Struktur Biaya
          </p>
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-foreground">
            Transparan, dihitung otomatis saat konfirmasi
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Fee menggunakan basis points (1% = 100 bps). Total potongan ditampilkan sebelum PIN.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="lg:col-span-2 bg-card/60 backdrop-blur-md border border-border rounded-2xl overflow-hidden"
          >
            <div className="px-5 py-3 border-b border-border flex items-center gap-2">
              <Percent className="w-4 h-4 text-primary" />
              <span className="text-sm font-display font-semibold text-foreground">
                Tabel Fee per Sumber
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs font-mono uppercase tracking-wider text-muted-foreground bg-secondary/30">
                    <th className="text-left px-5 py-3">Sumber</th>
                    <th className="text-left px-5 py-3">Aplikasi</th>
                    <th className="text-right px-5 py-3">bps</th>
                    <th className="text-right px-5 py-3">%</th>
                    <th className="text-left px-5 py-3">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.source}
                      className="border-t border-border/50 hover:bg-secondary/20 transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-foreground">{r.source}</td>
                      <td className="px-5 py-3 text-muted-foreground">{r.app}</td>
                      <td className="px-5 py-3 text-right font-mono tabular-nums text-foreground">
                        {r.bps}
                      </td>
                      <td className="px-5 py-3 text-right font-mono tabular-nums text-foreground">
                        {(r.bps / 100).toFixed(2)}%
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">{r.note}</td>
                    </tr>
                  ))}
                  <tr className="bg-primary/5 border-t-2 border-primary/30">
                    <td className="px-5 py-3 font-semibold text-foreground" colSpan={2}>
                      Total komulatif (semua sumber aktif)
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-bold tabular-nums text-primary">
                      {totalBps}
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-bold tabular-nums text-primary">
                      {(totalBps / 100).toFixed(2)}%
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">Maks debit</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-card/60 backdrop-blur-md border border-border rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-display font-semibold text-foreground">
                Contoh Simulasi
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Nominal transfer <span className="text-foreground font-medium">Rp 100.000</span>:
            </p>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Nominal utama</dt>
                <dd className="font-mono tabular-nums text-foreground">
                  Rp {exampleAmount.toLocaleString("id-ID")}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Total fee</dt>
                <dd className="font-mono tabular-nums text-foreground">
                  Rp {exampleFee.toLocaleString("id-ID")}
                </dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2 mt-2">
                <dt className="font-medium text-foreground">Total debit payer</dt>
                <dd className="font-mono font-bold tabular-nums text-primary">
                  Rp {exampleTotal.toLocaleString("id-ID")}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Diterima penerima</dt>
                <dd className="font-mono tabular-nums text-foreground">
                  Rp {exampleAmount.toLocaleString("id-ID")}
                </dd>
              </div>
            </dl>
            <p className="text-[10px] text-muted-foreground italic mt-4 leading-relaxed">
              * Setiap sumber fee punya flag aktif/nonaktif di tabel fee_rules. Wallet
              menghitung ulang saat konfirmasi transfer menggunakan endpoint{" "}
              <code className="text-primary">GET /api/v1/fees/quote</code>.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}