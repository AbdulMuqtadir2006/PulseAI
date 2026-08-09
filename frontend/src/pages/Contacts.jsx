import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Plus, Trash2, UserRound, CircleAlert } from "lucide-react";
import { PageShell } from "../components/layout/PageShell";
import { getContacts, addContact, deleteContact } from "../lib/api";
import { staggerContainer, staggerItem } from "../components/ui/Reveal";
import { Field } from "./Login";

export default function Contacts() {
  const [contacts, setContacts] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", relationship: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = () => getContacts().then(setContacts);

  useEffect(() => {
    load();
  }, []);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await addContact(form);
      setForm({ name: "", phone: "", relationship: "" });
      await load();
    } catch (err) {
      setError(err.message || "Could not add contact");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    await deleteContact(id);
    await load();
  };

  return (
    <PageShell
      eyebrow="Setup"
      title="Emergency contacts"
      intro="These are the people PulseGuard AI notifies the moment a reading is critical. Without a real messaging provider configured, notifications are simulated — logged, never actually sent."
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="glass-card p-6">
          <h2 className="font-display text-lg font-semibold text-white">Add a contact</h2>
          <form onSubmit={submit} className="mt-5 space-y-4">
            <Field label="Name" value={form.name} onChange={set("name")} required />
            <Field label="Phone" type="tel" value={form.phone} onChange={set("phone")} hint="Include country code, e.g. +1 555 123 4567" required />
            <Field label="Relationship" value={form.relationship} onChange={set("relationship")} hint="e.g. Spouse, Parent, Doctor" />
            {error && (
              <p className="flex items-center gap-2 text-sm text-status-critical">
                <CircleAlert size={16} /> {error}
              </p>
            )}
            <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
              {busy ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              {busy ? "Adding…" : "Add contact"}
            </button>
          </form>
        </div>

        <div>
          {!contacts ? (
            <div className="glass-card h-40 animate-pulse" />
          ) : contacts.length === 0 ? (
            <div className="glass-card flex flex-col items-center gap-3 p-12 text-center">
              <UserRound className="text-white/40" size={32} />
              <p className="text-white/55">No emergency contacts yet — add one to enable escalation.</p>
            </div>
          ) : (
            <motion.ul className="space-y-3" variants={staggerContainer} initial="hidden" animate="show">
              {contacts.map((c) => (
                <motion.li
                  key={c.id}
                  variants={staggerItem}
                  className="glass-card flex items-center justify-between gap-3 p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-teal/25 bg-teal/10 text-teal">
                      <UserRound size={20} />
                    </span>
                    <div>
                      <p className="font-semibold text-white">{c.name}</p>
                      <p className="font-mono text-xs text-white/55">
                        {c.phone}
                        {c.relationship ? ` · ${c.relationship}` : ""}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(c.id)}
                    aria-label={`Remove ${c.name}`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-pulse/10 hover:text-pulse"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </div>
      </div>
    </PageShell>
  );
}
