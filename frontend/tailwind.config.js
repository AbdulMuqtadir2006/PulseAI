/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0A0710", // near-black warm dark — the app's base background
        pulse: "#FF3B5C", // crimson/coral — primary accent, CTAs, critical alerts
        teal: "#22E6B8", // vitals-monitor teal — secondary accent, "data is flowing"
        violet: "#8B5CF6", // bridges pulse -> teal in gradients
        mist: "#F3EFFB", // light lavender-white page background
        paper: "#FCFAFF", // card/surface tone on light pages
        depth: "#1A1030", // deep plum-indigo text on light pages
        status: {
          good: "#2EE6A8",
          watch: "#F2A93E",
          critical: "#FF3B5C",
        },
      },
      fontFamily: {
        display: ['"Sora"', "system-ui", "sans-serif"],
        body: ['"Inter"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 40px -8px rgba(255, 59, 92, 0.5)",
        "glow-sm": "0 0 24px -6px rgba(255, 59, 92, 0.4)",
        "glow-teal": "0 0 40px -8px rgba(34, 230, 184, 0.5)",
        card: "0 10px 40px -20px rgba(26, 16, 48, 0.35)",
        lift: "0 20px 50px -24px rgba(26, 16, 48, 0.45)",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "70%": { transform: "scale(1.6)", opacity: "0" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "drift-a": {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "50%": { transform: "translate(40px, -30px) scale(1.1)" },
        },
        "drift-b": {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "50%": { transform: "translate(-50px, 40px) scale(1.15)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        heartbeat: {
          "0%, 100%": { transform: "scale(1)" },
          "14%": { transform: "scale(1.16)" },
          "28%": { transform: "scale(0.96)" },
          "42%": { transform: "scale(1.1)" },
          "70%": { transform: "scale(1)" },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 6s ease-in-out infinite",
        "drift-a": "drift-a 18s ease-in-out infinite",
        "drift-b": "drift-b 22s ease-in-out infinite",
        shimmer: "shimmer 1.8s infinite",
        heartbeat: "heartbeat 1.15s ease-in-out infinite",
      },
      transitionTimingFunction: {
        expo: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
