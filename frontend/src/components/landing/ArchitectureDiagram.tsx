"use client";

import { motion } from "framer-motion";
import { Building2, Landmark, ShieldCheck, Wallet } from "lucide-react";

const Tier1 = [
  "Issuance & Burn",
  "Reserve & Pool",
  "Settlement Atomic",
  "Double-entry Ledger",
  "Fee & Tax Engine",
  "Audit Append-only",
];

const Tier2 = [
  "Registrasi & Login",
  "PIN Transaksi",
  "KYC Ringan",
  "Transfer P2P",
  "QR & Invoice",
  "Top Up & Withdraw",
];

export default function ArchitectureDiagram() {
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
            Arsitektur Sistem
          </p>
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-foreground">
            Two-Tier CBDC:{" "}
            <span className="text-muted-foreground">Tier-1 & Tier-2</span>
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Pemisahan tegas antara otoritas moneter (Central Bank Core) sebagai single source of
            truth dengan provider/PJP (Wallet) sebagai antarmuka pengguna.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4 md:gap-6 items-stretch">
          {/* Tier 1 */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative bg-card/70 backdrop-blur-xl border border-primary/30 rounded-2xl p-6 shadow-xl shadow-primary/5 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-primary">
                    Tier 1 · Otoritas
                  </p>
                  <h3 className="text-lg font-display font-semibold text-foreground">
                    CentralBank Core
                  </h3>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Core moneter: satu-satunya yang boleh mint, burn, dan menulis ledger final.
              </p>
              <ul className="space-y-2">
                {Tier1.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-sm text-foreground/80"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Arrow / Bridge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="hidden md:flex flex-col items-center justify-center gap-3"
          >
            <div className="flex flex-col items-center text-center gap-2">
              <div className="p-3 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <p className="text-xs font-mono text-emerald-500 uppercase tracking-widest">
                API Gateway
              </p>
              <p className="text-xs text-muted-foreground max-w-[180px]">
                Semua settlement melalui payment request tervalidasi &amp; idempotent
              </p>
            </div>
            <div className="flex flex-col gap-1 my-2">
              <span className="text-[10px] font-mono text-muted-foreground">payment_req</span>
              <span className="h-px w-24 bg-gradient-to-r from-primary via-emerald-500 to-blue-500" />
              <span className="text-[10px] font-mono text-muted-foreground text-right">
                settle ack
              </span>
            </div>
          </motion.div>

          {/* Tier 2 */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="relative bg-card/70 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-6 shadow-xl shadow-blue-500/5 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-blue-500">
                    Tier 2 · Provider
                  </p>
                  <h3 className="text-lg font-display font-semibold text-foreground">
                    SmartBank Wallet
                  </h3>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Antarmuka pengguna: registrasi, UX, payment request ke Core. Tidak boleh mint/burn.
              </p>
              <ul className="space-y-2">
                {Tier2.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-sm text-foreground/80"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-xs text-muted-foreground mt-8 flex items-center justify-center gap-2"
        >
          <Building2 className="w-3 h-3" />
          Singleness of money · Programmable payments · Tanpa programmable money retail
        </motion.p>
      </div>
    </section>
  );
}