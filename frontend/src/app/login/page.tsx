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
  blue: "bg-blue-500/10 border-blue-500/40 text-blue-500",
  amber: "bg-amber-500/10 border-amber-500/40 text-amber-500",
  rose: "bg-rose-500/10 border-rose-500/40 text-rose-500",
} as const;

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
    <main className="h-dvh overflow-hidden grid lg:grid-cols-2 bg-background">
      {/* Left brand panel -- 50/50 cols (info-rich side) */}
      <div className="hidden lg:block min-h-0">
        <AuthBrandPanel />
      </div>

      {/* Right form panel -- 50/50 cols (form-focused) */}
      <div className="relative flex items-center justify-center p-6 md:p-8 lg:p-10 min-h-0 overflow-y-auto">
        <div className="absolute top-4 right-4 z-30">
          <ThemeToggle />
        </div>

        {/* Mobile brand mark */}
        <div className="lg:hidden absolute top-4 left-4 flex items-center gap-2">
          <div className="size-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <LogIn className="w-3.5 h-3.5" />
          </div>
          <span className="font-display font-semibold text-sm text-foreground">SmartBank</span>
        </div>

        <motion.div
          className="w-full max-w-md space-y-4 mt-12 lg:mt-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Header */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-mono text-primary uppercase tracking-widest">Masuk</p>
            <h1 className="text-2xl lg:text-3xl font-display font-semibold text-foreground leading-tight">
              Access Terminal
            </h1>
            <p className="text-xs text-muted-foreground">
              Masukkan kredensial Anda untuk mengakses jaringan CBDC.
            </p>
          </div>

          {/* Quick-pick demo accounts */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              Akun dummy · klik untuk isi otomatis
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {QUICK_ACCOUNTS.map((acc) => {
                const isActive = email === acc.email;
                return (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => quickPick(acc)}
                    className={`px-2 py-1.5 text-[11px] font-medium rounded-md border transition-all hover:scale-[1.02] active:scale-[0.98] ${
                      isActive
                        ? TONE_ACTIVE[acc.tone]
                        : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                    }`}
                  >
                    {acc.label}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="bg-destructive/10 border border-destructive/30 text-destructive text-xs p-2.5 rounded-lg flex items-start gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0 mt-1.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-3">
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mengautentikasi...
                </>
              ) : (
                <>
                  Masuk Aman
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center text-xs text-muted-foreground pt-2 border-t border-border/50">
            Belum punya akun retail?{" "}
            <Link href="/register" className="text-primary font-medium hover:underline">
              Daftar di sini
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}