import { useEffect, useRef, useState } from "react";

/**
 * Global scanner: observes every `.reveal-on-scroll` element inside the
 * document (or a provided root) and toggles `is-revealed` when in view.
 * Re-runs when `deps` change (e.g., after rendering a different page).
 *
 * Use inside a top-level page component:
 *   useGlobalReveal();
 */
export function useGlobalReveal(deps: unknown[] = []) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const elements = Array.from(
      document.querySelectorAll<HTMLElement>(".reveal-on-scroll:not(.is-revealed)"),
    );
    if (elements.length === 0) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || typeof IntersectionObserver === "undefined") {
      elements.forEach((el) => el.classList.add("is-revealed"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -60px 0px" },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

type CountUpProps = {
  to: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  /**
   * If true, format the integer part with id-ID locale grouping (e.g., 12.500).
   * Default: true.
   */
  format?: boolean;
};

/**
 * Animated number counter that starts when scrolled into view.
 * Uses requestAnimationFrame with ease-out cubic.
 */
export function CountUp({
  to,
  duration = 1600,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
  format = true,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || typeof IntersectionObserver === "undefined") {
      setValue(to);
      setStarted(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !started) {
            setStarted(true);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [started, to]);

  useEffect(() => {
    if (!started) return;
    let raf = 0;
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(from + (to - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, to, duration]);

  let display: string;
  if (decimals > 0) {
    display = value.toFixed(decimals);
  } else {
    const rounded = Math.round(value);
    display = format ? rounded.toLocaleString("id-ID") : String(rounded);
  }

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
