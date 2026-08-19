import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useI18n, type Lang } from "../i18n";
import { useStore } from "../store";
import { Languages, LogOut, Moon, Sun } from "lucide-react";
import { SOSButton } from "./SOSButton";
import { AlertOverlay } from "./AlertOverlay";
import { RavaLogo } from "./RavaLogo";

export type Role = "customer" | "merchant" | "captain" | "partner" | "admin" | "medical";

export function Shell({ role, roleLabel, children }: { role: Role; roleLabel: string; children: ReactNode }) {
  const { t, lang, setLang, dir } = useI18n();
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
      <header className="glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          <RavaLogo size={40} />
          <div className="ms-auto flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1.5 rounded-lg bg-card border border-gold/40 text-xs font-bold flex items-center gap-1.5">
              <span className="text-base leading-none">{country.flag}</span><span>{country.currency}</span>
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-gradient-royal text-primary-foreground text-xs font-bold">{roleLabel}</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setLang((lang === "en" ? "ar" : "en") as Lang)} title={t("language")}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-secondary hover:bg-accent/30 transition-colors flex items-center gap-1.5 border border-[color-mix(in_oklab,var(--color-gold)_30%,transparent)]">
              <Languages className="w-3.5 h-3.5" />{lang === "en" ? "العربية" : "English"}
            </button>
            <button onClick={() => setDark((d) => !d)} title={t("theme")}
              className="p-2 rounded-lg bg-secondary hover:bg-accent/30 transition-colors border border-[color-mix(in_oklab,var(--color-gold)_30%,transparent)]">
              {dark ? <Sun className="w-4 h-4 text-gold" /> : <Moon className="w-4 h-4 text-primary" />}
            </button>
            <button onClick={exitToLogin} title={lang === "ar" ? "تسجيل الخروج" : "Log out"}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors flex items-center gap-1.5 border border-destructive/30">
              <LogOut className="w-3.5 h-3.5" />{lang === "ar" ? "خروج" : "Log out"}
            </button>

          </div>
        </div>
        <div className="gold-divider" />
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">{children}</main>

      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        <span className="bg-gradient-royal bg-clip-text text-transparent font-semibold">RAVA Super App</span> · {new Date().getFullYear()}
      </footer>

      {role === "customer" && <SOSButton />}
      {hasMerchantAlert && <AlertOverlay />}
    </div>
  );
}
