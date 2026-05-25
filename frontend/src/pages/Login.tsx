import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { useAuth } from "../App";
import { api } from "../api/client";
import { AuthLayout } from "../components/AuthComponents";
import { Button } from "../components/ui";
import { UserRole } from "../types";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("ayu@smartbank.local");
  const [password, setPassword] = useState("smartbank-demo");
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!password.trim()) {
      setError("Password wajib diisi.");
      return;
    }

    setError("");
    try {
      const res = await api.login(email, password);
      login("user", email);
      navigate("/dashboard");
    } catch(err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-main">
        <div className="auth-card">
          <div className="auth-wordmark">SmartBank</div>
          <h1>Selamat Datang</h1>
          <p>Silakan masuk ke akun demo kamu untuk mengelola keuangan.</p>

          <form className="stack-form" onSubmit={submit}>
            <label>
              User ID / Email
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Masukkan User ID"
                autoComplete="email"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </label>
            
            <div className="auth-form-row">
              <label className="checkbox-row">
                <input type="checkbox" defaultChecked />
                Ingat saya
              </label>
              <Link className="text-link" style={{ fontSize: 13 }} to="/docs">
                Lupa Password?
              </Link>
            </div>

            {error && <p className="field-error">{error}</p>}
            
            <Button type="submit" className="full-width" style={{ marginTop: '0.5rem' }}>
              <KeyRound size={18} />
              Masuk Sekarang
            </Button>
          </form>

          <p className="auth-switch">
            Belum punya akun? <Link to="/register">Daftar Akun Baru</Link>
          </p>
        </div>

        <div className="auth-visual mobile-hide">
          <div>
            <div className="auth-kicker">KEAMANAN_BANK_LEVEL</div>
            <h2>Satu ID untuk seluruh ekosistem UMKM.</h2>
            <p>SmartBank adalah jantung transaksi kamu. Aman, cepat, dan terpercaya.</p>
          </div>
          
          <div className="auth-ledger-preview">
            <div>
              <dt>Money Supply</dt>
              <dd>Rp 1.000.000.000</dd>
            </div>
            <div>
              <dt>User Trust</dt>
              <dd>99.9% Secured</dd>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
