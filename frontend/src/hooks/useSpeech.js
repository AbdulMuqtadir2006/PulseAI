// Text-to-speech hook. English uses the browser-native Web Speech API
// (speechSynthesis) — virtually every device ships an English voice, and
// this gives the nicest quality where it's available. Arabic instead fetches
// server-synthesized audio (espeak-ng, see backend/app/core/tts.py) and
// plays it as a normal file, so it works even when the device has no
// Arabic voice/language pack installed — the whole point of this hook.
import { useCallback, useEffect, useRef, useState } from "react";
import { getVoiceAudioBlob } from "../lib/api";

export function useSpeech(text, lang = "en") {
  const nativeSupported = typeof window !== "undefined" && "speechSynthesis" in window;
  const useServerAudio = lang === "ar";
  const supported = useServerAudio ? true : nativeSupported;

  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [charIndex, setCharIndex] = useState(0);
  const [error, setError] = useState(false);

  const utterRef = useRef(null);
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);
  const requestIdRef = useRef(0);

  const pickEnglishVoice = useCallback(() => {
    const voices = window.speechSynthesis.getVoices();
    return (
      voices.find((v) => /en-US/i.test(v.lang) && /female|samantha|zira|aria/i.test(v.name)) ||
      voices.find((v) => /en/i.test(v.lang))
    );
  }, []);

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      audio.onplay = null;
      audio.onpause = null;
      audio.onended = null;
      audio.onerror = null;
      audio.ontimeupdate = null;
      audio.pause();
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    requestIdRef.current += 1; // invalidate any in-flight fetch/audio
    if (useServerAudio) {
      cleanupAudio();
    } else if (nativeSupported) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
    setPaused(false);
    setCharIndex(0);
  }, [useServerAudio, nativeSupported, cleanupAudio]);

  const playServerAudio = useCallback(async () => {
    cleanupAudio();
    const myRequestId = ++requestIdRef.current;
    try {
      const blob = await getVoiceAudioBlob(text, lang);
      if (myRequestId !== requestIdRef.current) return; // superseded
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onplay = () => {
        setSpeaking(true);
        setPaused(false);
      };
      audio.onpause = () => {
        if (!audio.ended) setPaused(true);
      };
      audio.onended = () => {
        setSpeaking(false);
        setPaused(false);
        setCharIndex(text.length);
      };
      audio.onerror = () => {
        if (myRequestId !== requestIdRef.current) return;
        setSpeaking(false);
        setPaused(false);
        setError(true);
      };
      audio.ontimeupdate = () => {
        if (audio.duration) {
          setCharIndex(Math.floor((audio.currentTime / audio.duration) * text.length));
        }
      };
      await audio.play();
    } catch {
      if (myRequestId === requestIdRef.current) {
        setSpeaking(false);
        setPaused(false);
        setError(true);
      }
    }
  }, [text, lang, cleanupAudio]);

  const play = useCallback(() => {
    if (!text) return;
    setError(false);
    setCharIndex(0);

    if (useServerAudio) {
      playServerAudio();
      return;
    }

    if (!nativeSupported) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.98;
    u.pitch = 1.0;
    u.lang = "en-US";
    const voice = pickEnglishVoice();
    if (voice) u.voice = voice;
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
      setError(true);
    };
    u.onboundary = (e) => {
      if (typeof e.charIndex === "number") setCharIndex(e.charIndex);
    };
    utterRef.current = u;
    window.speechSynthesis.speak(u);
  }, [text, useServerAudio, nativeSupported, pickEnglishVoice, playServerAudio]);

  const pause = useCallback(() => {
    if (useServerAudio) {
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        setPaused(true);
      }
      return;
    }
    if (!nativeSupported) return;
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setPaused(true);
    }
  }, [useServerAudio, nativeSupported]);

  const resume = useCallback(() => {
    if (useServerAudio) {
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play();
        setPaused(false);
      }
      return;
    }
    if (!nativeSupported) return;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setPaused(false);
    }
  }, [useServerAudio, nativeSupported]);

  useEffect(() => {
    if (useServerAudio || !nativeSupported) return undefined;
    const warm = () => window.speechSynthesis.getVoices();
    warm();
    window.speechSynthesis.addEventListener?.("voiceschanged", warm);
    return () => {
      window.speechSynthesis.removeEventListener?.("voiceschanged", warm);
    };
  }, [useServerAudio, nativeSupported]);

  // Unmount / lang-or-text-change cleanup only.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => stop, [useServerAudio]);

  return { supported, speaking, paused, charIndex, error, play, pause, resume, stop };
}
