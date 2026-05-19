import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { useAuth } from "../App";
import { AuthLayout } from "../components/AuthComponents";
import { Button } from "../components/ui";

export default function RegisterPage() {
  const { authenticate } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("Pemilik UMKM");
  const [email, setEmail] = useState("umkm@smartbank.local");
  const [password, setPassword] = useState("smartbank-demo");
  const [confirm, setConfirm] = useState("smartbank-demo");
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Nama wajib diisi.");
      return;
    }
    if (password.length < 6) {
      setError("Password minimal 6 karakter untuk demo.");
      return;
    }
    if (password !== confirm) {
      setError("Konfirmasi password tidak sama.");
      return;
    }

    setError("");
    try {
      const res = await import("../api/client").then(m => m.api.register(name, password));
      const m = await import("../App");
      authenticate(m.createSessionFromLogin(res));
      navigate("/dashboard");
    } catch(err: any) {
      setError(err.message);
    }
  };

  return (
    <AuthLayout
      title="Register SmartBank"
      description="Buat akun user demo dengan saldo awal dan permission dasar SmartBank."
    >
      <form className="stack-form" onSubmit={submit}>
        <label>
          Nama
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
          />
        </label>
        <label>
          Email
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
          />
        </label>
        <label>
          Confirm Password
          <input
            type="password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            autoComplete="new-password"
          />
        </label>
        <label className="checkbox-row">
          <input type="checkbox" defaultChecked />
          Saya memahami akun ini menggunakan data demo frontend.
        </label>
        {error && <p className="field-error">{error}</p>}
        <Button type="submit" className="full-width">
          <UserPlus size={18} />
          Buat Akun Demo
        </Button>
      </form>
      <p className="auth-switch">
        Sudah punya akses? <Link to="/login">Masuk</Link>
      </p>
    </AuthLayout>
  );
}
