import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { AlertTriangle, Inbox, Pause, Play, RotateCcw } from "lucide-react";
import { PageShell } from "../components/layout/PageShell";
import { VoiceOrb } from "../components/voice/VoiceOrb";
import { useSpeech } from "../hooks/useSpeech";
import { useLang } from "../i18n/LanguageContext";
import { getVoiceScript } from "../lib/api";
import { staggerContainer, staggerItem } from "../components/ui/Reveal";

export default function Voice() {
  const { lang, t } = useLang();
  const [scriptData, setScriptData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const script = scriptData?.script ?? "";
  const source = scriptData?.source ?? "fallback";

  const { supported, speaking, paused, charIndex, error: speechError, play, pause, resume, stop } = useSpeech(
    script,
    lang
  );

  const playStartedAt = useRef(null);
  const wasSpeaking = useRef(false);
  const [playbackFailed, setPlaybackFailed] = useState(false);

  // Fetch a fresh script whenever the language changes, stopping any
  // in-flight speech first so we never keep narrating a stale/other-language
  // utterance while the new script loads.
  useEffect(() => {
    let alive = true;
    stop();
    setPlaybackFailed(false);
    setLoading(true);
    setError(null);
    getVoiceScript(lang)
      .then((data) => {
        if (alive) setScriptData(data);
      })
      .catch((e) => {
        if (alive) setError(e);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  // Silent-failure guard: some voices (observed with certain Arabic SAPI
  // voices on Windows) fire onstart -> onend almost immediately without
  // producing any audio. If speaking flips true -> false within ~250ms of a
  // real play() call for a non-trivial script, treat it as a failed playback
  // rather than silently showing "finished".
  useEffect(() => {
    if (wasSpeaking.current && !speaking) {
      const elapsed = playStartedAt.current ? Date.now() - playStartedAt.current : Infinity;
      if (elapsed < 250 && script.length > 20) {
        setPlaybackFailed(true);
      }
    }
    wasSpeaking.current = speaking;
  }, [speaking, script]);

  // The hook also reports outright failures directly (e.g. the server-audio
  // fetch for Arabic failing) — surface those through the same UI message.
  useEffect(() => {
    if (speechError) setPlaybackFailed(true);
  }, [speechError]);

  const handlePlay = () => {
    setPlaybackFailed(false);
    playStartedAt.current = Date.now();
    play();
  };

  const handleReplay = () => {
    setPlaybackFailed(false);
    stop();
    playStartedAt.current = Date.now();
    play();
  };

  const spoken = script.slice(0, charIndex);
  const unspoken = script.slice(charIndex);

  return (
    <PageShell eyebrow={t("voice.eyebrow")} title={t("voice.title")} intro={t("voice.intro")}>
      {loading ? (
        <div className="glass-card h-72 animate-pulse" />
      ) : error ? (
        <div className="glass-card flex flex-col items-center gap-3 p-12 text-center">
          <Inbox className="text-white/40" size={32} />
          <p className="max-w-md text-white/55">{t("common.noReading")}</p>
          <Link
            to="/dashboard"
            className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition duration-200 hover:border-teal/50"
          >
            {t("common.goToDashboard")}
          </Link>
        </div>
      ) : (
        <motion.div className="space-y-6" variants={staggerContainer} initial="hidden" animate="show">
          <motion.div variants={staggerItem} className="glass-card flex flex-col items-center gap-6 p-8 text-center">
            <VoiceOrb active={speaking && !paused} tick={charIndex} />

            {!supported ? (
              <p className="max-w-md text-white/55">{t("voice.unsupported")}</p>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-3">
                {speaking && !paused ? (
                  <button
                    type="button"
                    onClick={pause}
                    className="inline-flex items-center gap-2 rounded-full border border-pulse/40 bg-pulse/10 px-5 py-2.5 text-sm font-semibold text-pulse transition hover:bg-pulse/20"
                  >
                    <Pause size={16} /> {t("voice.pause")}
                  </button>
                ) : paused ? (
                  <button
                    type="button"
                    onClick={resume}
                    className="inline-flex items-center gap-2 rounded-full border border-pulse/40 bg-pulse/10 px-5 py-2.5 text-sm font-semibold text-pulse transition hover:bg-pulse/20"
                  >
                    <Play size={16} /> {t("voice.resume")}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePlay}
                    disabled={!script}
                    className="inline-flex items-center gap-2 rounded-full border border-pulse/40 bg-pulse/10 px-5 py-2.5 text-sm font-semibold text-pulse transition hover:bg-pulse/20 disabled:opacity-50"
                  >
                    <Play size={16} /> {t("voice.play")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleReplay}
                  disabled={!script}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.02] px-5 py-2.5 text-sm font-medium text-white/80 transition hover:border-white/30 hover:text-white disabled:opacity-50"
                >
                  <RotateCcw size={16} /> {t("voice.replay")}
                </button>
              </div>
            )}

            {playbackFailed && (
              <p className="flex items-center gap-2 text-sm text-pulse">
                <AlertTriangle size={16} /> {t("voice.playbackFailed")}
              </p>
            )}
          </motion.div>

          <motion.div variants={staggerItem} className="glass-card p-6">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span
                className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-wider ${
                  source === "ai"
                    ? "border-teal/30 bg-teal/10 text-teal"
                    : "border-white/10 bg-white/[0.03] text-white/55"
                }`}
              >
                {source === "ai" ? t("common.aiBadge") : t("common.fallbackBadge")}
              </span>
            </div>
            {source === "fallback" && <p className="mb-4 text-xs text-white/40">{t("common.aiOfflineNote")}</p>}
            <p className="text-lg leading-relaxed">
              <span className="text-white">{spoken}</span>
              <span className="text-white/40">{unspoken}</span>
            </p>
          </motion.div>
        </motion.div>
      )}
    </PageShell>
  );
}
