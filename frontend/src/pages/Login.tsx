import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { useAuth } from "../App";
import { AuthLayout } from "../components/AuthComponents";
import { Button } from "../components/ui";
import { UserRole } from "../types";
import { roleOptions } from "../App";

export default function LoginPage() {
  const { authenticate } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole>("NASABAH");
  const [email, setEmail] = useState("ayu@smartbank.local");
  const [password, setPassword] = useState("smartbank-demo");
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.includes("@")) {
      setError("Email tidak valid.");
      return;
    }
    if (!password.trim()) {
      setError("Password wajib diisi.");
      return;
    }

    setError("");
    try {
      const res = await import("../api/client").then(m => m.api.login(email, password));
      const m = await import("../App");
      authenticate(m.createSessionFromLogin(res));
      navigate("/dashboard");
    } catch(err: any) {
      setError(err.message);
    }
  };

  return (
    <AuthLayout
      title="Masuk ke SmartBank"
      description="Masuk dengan akun demo untuk membuka dashboard sesuai role dan permission."
    >
      <form className="stack-form" onSubmit={submit}>
        <label>
          Email (User ID)
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
            autoComplete="current-password"
          />
        </label>
        <label>
          Role Demo
          <select value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="auth-form-row">
          <label className="checkbox-row">
            <input type="checkbox" defaultChecked />
            Ingat role demo
          </label>
          <Link className="text-link" to="/docs">
            Bantuan akses
          </Link>
        </div>
        {error && <p className="field-error">{error}</p>}
        <Button type="submit" className="full-width">
          <KeyRound size={18} />
          Masuk Aman
        </Button>
      </form>
      <p className="auth-switch">
        Belum punya akun? <Link to="/register">Daftar user baru</Link>
      </p>
    </AuthLayout>
  );
}
