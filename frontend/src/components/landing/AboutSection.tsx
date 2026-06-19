"use client";

import { motion } from "framer-motion";
import { BookOpen, Layers, Lock } from "lucide-react";

const pillars = [
  {
    icon: Layers,
    title: "Single Source of Truth",
    body:
      "CentralBank Core adalah satu-satunya pihak yang boleh menulis ledger final. Wallet hanya mengirim payment request, Core yang memvalidasi dan settle.",
  },
  {
    icon: Lock,
    title: "Idempotent & Atomic",
    body:
      "Setiap transaksi finansial membawa Idempotency-Key unik. Debit & kredit terjadi dalam satu database transaction, tidak mungkin double-submit atau saldo tidak seimbang.",
  },
  {
    icon: BookOpen,
    title: "Audit Append-Only",
    body:
      "Ledger tidak dapat dihapus atau diedit. Koreksi hanya melalui reversal atau refund transaction yang tercatat di audit log dengan reason code.",
  },
];

export default function AboutSection() {
  return (
    <section className="px-6 py-20">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="space-y-4"
        >
          <p className="text-xs font-mono text-primary uppercase tracking-widest">
            Tentang SmartBank
          </p>
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-foreground leading-tight">
            Prototipe akademis CBDC two-tier dengan prinsip bank sentral modern.
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            SmartBank adalah simulator Central Bank Digital Currency untuk tugas besar RPL 2.
            Mengadopsi arsitektur two-tier: Tier-1 CentralBank Core mengelola suplai uang,
            reserve, dan ledger. Tier-2 SmartBank Wallet menjadi antarmuka pengguna untuk transfer,
            QR payment, top-up, withdrawal, dan pinjaman UMKM.
          </p>
          <p className="text-xs text-muted-foreground italic">
            Bukan sistem finansial produksi. Tidak terhubung dengan BI, BCA, atau bank nyata.
          </p>
        </motion.div>

        <div className="space-y-4">
          {pillars.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card/60 backdrop-blur-md border border-border rounded-2xl p-5 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                  <p.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-display font-semibold text-foreground">
                    {p.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{p.body}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}