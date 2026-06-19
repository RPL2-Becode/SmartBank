"use client";

import { motion } from "framer-motion";
import {
  ArrowRightLeft,
  Banknote,
  HandCoins,
  History,
  QrCode,
  Wallet,
} from "lucide-react";

const services = [
  {
    icon: ArrowRightLeft,
    title: "Transfer P2P",
    body: "Kirim dana antar wallet dengan fee transparan. Validasi saldo via Core sebelum settlement.",
    tone: "primary",
  },
  {
    icon: QrCode,
    title: "Bayar QR / Invoice",
    body: "Scan QR merchant atau input invoice ID. Konfirmasi fee & pajak sebelum konfirmasi PIN.",
    tone: "emerald",
  },
  {
    icon: Wallet,
    title: "Top Up Saldo",
    body: "Simulasi distribusi dari Reserve atau Provider Settlement sesuai aturan tugas.",
    tone: "blue",
  },
  {
    icon: Banknote,
    title: "Tarik Tunai",
    body: "Simulasi cash-out ke account system. Tercatat sebagai withdrawal di ledger Core.",
    tone: "purple",
  },
  {
    icon: HandCoins,
    title: "Pinjaman UMKM",
    body: "Limit 100.000 / user, bunga 10%. Teller screening ≤50k, Manager final-approve.",
    tone: "orange",
  },
  {
    icon: History,
    title: "Mutasi Rekening",
    body: "Riwayat transaksi settled, pending, failed, reversed, refunded. Filter tanggal & status.",
    tone: "rose",
  },
];

const toneClass = {
  primary: "bg-primary/10 text-primary border-primary/20",
  emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  purple: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  orange: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  rose: "bg-rose-500/10 text-rose-500 border-rose-500/20",
} as const;

export default function ServicesGrid() {
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
            Layanan Nasabah
          </p>
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-foreground">
            Fitur lengkap dalam satu wallet
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Enam fitur utama yang bisa langsung dipakai nasabah retail setelah registrasi dan KYC.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              whileHover={{ y: -4 }}
              className="group bg-card/60 backdrop-blur-md border border-border rounded-2xl p-6 hover:border-primary/40 transition-all"
            >
              <div
                className={`inline-flex p-3 rounded-xl border mb-4 ${toneClass[s.tone as keyof typeof toneClass]}`}
              >
                <s.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-display font-semibold text-foreground mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}