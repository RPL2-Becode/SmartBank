"use client";

import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Code2, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function CTAFooter() {
  return (
    <footer className="px-6 py-16 border-t border-border mt-10">
      <div className="max-w-6xl mx-auto space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-primary/10 via-card to-emerald-500/5 border border-primary/20 rounded-3xl p-8 md:p-12 text-center space-y-5 relative overflow-hidden"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="relative z-10">
            <ShieldCheck className="w-10 h-10 text-primary mx-auto mb-3" />
            <h2 className="text-2xl md:text-3xl font-display font-semibold text-foreground">
              Siap mencoba SmartBank?
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Registrasi gratis, KYC ringan, langsung dapat wallet address &amp; bisa transfer ke
              pengguna lain di ekosistem simulator.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link href="/register">
                <button className="group flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                  Daftar Sekarang
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </Link>
              <Link href="/guide">
                <button className="px-6 py-3 rounded-lg bg-card border border-border text-foreground font-semibold hover:bg-secondary/50 transition-all">
                  Baca Panduan
                </button>
              </Link>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="bg-destructive/5 border border-destructive/20 rounded-2xl p-5 flex items-start gap-4"
        >
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground leading-relaxed">
            <p className="font-semibold text-foreground mb-1">Disclaimer Akademis</p>
            SmartBank adalah prototipe akademis untuk tugas besar RPL 2. Tidak terhubung dengan
            Bank Indonesia, BCA, bank komersial nyata, atau payment network nyata. Semua saldo,
            transaksi, dan identitas adalah simulasi. Jangan gunakan untuk aktivitas finansial
            produksi.
          </div>
        </motion.div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-border/50">
          <div className="flex items-center gap-3">
            <span className="text-sm font-display font-semibold text-foreground">SmartBank</span>
            <span className="text-xs text-muted-foreground">
              · Two-tier CBDC Prototype · RPL 2
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/guide" className="hover:text-foreground transition-colors">
              Panduan
            </Link>
            <Link href="/login" className="hover:text-foreground transition-colors">
              Masuk
            </Link>
            <a
              href="https://github.com/RPL2-Becode/SmartBank"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Code2 className="w-3 h-3" /> Source
            </a>
            <a
              href="mailto:team@smartbank.local"
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Mail className="w-3 h-3" /> Kontak
            </a>
          </div>
          <p className="text-[10px] text-muted-foreground">
            © {new Date().getFullYear()} SmartBank Team · All data is simulated
          </p>
        </div>
      </div>
    </footer>
  );
}