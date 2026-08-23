import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useI18n } from "../i18n";
import { useStore } from "../store";
import { SOSButton } from "./SOSButton";
import { AlertOverlay } from "./AlertOverlay";
import { RavaLogo } from "./RavaLogo";
import { ProfileSheet } from "./ProfileSheet";

export type Role = "customer" | "merchant" | "captain" | "partner" | "admin" | "medical";

export function Shell({ role, roleLabel, children }: { role: Role; roleLabel: string; children: ReactNode }) {
  const { dir } = useI18n();
  const { state } = useStore();
  const navigate = useNavigate();
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const prefersDark = typeof matchMedia !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(prefersDark);
  }, []);
  useEffect(() => { document.documentElement.classList.toggle("dark", dark); }, [dark]);

  // Navigation guard: leaving a role app (logout or browser back) always lands
  // on the clean /login page — never on another role's screen.
  const exitToLogin = useCallback(() => {
    try {
      sessionStorage.removeItem("rava_control_unlocked");
    } catch {
      /* ignore */
    }
    void navigate({ to: "/login", replace: true });
  }, [navigate]);

  useEffect(() => {
    const onPop = () => exitToLogin();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [exitToLogin]);

  const hasMerchantAlert = role === "merchant" && state.orders.some((o) => o.status === "pending" || o.status === "accepted");
  const country = state.countries.find((c) => c.code === state.activeCountryCode) ?? state.countries[0];


  return (
    <div dir={dir} className="min-h-screen flex flex-col relative">
      <header className="glass sticky top-0 z-50 rounded-b-3xl">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-4 flex items-center gap-4 flex-wrap">
          <RavaLogo size={40} />
          <div className="ms-auto flex items-center gap-2.5 flex-wrap">
            <span className="px-3.5 py-2 rounded-full bg-card/80 border border-gold/40 text-xs font-bold flex items-center gap-2 shadow-card">
              <span className="text-base leading-none">{country.flag}</span><span>{country.currency}</span>
            </span>
            <span className="px-4 py-2 rounded-full bg-gradient-royal text-primary-foreground text-xs font-bold tracking-wide shadow-elegant">{roleLabel}</span>
            <ProfileSheet role={role} roleLabel={roleLabel} dark={dark} setDark={setDark} onLogout={exitToLogin} />
          </div>
        </div>
        <div className="gold-divider" />
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-5 sm:px-8 py-8 space-y-6">{children}</main>

      <footer className="border-t py-6 text-center text-xs tracking-wide text-muted-foreground">
        <span className="bg-gradient-royal bg-clip-text text-transparent font-semibold">RAVA Super App</span> · {new Date().getFullYear()}
      </footer>

      {role === "customer" && <SOSButton />}
      {hasMerchantAlert && <AlertOverlay />}
    </div>
  );
}
