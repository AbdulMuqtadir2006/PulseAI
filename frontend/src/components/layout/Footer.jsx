import { Link } from "react-router-dom";
import { Github, Twitter, Linkedin } from "lucide-react";
import { Wordmark } from "../ui/Wordmark";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Dashboard", to: "/dashboard" },
      { label: "Voice summary", to: "/voice" },
      { label: "Report", to: "/report" },
      { label: "Self-care", to: "/self-care" },
      { label: "Alerts", to: "/alerts" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", to: "/#about" },
      { label: "How it works", to: "/#pipeline" },
      { label: "Research", to: "/#research" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Not a medical device", to: "/#disclaimer" },
      { label: "Privacy", to: "/#disclaimer" },
      { label: "Terms", to: "/#disclaimer" },
    ],
  },
];

const socials = [
  { icon: Twitter, label: "PulseGuard AI on X" },
  { icon: Linkedin, label: "PulseGuard AI on LinkedIn" },
  { icon: Github, label: "PulseGuard AI on GitHub" },
];

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-ink/80 text-white/70 backdrop-blur-sm">
      <div className="container-page py-14">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <Wordmark />
            <p className="mt-4 text-sm leading-relaxed text-white/55">
              A research-stage wearable AI concept that watches your heart rate, HRV, SpO2, and
              blood pressure — and escalates before a bad moment becomes an emergency.
            </p>
            <div className="mt-6 flex gap-3">
              {socials.map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/55 transition-colors duration-200 hover:border-teal/50 hover:text-teal"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l, i) => (
                  <li key={`${l.label}-${i}`}>
                    <Link to={l.to} className="text-sm text-white/55 transition-colors duration-200 hover:text-teal">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-white/10 pt-6" id="disclaimer">
          <p className="max-w-3xl text-xs leading-relaxed text-white/40">
            PulseGuard AI is a research-stage prototype exploring what continuous biometric
            monitoring could do for cardiac risk — it is not a diagnostic device, it has not been
            clinically validated, and it must never be relied on in a real emergency. If you or
            someone near you may be having a heart attack, call your local emergency number
            immediately. Emergency-contact notifications in this demo are simulated unless a real
            messaging provider is configured.
          </p>
          <p className="mt-4 text-xs text-white/30">
            © {new Date().getFullYear()} PulseGuard AI. Research prototype — all rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
