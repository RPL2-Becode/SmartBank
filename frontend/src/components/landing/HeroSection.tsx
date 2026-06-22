"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleDollarSign,
  ShieldCheck,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { MeshBackground } from "@/components/landing/MeshBackground";
import { CreditCard3D } from "@/components/landing/CreditCard3D";

/* -------------------------------------------------------------------------- */
/*  Magnetic CTA — pulls toward cursor, hover-only 3D, premium spring         */
/* -------------------------------------------------------------------------- */
function MagneticCTA({
  children,
  href,
  variant = "primary",
}: {
  children: React.ReactNode;
  href: string;
  variant?: "primary" | "secondary";
}) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 250, damping: 20 });
  const sy = useSpring(my, { stiffness: 250, damping: 20 });

  const isPrimary = variant === "primary";
  const baseClasses = isPrimary
    ? "bg-primary text-primary-foreground shadow-[0_10px_30px_-10px_rgba(37,99,235,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] hover:shadow-[0_15px_40px_-10px_rgba(37,99,235,0.7),inset_0_1px_0_rgba(255,255,255,0.2)]"
    : "bg-white dark:bg-slate-900/60 text-foreground border border-slate-300 dark:border-white/10 backdrop-blur-xl hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-900/80 shadow-[0_8px_24px_-12px_rgba(2,6,23,0.1)]";

  return (
    <motion.div
      onMouseMove={(e) => {
        const el = e.currentTarget as HTMLElement;
        const r = el.getBoundingClientRect();
        mx.set((e.clientX - r.left - r.width / 2) * 0.2);
        my.set((e.clientY - r.top - r.height / 2) * 0.2);
      }}
      onMouseLeave={() => {
        mx.set(0);
        my.set(0);
      }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Link href={href}>
        <motion.div
          style={{ x: sx, y: sy }}
          className={`relative overflow-hidden inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 ${baseClasses}`}
        >
          <span className="relative z-10 flex items-center gap-2">{children}</span>
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </motion.div>
      </Link>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Live notification badge — "Live Status" archetype                         */
/* -------------------------------------------------------------------------- */
function LiveNotification({ show, message }: { show: boolean; message: string }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 350, damping: 22 }}
          className="absolute -top-3 -right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-mono uppercase tracking-widest font-bold shadow-[0_4px_12px_rgba(16,185,129,0.5)]"
        >
          <span className="relative flex size-1.5">
            <span className="absolute inset-0 rounded-full bg-white animate-ping opacity-75" />
            <span className="relative inline-flex size-1.5 rounded-full bg-white" />
          </span>
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* -------------------------------------------------------------------------- */
/*  Kinetic Marquee — infinite scroll text band                               */
/* -------------------------------------------------------------------------- */
const MARQUEE_ITEMS = [
  "Two-tier architecture",
  "Idempotent ledger",
  "Append-only audit",
  "Real-time settlement",
  "KYC masked",
  "AES-256 at rest",
  "BCrypt hashed PIN",
  "Role-based access",
];

function KineticMarquee() {
  // Duplicate items for seamless loop
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];

  return (
    <div className="relative overflow-hidden border-t border-border/40 bg-white/40 dark:bg-slate-900/30 backdrop-blur-sm">
      {/* Fade masks on edges */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="flex gap-8 py-3 whitespace-nowrap"
      >
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 shrink-0">
            <Sparkles className="size-3 text-primary" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              {item}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Hero Section — premium asymmetric with stagger orchestration                */
/* -------------------------------------------------------------------------- */

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function HeroSection() {
  const [mounted, setMounted] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  useEffect(() => setMounted(true), []);

  // Show live notification badge after 2s (3s display, then fades)
  useEffect(() => {
    const showTimer = setTimeout(() => setShowNotification(true), 2200);
    const hideTimer = setTimeout(() => setShowNotification(false), 5800);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <section className="relative min-h-[100dvh] pt-32 pb-0 overflow-hidden flex flex-col">
      <MeshBackground />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-7xl mx-auto w-full px-6 grid lg:grid-cols-[1.15fr_0.85fr] gap-12 lg:gap-16 items-center relative z-10 flex-1"
      >
        {/* ============== LEFT: Content ============== */}
        <motion.div variants={containerVariants} className="space-y-7">

          {/* Status pill — with live notification badge overlay */}
          <motion.div variants={itemVariants} className="relative inline-flex">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/5 backdrop-blur-md text-primary text-xs font-mono">
              <span className="relative flex size-2">
                <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              <span className="font-semibold tracking-widest">SISTEM AKTIF</span>
              <span className="text-muted-foreground/60">·</span>
              <span className="text-muted-foreground">v1.0.0</span>
              <span className="text-muted-foreground/60">·</span>
              <span className="text-foreground/80">Tier-2 CBDC</span>
            </div>
            <LiveNotification show={showNotification} message="API OK" />
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-6xl lg:text-7xl font-display font-semibold tracking-tighter text-foreground leading-[1.02]"
          >
            Infrastruktur{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 dark:from-blue-400 dark:via-blue-500 dark:to-cyan-400 bg-clip-text text-transparent">
                CBDC
              </span>
              {/* Animated underline */}
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.9, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-blue-500 via-cyan-500 to-transparent origin-left"
              />
            </span>{" "}
            <br />
            <span className="text-foreground/85">Generasi Berikutnya.</span>
          </motion.h1>

          {/* Supporting copy — max-w-[55ch], leading-relaxed */}
          <motion.p
            variants={itemVariants}
            className="text-lg text-muted-foreground max-w-[55ch] leading-relaxed"
          >
            Ekosistem <span className="font-semibold text-foreground">two-tier Central Bank Digital Currency</span>{" "}
            yang aman, auditable, dan idempotent. Transfer P2P, pinjaman UMKM,
            settlement QR, dan KYC terpadu dalam satu platform terbuka untuk tugas
            akademik RPL 2.
          </motion.p>

          {/* CTA row — magnetic */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2"
          >
            <MagneticCTA href="/register" variant="primary">
              Daftar Sekarang
              <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </MagneticCTA>
            <MagneticCTA href="/login" variant="secondary">
              <ShieldCheck className="w-4 h-4 text-primary" strokeWidth={2.5} />
              Masuk Akun
            </MagneticCTA>
            <MagneticCTA href="/guide" variant="secondary">
              <BookOpen className="w-4 h-4" strokeWidth={2.5} />
              Baca Panduan
            </MagneticCTA>
          </motion.div>

          {/* Bottom meta line */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-muted-foreground pt-4 font-mono"
          >
            {["Idempotent ledger", "Append-only audit", "Standar akademik"].map((item, i) => (
              <span key={item} className="flex items-center gap-1.5">
                {i > 0 && <span className="size-1 rounded-full bg-border" />}
                <Sparkles className="size-3 text-primary" />
                {item}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* ============== RIGHT: 3 floating cards ABOVE + Debit Card BELOW ============== */}
        <div className="relative [perspective:1500px] flex flex-col gap-5">

          {/* Stack of 3 floating info cards ABOVE the debit card */}
          <div className="space-y-2.5 relative z-10">
            {/* Saldo Aktif */}
            <motion.div
              initial={{ opacity: 0, y: 16, rotateX: -8 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/70 backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(2,6,23,0.15),inset_0_1px_0_rgba(255,255,255,0.5)] p-4"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 dark:via-white/20 to-transparent rounded-t-2xl pointer-events-none" />
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                  <Wallet className="w-4 h-4" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    Saldo Aktif
                  </p>
                  <p className="text-sm font-display font-semibold tabular-nums">
                    Rp 50.000,00
                  </p>
                </div>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-0.5 shrink-0">
                  <span className="size-1 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>
            </motion.div>

            {/* Transfer Berhasil */}
            <motion.div
              initial={{ opacity: 0, y: 16, rotateX: -8 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/70 backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(2,6,23,0.15),inset_0_1px_0_rgba(255,255,255,0.5)] p-4"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 dark:via-white/20 to-transparent rounded-t-2xl pointer-events-none" />
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                  <Zap className="w-4 h-4" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    Transfer Berhasil
                  </p>
                  <p className="text-sm font-display font-semibold truncate">
                    +Rp 100.000 · IDEMP-9F2A
                  </p>
                </div>
                <CheckCircle2
                  className="size-3.5 text-emerald-500 shrink-0"
                  strokeWidth={2.5}
                />
              </div>
            </motion.div>

            {/* Supply Invariant */}
            <motion.div
              initial={{ opacity: 0, y: 16, rotateX: -8 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ delay: 0.6, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/70 backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(2,6,23,0.15),inset_0_1px_0_rgba(255,255,255,0.5)] p-4"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 dark:via-white/20 to-transparent rounded-t-2xl pointer-events-none" />
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30">
                  <CircleDollarSign className="w-4 h-4" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    Supply Invariant
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-sm font-display font-bold text-emerald-600 dark:text-emerald-400">
                      VALID
                    </p>
                  </div>
                </div>
                <p className="text-[10px] font-mono text-muted-foreground tabular-nums shrink-0">
                  Rp 1,000,000,000
                </p>
              </div>
            </motion.div>
          </div>

          {/* Main debit card — hover-only 3D tilt (no auto-rotate) */}
          <motion.div
            initial={{ opacity: 0, y: 30, rotateX: 15 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 1.0, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 mx-auto"
          >
            <CreditCard3D width={340} variant="blue" holderName="A. WIJAYA K." last4="8472" />
          </motion.div>
        </div>
      </motion.div>

      {/* Kinetic marquee — bottom band, scrolls infinitely */}
      <KineticMarquee />
    </section>
  );
}
