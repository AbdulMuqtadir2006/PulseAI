import { Suspense, lazy } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { ScrollToTop } from "./components/layout/ScrollToTop";
import { RouteFallback } from "./components/ui/RouteFallback";
import { RequireAuth } from "./components/auth/RequireAuth";
import { SiteAmbient } from "./components/ambient/SiteAmbient";

const Home = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Alerts = lazy(() => import("./pages/Alerts"));
const Voice = lazy(() => import("./pages/Voice"));
const Reports = lazy(() => import("./pages/Reports"));
const SelfCare = lazy(() => import("./pages/SelfCare"));
const ComingSoon = lazy(() => import("./pages/ComingSoon"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));

const gated = (el) => <RequireAuth>{el}</RequireAuth>;

export default function App() {
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/signup";

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-pulse focus:px-5 focus:py-2 focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>
      <SiteAmbient />
      <ScrollToTop />
      {!isAuthPage && <Navbar />}
      <div id="main" className="relative z-10">
        <Suspense fallback={<RouteFallback />}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/dashboard" element={gated(<Dashboard />)} />
              <Route path="/alerts" element={gated(<Alerts />)} />
              <Route path="/voice" element={gated(<Voice />)} />
              <Route path="/report" element={gated(<Reports />)} />
              <Route path="/self-care" element={gated(<SelfCare />)} />
              <Route path="*" element={<ComingSoon />} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </div>
      {!isAuthPage && <Footer />}
    </>
  );
}
