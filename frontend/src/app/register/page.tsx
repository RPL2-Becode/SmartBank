"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  KeyRound,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
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

type StrengthTone = "muted" | "destructive" | "amber" | "emerald";

function pinStrength(pin: string): { level: 0 | 1 | 2 | 3; label: string; tone: StrengthTone } {
  if (!pin) return { level: 0, label: "Kosong", tone: "muted" };
  if (pin.length < 6) return { level: 1, label: "Terlalu pendek", tone: "destructive" };

  const unique = new Set(pin.split("")).size;
  if (unique === 1) return { level: 1, label: "Sangat lemah", tone: "destructive" };
  if (unique === 2) return { level: 2, label: "Lemah", tone: "amber" };

  // Sequential ascending/descending
  const isSeq = pin.split("").every((d, i, arr) => {
    if (i === 0) return true;
    return Number(d) === Number(arr[i - 1]) + 1 || Number(d) === Number(arr[i - 1]) - 1;
  });
  if (isSeq) return { level: 2, label: "Lemah (berurutan)", tone: "amber" };

  return { level: 3, label: "Kuat", tone: "emerald" };
}

const STRENGTH_BAR_COLORS: Record<StrengthTone, string> = {
  muted: "bg-secondary",
  destructive: "bg-destructive",
  amber: "bg-amber-500",
  emerald: "bg-emerald-500",
};

const STRENGTH_TEXT_COLORS: Record<StrengthTone, string> = {
  muted: "text-muted-foreground",
  destructive: "text-destructive",
  amber: "text-amber-500",
  emerald: "text-emerald-500",
};

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    pin: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const strength = useMemo(() => pinStrength(formData.pin), [formData.pin]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await fetchApi("/api/wallet/v1/auth/register", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      const loginRes = await fetchApi<LoginResponse>("/api/wallet/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      });

      const token = loginRes.data.accessToken;
      const user = loginRes.data.user;

      if (!token || !user) {
        throw new Error("Invalid response from server during auto-login");
      }

      setAuth(token, user);
      router.push("/dashboard");
    } catch (err) {
      let errorMsg =
        err instanceof Error ? err.message : "Registrasi gagal. Periksa kembali data Anda.";
      if (
        errorMsg.includes("Idempotency-Key dipakai") ||
        errorMsg.includes("Email sudah terdaftar") ||
        errorMsg.includes("Email sudah digunakan")
      ) {
        errorMsg = "Email ini sudah terdaftar. Silakan gunakan email lain atau langsung Login.";
      }
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="h-dvh overflow-hidden grid lg:grid-cols-2 bg-background">
      {/* Left brand panel -- 50/50 cols */}
      <div className="hidden lg:block min-h-0">
        <AuthBrandPanel />
      </div>

      {/* Right form panel -- 50/50 cols (form gets half width) */}
      <div className="relative flex items-center justify-center p-6 md:p-8 lg:p-10 min-h-0 overflow-y-auto">
        <div className="absolute top-4 right-4 z-30">
          <ThemeToggle />
        </div>

        {/* Mobile brand mark */}
        <div className="lg:hidden absolute top-4 left-4 flex items-center gap-2">
          <div className="size-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-display font-semibold text-sm text-foreground">SmartBank</span>
        </div>

        <motion.div
          className="w-full max-w-lg space-y-3.5 mt-12 lg:mt-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Header (compact) */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-mono text-primary uppercase tracking-widest">Daftar</p>
            <h1 className="text-2xl lg:text-3xl font-display font-semibold text-foreground leading-tight">
              Buat Identitas
            </h1>
            <p className="text-xs text-muted-foreground">
              5 field · langsung aktif · PIN terpisah dari password untuk keamanan ekstra.
            </p>
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

          {/* Form (2-col grid for compactness) */}
          <form onSubmit={handleRegister} className="space-y-2.5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <AuthInput
                label="Nama Lengkap"
                icon={UserIcon}
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Nama sesuai KTP"
                autoComplete="name"
                required
              />
              <AuthInput
                label="Email"
                icon={Mail}
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="anda@email.com"
                autoComplete="email"
                required
              />
            </div>

            {/* Phone with +62 prefix */}
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-medium text-foreground">Nomor Telepon</label>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Format otomatis +62
                </span>
              </div>
              <div className="relative group">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                <span className="absolute left-10 top-1/2 -translate-y-1/2 text-sm font-mono text-muted-foreground pointer-events-none select-none">
                  +62
                </span>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="8123456789"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="tel-national"
                  required
                  className="w-full bg-secondary/40 border border-border focus:border-primary rounded-lg py-2.5 pl-[68px] pr-4 outline-none transition-all text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:bg-secondary/70"
                />
              </div>
            </div>

            {/* Password + PIN row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <AuthInput
                label="Password"
                icon={KeyRound}
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min. 6 char"
                autoComplete="new-password"
                required
              />

              {/* PIN with strength */}
              <div className="space-y-1">
                <AuthInput
                  label="PIN 6-digit"
                  icon={KeyRound}
                  type="password"
                  name="pin"
                  maxLength={6}
                  value={formData.pin}
                  onChange={handleChange}
                  placeholder="123456"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  required
                />
                {formData.pin && (
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3].map((bar) => (
                      <div
                        key={bar}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          bar <= strength.level
                            ? STRENGTH_BAR_COLORS[strength.tone]
                            : "bg-secondary"
                        }`}
                      />
                    ))}
                    <span
                      className={`text-[10px] font-mono ${STRENGTH_TEXT_COLORS[strength.tone]}`}
                    >
                      {strength.label}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mendaftarkan...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Daftar &amp; Masuk
                </>
              )}
            </button>
          </form>

          <div className="text-center text-xs text-muted-foreground pt-2 border-t border-border/50">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Login di sini
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}