import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Wifi } from "lucide-react";

type AtmCard3DProps = {
  brand?: string;
  holderName?: string;
  cardNumber?: string;
  expiry?: string;
  variant?: "primary" | "secondary";
  className?: string;
  style?: CSSProperties;
  /**
   * If true, tilt is driven by global window mouse position (parallax-like).
   * If false (default), tilt only triggers on local hover.
   */
  globalParallax?: boolean;
};

/**
 * Interactive 3D ATM card with mouse-tracking tilt, holographic shine,
 * floating animation, embossed chip, and contactless icon.
 *
 * - CSS perspective + transform-style: preserve-3d
 * - rAF-batched mousemove for smooth 60fps
 * - Reduced-motion friendly: disables tilt if prefers-reduced-motion
 */
export function AtmCard3D({
  brand = "SmartBank",
  holderName = "MITRA UMKM",
  cardNumber = "5421  •••• ••••  9824",
  expiry = "12/29",
  variant = "primary",
  className = "",
  style,
  globalParallax = false,
}: AtmCard3DProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [isHover, setIsHover] = useState(false);

  useEffect(() => {
    const stage = stageRef.current;
    const card = cardRef.current;
    if (!stage || !card) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    let pendingX = 0;
    let pendingY = 0;
    let active = false;

    const apply = () => {
      rafRef.current = null;
      if (!card) return;
      const rotY = pendingX * 18; // -18..18 deg
      const rotX = pendingY * -14; // -14..14 deg (invert so up = tilt back)
      card.style.setProperty("--rx", `${rotX}deg`);
      card.style.setProperty("--ry", `${rotY}deg`);
      // Light position for holographic shine
      const lx = ((pendingX + 1) / 2) * 100;
      const ly = ((pendingY + 1) / 2) * 100;
      card.style.setProperty("--lx", `${lx}%`);
      card.style.setProperty("--ly", `${ly}%`);
    };

    const queue = () => {
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(apply);
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      // Normalize to [-1, 1]; clamp by stage size for local mode
      if (globalParallax) {
        // parallax based on viewport center (gentler factor)
        const vx = (e.clientX - window.innerWidth / 2) / window.innerWidth;
        const vy = (e.clientY - window.innerHeight / 2) / window.innerHeight;
        pendingX = Math.max(-1, Math.min(1, vx * 1.5));
        pendingY = Math.max(-1, Math.min(1, vy * 1.5));
      } else {
        pendingX = Math.max(-1, Math.min(1, (e.clientX - cx) / (rect.width / 2)));
        pendingY = Math.max(-1, Math.min(1, (e.clientY - cy) / (rect.height / 2)));
      }
      active = true;
      queue();
    };

    const reset = () => {
      pendingX = 0;
      pendingY = 0;
      active = false;
      queue();
    };

    if (globalParallax) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
    } else {
      stage.addEventListener("pointermove", onPointerMove, { passive: true });
      stage.addEventListener("pointerleave", reset);
    }

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      if (globalParallax) {
        window.removeEventListener("pointermove", onPointerMove);
      } else {
        stage.removeEventListener("pointermove", onPointerMove);
        stage.removeEventListener("pointerleave", reset);
      }
      void active;
    };
  }, [globalParallax]);

  return (
    <div
      ref={stageRef}
      className={`atm-card-stage atm-card-stage-${variant} ${className}`}
      style={style}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      aria-label={`Kartu ${brand}`}
    >
      <div
        ref={cardRef}
        className={`atm-card-3d ${isHover ? "is-hover" : ""}`}
        role="img"
      >
        {/* Holographic gradient layers */}
        <div className="atm-card-bg" aria-hidden="true" />
        <div className="atm-card-shine" aria-hidden="true" />
        <div className="atm-card-grid" aria-hidden="true" />

        {/* Top row: brand + contactless */}
        <div className="atm-card-top">
          <span className="atm-card-brand">
            <span className="atm-card-brand-mark">S</span>
            <span className="atm-card-brand-text">{brand}</span>
          </span>
          <Wifi
            className="atm-card-contactless"
            size={22}
            aria-hidden="true"
          />
        </div>

        {/* Chip (SVG embossed) */}
        <div className="atm-card-chip" aria-hidden="true">
          <svg viewBox="0 0 56 44" width="56" height="44">
            <defs>
              <linearGradient id="chipGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FCD34D" />
                <stop offset="50%" stopColor="#D97706" />
                <stop offset="100%" stopColor="#92400E" />
              </linearGradient>
            </defs>
            <rect x="1" y="1" width="54" height="42" rx="6" fill="url(#chipGrad)" />
            <g stroke="rgba(0,0,0,0.35)" strokeWidth="1" fill="none">
              <path d="M10 14 H22 M34 14 H46 M10 22 H46 M10 30 H22 M34 30 H46" />
              <rect x="22" y="14" width="12" height="16" rx="2" fill="rgba(255,255,255,0.18)" />
            </g>
          </svg>
        </div>

        {/* Card number */}
        <div className="atm-card-number">{cardNumber}</div>

        {/* Footer: holder + expiry + network mark */}
        <div className="atm-card-footer">
          <div>
            <span className="atm-card-label">Card Holder</span>
            <strong className="atm-card-value">{holderName}</strong>
          </div>
          <div>
            <span className="atm-card-label">Expires</span>
            <strong className="atm-card-value">{expiry}</strong>
          </div>
          <div className="atm-card-network" aria-hidden="true">
            <span className="atm-card-network-a" />
            <span className="atm-card-network-b" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AtmCard3D;
