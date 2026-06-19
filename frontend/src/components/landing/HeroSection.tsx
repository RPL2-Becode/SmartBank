"use client";

import { motion } from "framer-motion";
import { ArrowRight, BookOpen, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative pt-20 pb-24 px-6 overflow-hidden">
      {/* Background glow layers */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[520px] h-[520px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[420px] h-[420px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        className="max-w-5xl mx-auto text-center space-y-8 relative z-10"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-mono"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Sistem Aktif · v1.0.0 · Tier-2 CBDC
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-5xl md:text-7xl font-display font-semibold tracking-tight text-foreground leading-[1.05]"
        >
          Infrastruktur{" "}
          <span className="bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
            CBDC
          </span>{" "}
          <br />
          Generasi Berikutnya
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-muted-foreground max-w-2xl mx-auto font-sans"
        >
          Ekosistem Central Bank Digital Currency two-tier yang aman, auditable, dan idempotent.
          Transfer P2P, pinjaman UMKM, settlement QR, dan KYC terpadu dalam satu platform terbuka
          untuk tugas akademik RPL 2.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
        >
          <Link href="/register">
            <button className="group flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20">
              Daftar Sekarang
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </Link>
          <Link href="/login">
            <button className="flex items-center gap-2 px-6 py-3 rounded-lg bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/80 border border-border transition-all hover:scale-[1.02] active:scale-[0.98]">
              <ShieldCheck className="w-4 h-4" />
              Masuk Akun
            </button>
          </Link>
          <Link href="/guide">
            <button className="flex items-center gap-2 px-6 py-3 rounded-lg text-foreground font-semibold hover:bg-secondary/40 transition-all">
              <BookOpen className="w-4 h-4" />
              Baca Panduan
            </button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-4"
        >
          <Sparkles className="w-3 h-3 text-primary" />
          Two-tier arsitektur · Idempotent ledger · Append-only audit · Standar akademik
        </motion.div>
      </motion.div>
    </section>
  );
}