import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, CircleAlert } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { Wordmark } from "../components/ui/Wordmark";

export function Field({ label, type = "text", value, onChange, hint, ...rest }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-white/70">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[15px] text-white outline-none transition-colors duration-150 ease-expo placeholder:text-white/25 focus:border-pulse/50 focus:bg-white/[0.05]"
        {...rest}
      />
      {hint && <span className="mt-1.5 block text-xs text-white/40">{hint}</span>}
    </label>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="relative z-10 flex min-h-dvh items-center justify-center px-5 py-24">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[400px]"
      >
        <div className="mb-10 flex justify-center">
          <Link to="/">
            <Wordmark />
          </Link>
        </div>
        <div className="glass-card p-9">
          <h1 className="text-2xl font-semibold text-white">Welcome back</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-white/50">
            Log in to see your live risk dashboard.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" required />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              required
            />

            {error && (
              <p className="flex items-center gap-2 text-sm text-status-critical">
                <CircleAlert size={16} /> {error}
              </p>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-50">
              {busy ? <Loader2 size={16} className="animate-spin" /> : null}
              {busy ? "Signing in…" : "Log in"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-white/50">
            Don't have an account?{" "}
            <Link to="/signup" className="font-medium text-white hover:text-pulse transition-colors duration-150">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}
