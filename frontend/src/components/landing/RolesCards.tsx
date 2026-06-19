"use client";

import { motion } from "framer-motion";
import { Building2, ShieldCheck, UserCog, Users } from "lucide-react";

const roles = [
  {
    icon: Users,
    role: "Nasabah (Retail / Merchant)",
    tone: "primary" as const,
    rights: [
      "Cek saldo & mutasi sendiri",
      "Transfer P2P & bayar QR/invoice",
      "Ajukan & cicil pinjaman UMKM",
      "Top up & tarik tunai simulatif",
    ],
    limit: "Tidak boleh lihat data nasabah lain atau ubah status akun sendiri.",
  },
  {
    icon: UserCog,
    role: "Teller (Layanan Cabang)",
    tone: "emerald" as const,
    rights: [
      "Registrasi nasabah baru",
      "Verifikasi KYC (BASIC → VERIFIED)",
      "Top up / withdrawal nasabah",
      "Rekomendasi pinjaman ≤ 50k",
    ],
    limit: "Tidak boleh approve pinjaman atau freeze akun sepihak.",
  },
  {
    icon: ShieldCheck,
    role: "Manager (Pimpinan Cabang)",
    tone: "blue" as const,
    rights: [
      "Seluruh hak akses Teller",
      "Approve / reject pinjaman",
      "Suspend akun nasabah sementara",
      "Set limit harian khusus merchant",
    ],
    limit: "Tidak boleh mint/burn uang atau ubah tarif pajak global.",
  },
  {
    icon: Building2,
    role: "Admin Central Bank",
    tone: "purple" as const,
    rights: [
      "Issuance & Burn CBDC",
      "Audit global ledger",
      "Reversal transaksi ACID",
      "Atur tarif fee & pajak",
    ],
    limit: "Akses tertinggi, hanya untuk admin infrastruktur bank sentral.",
  },
];

const toneRing = {
  primary: "border-primary/30 bg-primary/5",
  emerald: "border-emerald-500/30 bg-emerald-500/5",
  blue: "border-blue-500/30 bg-blue-500/5",
  purple: "border-purple-500/30 bg-purple-500/5",
} as const;

const toneIcon = {
  primary: "bg-primary/10 text-primary",
  emerald: "bg-emerald-500/10 text-emerald-500",
  blue: "bg-blue-500/10 text-blue-500",
  purple: "bg-purple-500/10 text-purple-500",
} as const;

export default function RolesCards() {
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
            Peran & Otoritas
          </p>
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-foreground">
            Empat peran, satu matriks akses
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Pemisahan wewenang tegas: User tidak bisa Introspeksi sistem, Admin tidak bypass audit.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {roles.map((r, i) => (
            <motion.div
              key={r.role}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className={`relative border-2 ${toneRing[r.tone]} rounded-2xl p-5 backdrop-blur-md overflow-hidden`}
            >
              <div className={`inline-flex p-2 rounded-lg mb-3 ${toneIcon[r.tone]}`}>
                <r.icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-display font-semibold text-foreground mb-3 leading-tight">
                {r.role}
              </h3>
              <ul className="space-y-1.5 mb-4">
                {r.rights.map((rw) => (
                  <li key={rw} className="flex items-start gap-2 text-xs text-foreground/80">
                    <span className="w-1 h-1 rounded-full bg-foreground/40 mt-1.5 shrink-0" />
                    {rw}
                  </li>
                ))}
              </ul>
              <p className="text-[10px] text-muted-foreground italic border-t border-border/50 pt-3 leading-relaxed">
                {r.limit}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}