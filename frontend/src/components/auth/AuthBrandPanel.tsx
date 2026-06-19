"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Building2, ShieldCheck } from "lucide-react";

export default function AuthBrandPanel() {
  // Parallax tilt -- useMotionValue di luar React render cycle, sesuai skill rule
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-12, 12]);
  const springX = useSpring(rotateX, { stiffness: 100, damping: 20 });
  const springY = useSpring(rotateY, { stiffness: 100, damping: 20 });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - r.left - r.width / 2);
    y.set(e.clientY - r.top - r.height / 2);
  };
  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div className="relative h-full min-h-dvh bg-gradient-to-br from-primary/10 via-card to-emerald-500/5 border-r border-border overflow-hidden flex flex-col p-6 lg:p-8">
      {/* Ambient blobs */}
      <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[260px] h-[260px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Brand row */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 flex items-center gap-2 shrink-0"
      >
        <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
          <Building2 className="w-4 h-4" />
        </div>
        <span className="font-display font-semibold text-base text-foreground">SmartBank</span>
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground border border-border rounded px-1.5 py-0.5">
          CBDC
        </span>
      </motion.div>

      {/* Tagline (compact) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative z-10 space-y-1.5 mt-6 shrink-0"
      >
        <p className="text-[10px] font-mono text-primary uppercase tracking-widest">
          Two-Tier Architecture
        </p>
        <h2 className="text-xl lg:text-2xl font-display font-semibold text-foreground leading-[1.15]">
          Akses terminal ke jaringan uang digital.
        </h2>
      </motion.div>

      {/* 3D Card mockup (smaller, fits narrow column) */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative z-10 mt-5"
        style={{ perspective: "1000px" }}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
      >
        <motion.div
          style={{
            rotateX: springX,
            rotateY: springY,
            transformStyle: "preserve-3d",
          }}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          className="relative aspect-[1.6/1] w-full max-w-[260px] rounded-xl bg-gradient-to-br from-primary via-primary/85 to-emerald-600 p-4 shadow-xl shadow-primary/30 overflow-hidden"
        >
          {/* Inner refraction */}
          <div className="absolute inset-0 border border-white/15 rounded-xl pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none" />

          {/* Chip */}
          <div className="relative z-10 w-9 h-7 rounded-md bg-gradient-to-br from-amber-300/80 to-amber-500/80 border border-amber-700/30 mb-3 shadow-inner">
            <div className="absolute inset-1 grid grid-cols-3 gap-px">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="bg-amber-700/30 rounded-sm" />
              ))}
            </div>
          </div>

          {/* CBDC mark top-right */}
          <div className="absolute top-3 right-4 z-10 text-right">
            <p className="font-display text-sm font-semibold text-white tracking-tight">CBDC</p>
            <p className="text-[7px] text-white/60 uppercase tracking-widest font-mono">Tier-2</p>
          </div>

          {/* Card number */}
          <div className="relative z-10 font-mono text-xs text-white tracking-[0.16em] mb-3 mt-1">
            <span className="opacity-50">****</span>{" "}
            <span className="opacity-50">****</span>{" "}
            <span className="opacity-50">****</span>{" "}
            <span>8472</span>
          </div>

          {/* Bottom row */}
          <div className="relative z-10 flex items-end justify-between">
            <div>
              <p className="text-[7px] text-white/55 uppercase tracking-widest font-mono">
                Pemegang
              </p>
              <p className="font-mono text-[10px] text-white mt-0.5">A. WIJAYA K.</p>
            </div>
            <div className="text-right">
              <p className="text-[7px] text-white/55 uppercase tracking-widest font-mono">
                Berlaku
              </p>
              <p className="font-mono text-[10px] text-white mt-0.5">12/28</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Spacer pushes footer to bottom */}
      <div className="flex-1 min-h-3" />

      {/* Trust line + status footer (compact) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="relative z-10 shrink-0 space-y-2.5 pt-4 border-t border-border/50"
      >
        <div className="flex items-center gap-1.5 text-[11px] text-foreground/80">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          Idempotent · Append-only audit · KYC masked
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              Sistem Aktif · v1.0.0
            </span>
          </div>
          <p className="text-[9px] text-muted-foreground">RPL 2</p>
        </div>
      </motion.div>
    </div>
  );
}