import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, LogOut, LogIn } from "lucide-react";
import { navLinks } from "./navLinks";
import { Wordmark } from "../ui/Wordmark";
import { useAuth } from "../../auth/AuthContext";

const EASE = [0.16, 1, 0.3, 1];

function AuthControl() {
  const { user, logout } = useAuth();
  const idle = "border-white/20 text-white/80 hover:border-teal/50 hover:text-white";
  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden text-sm font-medium text-white/70 lg:inline">
          Hi, {user.name?.split(" ")[0] || user.email}
        </span>
        <button
          type="button"
          onClick={logout}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors duration-200 ${idle}`}
        >
          <LogOut size={15} /> Log out
        </button>
      </div>
    );
  }
  return (
    <Link
      to="/login"
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors duration-200 ${idle}`}
    >
      <LogIn size={15} /> Log in
    </Link>
  );
}

function DesktopLinks() {
  return (
    <ul className="relative hidden items-center gap-1 md:flex">
      {navLinks.map((link) => (
        <li key={link.to} className="relative">
          <NavLink
            to={link.to}
            end={link.to === "/"}
            className={({ isActive }) =>
              `relative inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                isActive ? "text-white" : "text-white/70"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-white/10"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                {link.label}
              </>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

export function Navbar() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b pt-safe transition-colors duration-300 ease-expo ${
          scrolled ? "border-white/10 bg-ink/70 backdrop-blur-md" : "border-transparent bg-transparent"
        }`}
      >
        <nav className="container-page flex h-16 items-center justify-between">
          <Link to="/" aria-label="PulseGuard AI home" className="shrink-0">
            <Wordmark />
          </Link>

          <div className="flex items-center gap-3">
            <DesktopLinks />
            <div className="hidden items-center gap-3 md:flex">
              <AuthControl />
            </div>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full text-white md:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col bg-ink/95 pb-safe pt-safe backdrop-blur-2xl md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="mt-16 flex flex-1 flex-col justify-center gap-1 px-8">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ delay: 0.06 * i + 0.05, duration: 0.4, ease: EASE }}
                >
                  <NavLink
                    to={link.to}
                    end={link.to === "/"}
                    className={({ isActive }) =>
                      `block border-b border-white/10 py-4 font-display text-3xl font-semibold transition-colors ${
                        isActive ? "text-teal" : "text-white/90"
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                </motion.div>
              ))}
              <div className="mt-8 flex items-center gap-3">
                <AuthControl />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
