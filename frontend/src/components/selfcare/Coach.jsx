import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, MessageCircleHeart } from "lucide-react";
import { getChat, sendChat, resetChat } from "../../lib/api";

export function Coach({ lang, t, onContextChange }) {
  const [messages, setMessages] = useState([]);
  const [context, setContext] = useState({ diagnosis: "", medications: "", notes: "" });
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    getChat()
      .then((r) => {
        setMessages(r.messages || []);
        setContext(r.context || { diagnosis: "", medications: "", notes: "" });
      })
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: trimmed, lang }]);
    setSending(true);
    try {
      const r = await sendChat(trimmed, lang);
      setMessages((prev) => [...prev, { role: "assistant", content: r.reply, lang }]);
      if (r.context) setContext(r.context);
      if (r.contextChanged) onContextChange?.();
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: t("common.retry"), lang }]);
    } finally {
      setSending(false);
    }
  };

  const handleReset = async () => {
    try {
      await resetChat();
    } finally {
      setMessages([]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    send(input);
  };

  return (
    <div className="glass-card flex flex-col p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="font-display text-lg font-bold text-white">{t("selfcare.coach.title")}</p>
          <p className="mt-1 text-sm leading-relaxed text-white/55">{t("selfcare.coach.intro")}</p>
        </div>
      </div>

      <div ref={listRef} className="max-h-[28rem] min-h-[12rem] flex-1 space-y-3 overflow-y-auto pr-1">
        {!loaded ? (
          <div className="h-24 animate-pulse rounded-xl bg-white/[0.04]" />
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center">
            <MessageCircleHeart className="text-white/30" size={26} />
            <p className="text-sm text-white/45">{t("selfcare.coach.empty")}</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-pulse text-white"
                      : "border border-white/[0.08] bg-white/[0.04] text-white/85"
                  }`}
                >
                  {m.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("selfcare.coach.placeholder")}
          disabled={sending}
          className="min-w-0 flex-1 rounded-full border border-white/15 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-pulse/40 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="btn-primary shrink-0 px-4 py-2.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          <span className="hidden sm:inline">{t("selfcare.coach.send")}</span>
        </button>
      </form>

      <div className="mt-5 border-t border-white/[0.08] pt-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="eyebrow">{t("selfcare.coach.contextTitle")}</p>
          <button
            type="button"
            onClick={handleReset}
            className="font-mono text-[11px] uppercase tracking-wider text-white/40 transition hover:text-pulse"
          >
            {t("selfcare.coach.reset")}
          </button>
        </div>
        <dl className="space-y-2 text-sm">
          <div className="flex items-start justify-between gap-3">
            <dt className="shrink-0 text-white/45">{t("selfcare.coach.diagnosis")}</dt>
            <dd className="text-right text-white/80">{context.diagnosis || t("selfcare.coach.none")}</dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="shrink-0 text-white/45">{t("selfcare.coach.medications")}</dt>
            <dd className="text-right text-white/80">{context.medications || t("selfcare.coach.none")}</dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="shrink-0 text-white/45">{t("selfcare.coach.notes")}</dt>
            <dd className="text-right text-white/80">{context.notes || t("selfcare.coach.none")}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

export default Coach;
