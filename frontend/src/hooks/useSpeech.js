// Browser-native text-to-speech hook (Web Speech API). Ported as-is from a
// sibling project — proven implementation, keep the pickVoice() heuristics
// (Arabic voice detection, English female-voice preference) intact.
import { useCallback, useEffect, useRef, useState } from "react";

export function useSpeech(text, lang = "en") {
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [charIndex, setCharIndex] = useState(0);
  const [hasVoiceForLang, setHasVoiceForLang] = useState(true);
  const utterRef = useRef(null);

  const pickVoice = useCallback(() => {
    const voices = window.speechSynthesis.getVoices();
    if (lang === "ar") {
      return voices.find((v) => /^ar\b|-ar|arabic/i.test(v.lang) || /arabic/i.test(v.name));
    }
    return (
      voices.find((v) => /en-US/i.test(v.lang) && /female|samantha|zira|aria/i.test(v.name)) ||
      voices.find((v) => /en/i.test(v.lang))
    );
  }, [lang]);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
    setCharIndex(0);
  }, [supported]);

  const play = useCallback(() => {
    if (!supported || !text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.98;
    u.pitch = 1.0;
    u.lang = lang === "ar" ? "ar-SA" : "en-US";
    const voice = pickVoice();
    if (voice) u.voice = voice;
    setHasVoiceForLang(lang === "ar" ? !!voice : true);
    u.onstart = () => {
      setSpeaking(true);
      setPaused(false);
    };
    u.onend = () => {
      setSpeaking(false);
      setPaused(false);
      setCharIndex(text.length);
    };
    u.onerror = () => {
      setSpeaking(false);
      setPaused(false);
    };
    u.onboundary = (e) => {
      if (typeof e.charIndex === "number") setCharIndex(e.charIndex);
    };
    utterRef.current = u;
    setCharIndex(0);
    window.speechSynthesis.speak(u);
  }, [supported, text, lang, pickVoice]);

  const pause = useCallback(() => {
    if (!supported) return;
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setPaused(true);
    }
  }, [supported]);

  const resume = useCallback(() => {
    if (!supported) return;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setPaused(false);
    }
  }, [supported]);

  useEffect(() => {
    if (!supported) return;
    const warm = () => window.speechSynthesis.getVoices();
    warm();
    window.speechSynthesis.addEventListener?.("voiceschanged", warm);
    return () => {
      window.speechSynthesis.removeEventListener?.("voiceschanged", warm);
      window.speechSynthesis.cancel();
    };
  }, [supported]);

  return { supported, speaking, paused, charIndex, hasVoiceForLang, play, pause, resume, stop };
}
