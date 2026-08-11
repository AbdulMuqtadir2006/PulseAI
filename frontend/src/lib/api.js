// API layer — talks to the PulseGuard AI FastAPI backend.
// VITE_API_URL points at the deployed backend; unset in dev, requests fall
// back to Vite's proxy (see vite.config.js).

const API_BASE = import.meta.env.VITE_API_URL || "";
const TOKEN_KEY = "pulseguard-token";
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) =>
  t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);

async function req(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ---- auth ----
export const signup = (payload) =>
  req("/auth/signup", { method: "POST", body: JSON.stringify(payload) });
export const login = (email, password) =>
  req("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
export const fetchMe = () => req("/auth/me");
export const logoutApi = () => req("/auth/logout", { method: "POST" });

// ---- vitals ----
export const getLatestVitals = () => req("/vitals/latest");
export const getVitalsHistory = (hours = 24) => req(`/vitals?hours=${hours}`);
export const simulateReading = (scenario = "normal") =>
  req("/vitals/simulate", { method: "POST", body: JSON.stringify({ scenario }) });

// ---- alerts ----
export const getAlerts = () => req("/alerts");

export const getHealth = () => req("/health");

// ---- content agents: voice / report / self-care / chat ----
export const getVoiceScript = (lang = "en") =>
  req("/voice-script", { method: "POST", body: JSON.stringify({ lang }) });

// Server-synthesized audio (espeak-ng) — used so spoken playback doesn't
// depend on the device having a matching OS/browser voice installed.
export async function getVoiceAudioBlob(text, lang = "en") {
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/voice-audio`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ text, lang }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || body.error || `Request failed: ${res.status}`);
  }
  return res.blob();
}
export const getReport = (lang = "en") =>
  req("/report", { method: "POST", body: JSON.stringify({ lang }) });
export const getSelfCare = (lang = "en") =>
  req("/self-care", { method: "POST", body: JSON.stringify({ lang }) });
export const getChat = () => req("/chat");
export const sendChat = (message, lang = "en") =>
  req("/chat", { method: "POST", body: JSON.stringify({ message, lang }) });
export const resetChat = () => req("/chat", { method: "DELETE" });
