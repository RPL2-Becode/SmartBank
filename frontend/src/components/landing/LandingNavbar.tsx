"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Menu, X } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

const sections = [
  { label: "Arsitektur", href: "#arsitektur" },
  { label: "Tentang", href: "#tentang" },
  { label: "Layanan", href: "#layanan" },
  { label: "Keamanan", href: "#keamanan" },
  { label: "Peran", href: "#peran" },
  { label: "Biaya", href: "#biaya" },
];

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/75 backdrop-blur-xl border-b border-border shadow-sm shadow-black/5"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Building2 className="w-4 h-4" />
          </div>
          <span className="font-display font-semibold text-foreground text-base">
            SmartBank
          </span>
          <span className="hidden sm:inline-block text-[10px] font-mono uppercase tracking-widest text-muted-foreground border border-border rounded px-1.5 py-0.5">
            CBDC
          </span>
        </Link>

        {/* Desktop section links */}
        <ul className="hidden lg:flex items-center gap-1">
          {sections.map((s) => (
            <li key={s.href}>
              <a
                href={s.href}
                className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Right cluster */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/guide"
            className="hidden md:inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Panduan
          </Link>
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-foreground hover:bg-secondary/60 transition-colors"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center px-4 py-2 rounded-md text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm shadow-primary/20"
          >
            Daftar
          </Link>
          <button
            type="button"
            aria-label="Buka menu"
            aria-expanded={open}
            className="lg:hidden inline-flex items-center justify-center size-9 rounded-md text-foreground hover:bg-secondary/60 transition-colors"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="lg:hidden border-t border-border bg-background/95 backdrop-blur-xl"
          >
            <ul className="max-w-6xl mx-auto px-6 py-3 flex flex-col gap-1">
              {sections.map((s) => (
                <li key={s.href}>
                  <a
                    href={s.href}
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
              <li className="md:hidden">
                <Link
                  href="/guide"
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                >
                  Panduan
                </Link>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
