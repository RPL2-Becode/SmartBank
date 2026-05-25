import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, ShieldCheck, UserPlus, Info } from "lucide-react";
import { useAuth } from "../App";
import { api } from "../api/client";
import { Button } from "../components/ui";

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Nama Lengkap wajib diisi sesuai identitas.");
      return;
    }
    if (!email.includes("@")) {
      setError("Alamat Email tidak valid.");
      return;
    }
    if (password.length < 6) {
      setError("Password minimal harus 6 karakter.");
      return;
    }
    if (password !== confirm) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setError("");
    try {
      await api.register(email, name, password, "user");
      login("user", email);
      navigate("/dashboard");
    } catch(err: any) {
      setError(err.message || "Gagal mendaftarkan akun. Silakan coba lagi.");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-main">
        <div className="auth-card">
          <div className="auth-logo">
            <ShieldCheck size={32} color="#1E40AF" />
            <span>SmartBank</span>
          </div>
          <h1>Buka Rekening Baru</h1>
          <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
            Lengkapi data di bawah ini untuk mengaktifkan akun perbankan digital kamu.
          </p>

          <form className="stack-form" onSubmit={submit}>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                <User size={16} color="#3B82F6" /> Nama Lengkap
              </label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Contoh: Budi Santoso"
                autoComplete="name"
              />
              <small style={{ color: 'var(--muted)', fontSize: '12px' }}>Gunakan nama asli untuk keperluan verifikasi.</small>
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                <Mail size={16} color="#3B82F6" /> Email (User ID)
              </label>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nama@email.com"
                autoComplete="email"
              />
              <small style={{ color: 'var(--muted)', fontSize: '12px' }}>Email ini akan digunakan sebagai ID unik saat login.</small>
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                <Lock size={16} color="#3B82F6" /> Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimal 6 karakter"
                autoComplete="new-password"
              />
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                <Lock size={16} color="#3B82F6" /> Konfirmasi Password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                placeholder="Ulangi password kamu"
                autoComplete="new-password"
              />
            </div>

            <div style={{ 
              background: 'rgba(59, 130, 246, 0.1)', 
              padding: '12px', 
              borderRadius: '8px', 
              border: '1px solid rgba(59, 130, 246, 0.2)',
              display: 'flex',
              gap: '10px',
              marginTop: '10px'
            }}>
              <Info size={20} color="#3B82F6" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: '12px', color: 'var(--muted-strong)', margin: 0, lineHeight: 1.4 }}>
                Dengan mendaftar, kamu akan mendapatkan <strong>Saldo Awal Rp 50.000</strong> secara otomatis ke rekening baru kamu.
              </p>
            </div>

            {error && <p className="field-error" style={{ marginTop: '10px' }}>{error}</p>}
            
            <Button type="submit" className="full-width" style={{ marginTop: '1.5rem', minHeight: '48px' }}>
              <UserPlus size={18} />
              Daftar Sekarang
            </Button>
          </form>

          <p className="auth-switch" style={{ marginTop: '1.5rem' }}>
            Sudah punya akun? <Link to="/login" style={{ fontWeight: 700, color: 'var(--blue)' }}>Masuk di sini</Link>
          </p>
        </div>

        <div className="auth-visual mobile-hide">
          <div style={{ textAlign: 'center' }}>
            <div className="auth-kicker" style={{ margin: '0 auto 1.5rem' }}>EKOSISTEM_EKONOMI_UMKM</div>
            <h2 style={{ fontSize: '28px', lineHeight: 1.2 }}>Mulai Langkah Finansial Digital Kamu.</h2>
            <p style={{ marginTop: '1rem', opacity: 0.9 }}>
              Keamanan tingkat bank, transparansi mutlak dengan ledger immutable, dan integrasi penuh dengan ekosistem PasarKita.
            </p>
          </div>
          
          <div className="auth-ledger-preview" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <dt style={{ color: '#93C5FD' }}>Bonus Saldo</dt>
              <dd style={{ color: '#fff' }}>Rp 50.000</dd>
            </div>
            <div>
              <dt style={{ color: '#93C5FD' }}>Biaya Admin</dt>
              <dd style={{ color: '#fff' }}>Gratis (Rp 0)</dd>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
