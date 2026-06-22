"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

/**
 * Enhanced glassmorphic 3D crypto coin — pure SVG + CSS 3D transforms.
 *
 * Mirip reference: koin glassmorphic dengan embossed symbol, reflective
 * holographic ring, edge bevel untuk thickness illusion, floating particles.
 *
 * Pakai framer-motion (sudah ada di deps) untuk tilt + float animations.
 */
export function CryptoCoin3D({
  size = 360,
  symbol = "₿",
  symbolLabel = "CBDC · IDR",
}: {
  size?: number;
  symbol?: string;
  symbolLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [22, -22]), { stiffness: 120, damping: 18 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-26, 26]), { stiffness: 120, damping: 18 });

  const onMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  // Auto-rotation breathing
  const [autoRotate, setAutoRotate] = useState(0);
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setAutoRotate((r) => r + dt * 8); // 8 deg/sec
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="relative [perspective:1400px] mx-auto"
      style={{ width: size, height: size }}
    >
      <motion.div
        style={{
          rotateX: rx,
          rotateY: useTransform(ry, (v) => v + autoRotate) as unknown as number,
        }}
        className="relative w-full h-full [transform-style:preserve-3d]"
      >
        {/* ---- COIN FACE (front) ---- */}
        <div
          className="absolute inset-0 rounded-full [backface-visibility:hidden] shadow-[0_40px_80px_-20px_rgba(37,99,235,0.55),inset_0_-25px_50px_rgba(0,0,0,0.22),inset_0_3px_4px_rgba(255,255,255,0.45)]"
          style={{
            background:
              "radial-gradient(circle at 35% 25%, #60a5fa 0%, #2563eb 35%, #1e40af 70%, #0c1e3f 100%)",
          }}
        >
          {/* Inner concentric rings (minting detail) */}
          <div className="absolute inset-3 rounded-full border-2 border-white/25" />
          <div className="absolute inset-6 rounded-full border border-white/15" />
          <div className="absolute inset-8 rounded-full border border-dashed border-white/10" />

          {/* Holographic iridescent overlay — animated conic */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full mix-blend-overlay opacity-50 pointer-events-none"
            style={{
              background:
                "conic-gradient(from 0deg, rgba(255,255,255,0.4) 0deg, transparent 90deg, rgba(34,211,238,0.6) 180deg, transparent 270deg, rgba(255,255,255,0.3) 360deg)",
            }}
          />

          {/* Top-left specular highlight */}
          <div className="absolute -top-10 -left-10 w-48 h-48 rounded-full bg-white/25 blur-3xl pointer-events-none" />
          {/* Bottom-right cyan glow */}
          <div className="absolute -bottom-12 -right-12 w-56 h-56 rounded-full bg-cyan-400/30 blur-3xl pointer-events-none" />

          {/* Embossed symbol with depth */}
          <div className="absolute inset-0 flex flex-col items-center justify-center [text-shadow:0_4px_12px_rgba(0,0,0,0.4),0_-1px_0_rgba(255,255,255,0.3)]">
            <div className="font-display font-bold text-white leading-none tracking-tighter" style={{ fontSize: size * 0.34 }}>
              {symbol}
            </div>
            <div className="text-white/85 font-mono uppercase tracking-[0.35em] mt-2" style={{ fontSize: size * 0.032 }}>
              {symbolLabel}
            </div>
          </div>

          {/* Edge bezel highlights */}
          <div className="absolute inset-0 rounded-full ring-1 ring-white/10 pointer-events-none" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent pointer-events-none" />
        </div>

        {/* ---- COIN EDGE (side bevel for thickness illusion) ---- */}
        <div
          className="absolute inset-0 rounded-full [transform:translateZ(-14px)]"
          style={{
            background: "linear-gradient(135deg, #1e3a8a 0%, #0c1e3f 100%)",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
          }}
          aria-hidden
        />
        {/* Mid-edge ridge */}
        <div
          className="absolute inset-0 rounded-full [transform:translateZ(-7px)] bg-gradient-to-b from-blue-700/60 via-blue-900/40 to-blue-900/70"
          aria-hidden
        />
      </motion.div>

      {/* ---- ORBITING PARTICLES (decorative) ---- */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 [transform-style:preserve-3d] pointer-events-none"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 size-4 rounded-full bg-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.95)]" />
      </motion.div>
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 [transform-style:preserve-3d] pointer-events-none"
      >
        <div className="absolute bottom-0 right-1/4 translate-y-3 size-3 rounded-full bg-blue-300 shadow-[0_0_18px_rgba(147,197,253,0.9)]" />
      </motion.div>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 [transform-style:preserve-3d] pointer-events-none"
      >
        <div className="absolute top-1/2 left-0 -translate-x-3 size-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.85)]" />
      </motion.div>
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 [transform-style:preserve-3d] pointer-events-none"
      >
        <div className="absolute top-1/4 right-0 translate-x-3 size-2.5 rounded-full bg-indigo-300 shadow-[0_0_14px_rgba(165,180,252,0.85)]" />
      </motion.div>

      {/* Floor reflection (subtle) */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-8 rounded-full bg-blue-500/15 blur-2xl pointer-events-none" />
    </div>
  );
}
