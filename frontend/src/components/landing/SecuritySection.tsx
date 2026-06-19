"use client";

import { motion } from "framer-motion";
import { Fingerprint, KeyRound, Lock, ScanSearch, ShieldCheck, Users } from "lucide-react";

const items = [
  {
    icon: KeyRound,
    title: "Password & PIN terpisah",
    body: "Password untuk login. PIN 6-digit untuk transaksi finansial. Keduanya di-hash (bcrypt) dan tidak pernah disimpan plain.",
  },
  {
    icon: Fingerprint,
    title: "Idempotency-Key",
    body: "Setiap POST/PUT finansial wajib menyertakan Idempotency-Key. Submit dua kali = satu transaksi, tidak mungkin double-debit.",
  },
  {
    icon: Lock,
    title: "JWT + Service Token",
    body: "Autentikasi user via JWT. Service-to-service via service token signed. Rate limit per IP & per user.",
  },
  {
    icon: ScanSearch,
    title: "Audit Log Append-Only",
    body: "Setiap aksi admin freeze, reversal, atau adjustment tercatat dengan reason code, actor_id, request_id.",
  },
  {
    icon: Users,
    title: "Role-Based Access Control",
    body: "4 peran: User, Teller, Manager, Central Bank Admin. Masing-masing punya scope endpoint sesuai matriks otorisasi.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy Masking",
    body: "Nama penerima di-masking sebelum transfer. Data KYC tidak ditampilkan ke merchant. Audit regulator hanya untuk Admin.",
  },
];

export default function SecuritySection() {
  return (
    <section className="px-6 py-20">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 space-y-3"
        >
          <p className="text-xs font-mono text-primary uppercase tracking-widest">Keamanan</p>
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-foreground">
            Standar keamanan finansial, bukan cuma kosmetik
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Enam lapisan proteksi yang wajib diimplementasi untuk uang digital.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {items.map((it, i) => (
            <motion.div
              key={it.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              className="bg-card/60 backdrop-blur-md border border-border rounded-2xl p-6"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                  <it.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-display font-semibold text-foreground">
                    {it.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{it.body}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}