"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { Wifi } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  CreditCard3D — shared premium CBDC card with magnetic tilt                 */
/*  Used by HeroSection (landing) and AuthBrandPanel (login/register)         */
/*                                                                             */
/*  Pure CSS 3D (perspective + rotateX/Y) + Framer Motion spring physics.     */
/*  Renders a Visa-style debit card with chip, NFC wave, embossed number,    */
/*  valid thru, holder name, and SmartBank brand mark.                        */
/* -------------------------------------------------------------------------- */

export type CreditCard3DProps = {
  /** Width in px (default 360) */
  width?: number;
  /** Variant: gradient color scheme */
  variant?: "blue" | "indigo" | "midnight";
  /** Show "VALID THRU" date */
  validThru?: string;
  /** Cardholder name (defaults to "A. WIJAYA K.") */
  holderName?: string;
  /** Last 4 digits shown (defaults to "8472") */
  last4?: string;
  /** Disable tilt interaction (useful for static showcase cards) */
  staticTilt?: boolean;
};

export function CreditCard3D({
  width = 360,
  variant = "blue",
  validThru = "12/28",
  holderName = "A. WIJAYA K.",
  last4 = "8472",
  staticTilt = false,
}: CreditCard3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [16, -16]), { stiffness: 140, damping: 18 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-18, 18]), { stiffness: 140, damping: 18 });

  const onMove = (e: React.MouseEvent) => {
    if (staticTilt) return;
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  const aspect = 1.586; // Visa debit ratio
  const height = Math.round(width / aspect);

  // Variant gradients
  const gradients: Record<string, { from: string; via: string; to: string; glow: string }> = {
    blue: {
      from: "from-blue-600",
      via: "via-blue-500",
      to: "to-cyan-600",
      glow: "shadow-blue-500/40",
    },
    indigo: {
      from: "from-indigo-700",
      via: "via-indigo-600",
      to: "to-blue-700",
      glow: "shadow-indigo-500/40",
    },
    midnight: {
      from: "from-slate-900",
      via: "via-slate-800",
      to: "to-blue-900",
      glow: "shadow-slate-700/50",
    },
  };
  const g = gradients[variant];

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="relative [perspective:1400px]"
      style={{ width, height }}
    >
      <motion.div
        style={{ rotateX: staticTilt ? 6 : rx, rotateY: staticTilt ? -8 : ry }}
        className="relative w-full h-full [transform-style:preserve-3d]"
      >
        {/* Back face — thickness illusion */}
        <div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${g.from} ${g.via} ${g.to} [transform:translateZ(-10px)]`}
          aria-hidden
        />

        {/* Front face */}
        <div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${g.from} ${g.via} ${g.to} dark:from-blue-700 dark:via-blue-800 dark:to-indigo-900 ${g.glow} shadow-[0_30px_80px_-15px_rgba(37,99,235,0.45),inset_0_-15px_30px_rgba(0,0,0,0.18),inset_0_2px_3px_rgba(255,255,255,0.35)] [backface-visibility:hidden] overflow-hidden`}
        >
          {/* Inner refraction top line */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

          {/* Holographic foil — diagonal sheen */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.18),transparent_50%)] pointer-events-none" />

          {/* Top row — brand + NFC wave */}
          <div className="absolute top-5 inset-x-5 flex items-start justify-between z-10">
            <p className="font-display text-base font-bold text-white tracking-tight">SmartBank</p>
            <div className="flex items-center gap-1.5">
              {/* NFC wave */}
              <Wifi className="size-4 text-white/80 rotate-90" strokeWidth={2.5} />
            </div>
          </div>

          {/* EMV Chip */}
          <div className="absolute top-[52px] left-5 z-10">
            <div className="w-11 h-8 rounded-md bg-gradient-to-br from-amber-300/90 to-amber-500/90 border border-amber-700/30 shadow-inner relative overflow-hidden">
              <div className="absolute inset-1 grid grid-cols-3 gap-px">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="bg-amber-700/35 rounded-sm" />
                ))}
              </div>
              {/* Chip highlight */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent" />
            </div>
          </div>

          {/* Contactless symbol (top-right small) */}
          <div className="absolute top-[55px] right-5 z-10 flex items-center gap-1">
            <div className="size-3 border-2 border-white/70 rounded-full" />
            <div className="size-3 border-2 border-white/50 rounded-full -ml-2" />
            <div className="size-3 border-2 border-white/30 rounded-full -ml-2" />
          </div>

          {/* Card number */}
          <div className="absolute inset-x-5 bottom-[58px] z-10">
            <div className="font-mono text-base sm:text-lg font-medium text-white tracking-[0.22em] flex items-center justify-between">
              <span className="opacity-50">****</span>
              <span className="opacity-50">****</span>
              <span className="opacity-50">****</span>
              <span>{last4}</span>
            </div>
          </div>

          {/* Bottom row — holder + valid + visa mark */}
          <div className="absolute inset-x-5 bottom-4 z-10 flex items-end justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[7px] text-white/60 uppercase tracking-[0.2em] font-mono">
                Pemegang
              </p>
              <p className="font-mono text-[10px] text-white mt-0.5 truncate">
                {holderName}
              </p>
            </div>
            <div className="text-right mr-3">
              <p className="text-[7px] text-white/60 uppercase tracking-[0.2em] font-mono">
                Valid
              </p>
              <p className="font-mono text-[10px] text-white mt-0.5">{validThru}</p>
            </div>
            {/* VISA-style network mark */}
            <div className="font-display text-lg font-bold italic text-white/95 tracking-tight">
              VISA
            </div>
          </div>

          {/* Decorative shape — bottom-left abstract circles */}
          <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-white/8 blur-2xl pointer-events-none" />
          <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-cyan-300/15 blur-2xl pointer-events-none" />
        </div>
      </motion.div>
    </div>
  );
}
