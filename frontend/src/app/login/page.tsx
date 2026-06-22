"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, LogIn, KeyRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type User, useAuthStore } from "@/store/auth";
import { fetchApi } from "@/lib/api";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthInput } from "@/components/auth/AuthInput";
import AuthBrandPanel from "@/components/auth/AuthBrandPanel";
import { MeshBackground } from "@/components/landing/MeshBackground";

type LoginResponse = {
  data: {
    accessToken: string;
    user: User;
  };
};

const QUICK_ACCOUNTS = [
  { label: "Teller", email: "teller@test.com", tone: "blue" as const },
  { label: "Manager", email: "manager@test.com", tone: "amber" as const },
  { label: "Admin", email: "admin@test.com", tone: "rose" as const },
];

const TONE_ACTIVE = {
  blue: "bg-blue-500/15 border-blue-500/50 text-blue-700 dark:text-blue-400",
  amber: "bg-amber-500/15 border-amber-500/50 text-amber-700 dark:text-amber-400",
  rose: "bg-rose-500/15 border-rose-500/50 text-rose-700 dark:text-rose-400",
} as const;

const TONE_INACTIVE =
  "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const loginRes = await fetchApi<LoginResponse>("/api/wallet/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const token = loginRes.data.accessToken;
      const user = loginRes.data.user;

      if (!token || !user) {
        throw new Error("Invalid response from server");
      }

      setAuth(token, user);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Email atau password tidak valid");
    } finally {
      setIsLoading(false);
    }
  };

  const quickPick = (acc: (typeof QUICK_ACCOUNTS)[number]) => {
    setEmail(acc.email);
    setPassword("password");
    setError("");
  };

  return (
    // overflow-hidden prevents body scroll. grid-cols-2 gives clean 50:50 split.
    <main className="relative h-dvh overflow-hidden grid lg:grid-cols-2 bg-background [perspective:1500px]">
      {/* Page-level MeshBackground (behind both panels) */}
      <div className="absolute inset-0 z-0 lg:hidden">
        <MeshBackground />
      </div>

      {/* Left brand panel -- 50/50 cols (info-rich side) */}
      <div className="hidden lg:block min-h-0 relative z-10">
        <AuthBrandPanel />
      </div>

      {/* Right form panel -- 50/50 cols (form-focused) */}
      <div className="relative z-10 flex items-center justify-center p-6 md:p-8 lg:p-10 min-h-0 overflow-y-auto">
        {/* Mesh background only on small screens (desktop has brand panel) */}
        <div className="absolute inset-0 -z-10 hidden lg:block">
          <MeshBackground />
        </div>

        <div className="absolute top-4 right-4 z-30 hidden">
          <ThemeToggle />
        </div>

        {/* Mobile brand mark */}
        <div className="lg:hidden absolute top-4 left-4 flex items-center gap-2">
          <div className="size-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <LogIn className="w-3.5 h-3.5" />
          </div>
          <span className="font-display font-semibold text-sm text-foreground">SmartBank</span>
        </div>

        {/* Glassmorphic form container */}
        <motion.div
          className="relative w-full max-w-md mt-12 lg:mt-0"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {/* Inner refraction line */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 dark:via-white/15 to-transparent rounded-t-3xl pointer-events-none z-10" />

          <div className="relative rounded-3xl border border-slate-200 dark:border-white/10 bg-white/85 dark:bg-slate-900/60 backdrop-blur-2xl shadow-[0_30px_80px_-20px_rgba(37,99,235,0.25),inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] p-8 md:p-10">
            {/* Header */}
            <motion.div variants={item} className="space-y-2 mb-6">
              <p className="text-[10px] font-mono text-primary uppercase tracking-widest">
                Masuk
              </p>
              <h1 className="text-2xl lg:text-3xl font-display font-semibold text-foreground leading-tight tracking-tight">
                Access Terminal
              </h1>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Masukkan kredensial Anda untuk mengakses jaringan CBDC.
              </p>
            </motion.div>

            {/* Quick-pick demo accounts */}
            <motion.div variants={item} className="space-y-2 mb-5">
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                Akun dummy · klik untuk isi otomatis
              </p>
              <div className="grid grid-cols-3 gap-2">
                {QUICK_ACCOUNTS.map((acc) => {
                  const isActive = email === acc.email;
                  return (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => quickPick(acc)}
                      className={`px-2 py-2 text-[11px] font-medium rounded-md border transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] ${
                        isActive ? TONE_ACTIVE[acc.tone] : TONE_INACTIVE
                      }`}
                    >
                      {acc.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-destructive/10 border border-destructive/30 text-destructive text-xs p-2.5 rounded-lg flex items-start gap-2 mb-3"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0 mt-1.5" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Form */}
            <motion.form
              variants={item}
              onSubmit={handleLogin}
              className="space-y-3"
            >
              <AuthInput
                label="Email"
                icon={LogIn}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="anda@email.com"
                autoComplete="email"
                required
              />
              <AuthInput
                label="Password"
                icon={KeyRound}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 karakter"
                autoComplete="current-password"
                required
                hint={email.endsWith("@test.com") ? "Default: password" : undefined}
              />

              {/* CTA — landing pattern (shimmer + gradient shadow + scale) */}
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary text-primary-foreground py-3 font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-2 shadow-[0_10px_30px_-10px_rgba(37,99,235,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] hover:shadow-[0_15px_40px_-10px_rgba(37,99,235,0.7),inset_0_1px_0_rgba(255,255,255,0.2)]"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Mengautentikasi...
                    </>
                  ) : (
                    <>
                      Masuk Aman
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </>
                  )}
                </span>
                {/* Shimmer sweep on hover */}
                {!isLoading && (
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                )}
              </button>
            </motion.form>

            <motion.div
              variants={item}
              className="text-center text-xs text-muted-foreground pt-4 mt-4 border-t border-border/40"
            >
              Belum punya akun retail?{" "}
              <Link
                href="/register"
                className="text-primary font-medium hover:underline inline-flex items-center gap-1 group"
              >
                Daftar di sini
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
