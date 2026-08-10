/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    // A full override (not `extend`) — the default Tailwind palette
    // (slate/gray/blue/red/...) is intentionally gone. Every color used
    // anywhere in this app must come through one of these named tokens, so
    // "just reach for text-slate-400" is no longer possible by accident.
    colors: {
      transparent: "transparent",
      current: "currentColor",
      white: "#FFFFFF",
      black: "#000000",

      // ---- primitive: base ----
      // Page background. Everything else is this + white at low opacity —
      // matches how Linear/Vercel build "gray" text and card elevation
      // (white-alpha over near-black), which is why it reads as coherent
      // instead of a separate gray hex fighting the background.
      ink: "#0A0710",
      // The one case that needs a truly opaque (non-transparent) panel —
      // dropdowns/menus sitting over other content, not general cards.
      surface: "#14101B",

      // ---- primitive: the one brand accent ----
      // "Pulse" doubles as both the brand color and the critical-risk
      // semantic color — the product's entire premise is catching the
      // critical moment, so the accent and the alert state being the same
      // hue is intentional, not a coincidence.
      pulse: {
        DEFAULT: "#FF3B5C",
        dim: "#B8283F", // pressed/active state, no separate shadow token needed
      },

      // ---- primitive: functional secondary hues (semantic use only —
      // never decorative, never in a gradient with pulse) ----
      teal: "#1FD8AA",
      amber: "#F2A93E",

      // ---- semantic aliases ----
      status: {
        good: "#1FD8AA",
        watch: "#F2A93E",
        critical: "#FF3B5C",
      },
    },
    fontFamily: {
      // General Sans (Fontshare, free) — a distinctive geometric-humanist
      // grotesque, not the Sora/Space-Grotesk pairing every AI-startup
      // template reaches for by default.
      display: ['"General Sans"', "system-ui", "sans-serif"],
      body: ['"Inter"', "system-ui", "sans-serif"],
      mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
    },
    fontSize: {
      // A deliberate scale (Geist-derived: 12/14/16/18/20/24/30/36/48/60/72)
      // with line-height and tracking baked into each step, not left to
      // whatever the browser default happens to be. Display sizes get
      // tight, near-1:1 line-height and negative tracking, matching every
      // reference site measured (Linear, Stripe, Raycast, Framer all sit in
      // the -0.8px to -2.2px range on their largest headline).
      xs: ["0.75rem", { lineHeight: "1.5", letterSpacing: "0" }],
      sm: ["0.875rem", { lineHeight: "1.55", letterSpacing: "0" }],
      base: ["1rem", { lineHeight: "1.65", letterSpacing: "0" }],
      lg: ["1.125rem", { lineHeight: "1.6", letterSpacing: "-0.01em" }],
      xl: ["1.25rem", { lineHeight: "1.5", letterSpacing: "-0.01em" }],
      "2xl": ["1.5rem", { lineHeight: "1.35", letterSpacing: "-0.015em" }],
      "3xl": ["1.875rem", { lineHeight: "1.25", letterSpacing: "-0.02em" }],
      "4xl": ["2.25rem", { lineHeight: "1.15", letterSpacing: "-0.02em" }],
      "5xl": ["3rem", { lineHeight: "1.1", letterSpacing: "-0.025em" }],
      "6xl": ["3.75rem", { lineHeight: "1.05", letterSpacing: "-0.03em" }],
      "7xl": ["4.5rem", { lineHeight: "1.02", letterSpacing: "-0.03em" }],
    },
    extend: {
      boxShadow: {
        // Rare-use, purposeful only — not default card styling. Cards get
        // hierarchy from a 1px border + background-alpha step, the way
        // Vercel/Linear do it, not from a floating drop-shadow.
        "glow-sm": "0 0 0 1px rgba(255,59,92,0.15), 0 4px 24px -8px rgba(255,59,92,0.35)",
        glow: "0 0 0 1px rgba(255,59,92,0.2), 0 8px 40px -10px rgba(255,59,92,0.5)",
        // Neutral (non-pulse-tinted) elevation for hover states that aren't
        // signaling an alert — plain cards lifting, not glowing.
        lift: "0 12px 32px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
        card: "0 8px 24px -8px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)",
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
        heartbeat: "heartbeat 1.15s ease-in-out infinite",
      },
      transitionTimingFunction: {
        // The curve every reference site's interactive elements converge
        // on (Linear ships this exact bezier on every button transition).
        expo: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      transitionDuration: {
        150: "150ms",
        250: "250ms",
      },
    },
  },
  plugins: [],
};
