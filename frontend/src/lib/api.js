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

// ---- emergency contacts ----
export const getContacts = () => req("/contacts");
export const addContact = (payload) =>
  req("/contacts", { method: "POST", body: JSON.stringify(payload) });
export const deleteContact = (id) => req(`/contacts/${id}`, { method: "DELETE" });

// ---- alerts ----
export const getAlerts = () => req("/alerts");

export const getHealth = () => req("/health");
