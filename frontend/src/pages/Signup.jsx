import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, CircleAlert } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { Wordmark } from "../components/ui/Wordmark";
import { Field } from "./Login";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await signup(form);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Signup failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="relative z-10 flex min-h-dvh items-center justify-center px-5 py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md"
      >
        <div className="mb-8 flex justify-center">
          <Link to="/">
            <Wordmark tone="light" />
          </Link>
        </div>
        <div className="glass-card p-8">
          <h1 className="font-display text-2xl font-bold text-white">Create your account</h1>
          <p className="mt-1 text-sm text-slate-400">Start monitoring in the demo dashboard.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label="Name" value={form.name} onChange={set("name")} autoComplete="name" required />
            <Field label="Email" type="email" value={form.email} onChange={set("email")} autoComplete="email" required />
            <Field
              label="Phone"
              type="tel"
              value={form.phone}
              onChange={set("phone")}
              hint="Include country code, e.g. +1 555 123 4567"
              autoComplete="tel"
              required
            />
            <Field
              label="Password"
              type="password"
              value={form.password}
              onChange={set("password")}
              autoComplete="new-password"
              required
            />

            {error && (
              <p className="flex items-center gap-2 text-sm text-status-critical">
                <CircleAlert size={16} /> {error}
              </p>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
              {busy ? <Loader2 size={18} className="animate-spin" /> : null}
              {busy ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-teal hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}
