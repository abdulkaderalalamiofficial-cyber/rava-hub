import { useState } from "react";
import { useI18n } from "../i18n";
import { useStore } from "../store";
import { RavaLogo } from "../components/RavaLogo";
import type { Role } from "../components/Shell";
import { Users, Store, Building2, ShieldCheck, ArrowRight, Globe, Lock, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

export type GatewayRole = Role | "captainUnified";

const mainRoles: { id: GatewayRole; titleAr: string; titleEn: string; descAr: string; descEn: string; icon: any; tone: string }[] = [
  { id: "customer", titleAr: "العميل", titleEn: "Customer", descAr: "اطلب رحلة أو توصيل فوري", descEn: "Order a ride or instant delivery", icon: Users, tone: "bg-gradient-royal" },
  { id: "merchant", titleAr: "التاجر", titleEn: "Merchant", descAr: "إدارة المتجر والطلبات", descEn: "Manage your store & orders", icon: Store, tone: "bg-gradient-gold" },
  { id: "medical", titleAr: "مقدم الخدمة الطبية والتجميلية", titleEn: "Medical & Aesthetic Provider", descAr: "إدارة العيادات، معامل التحاليل، وصالونات التجميل", descEn: "Manage clinics, labs and beauty salons", icon: ShieldCheck, tone: "bg-gradient-royal" },
  { id: "captainUnified", titleAr: "تطبيق كابتن رافا الموحد", titleEn: "RAVA Unified Captain App", descAr: "بوابة واحدة لكل فئات الكباتن (موتو · تروسيكل · شاحنات · ونش)", descEn: "Single portal for all captain tiers (Moto · Tric · Truck · Winsh)", icon: Compass, tone: "bg-gradient-royal" },
  { id: "partner", titleAr: "شريك المنطقة", titleEn: "Zone Partner", descAr: "إدارة نطاق الامتياز", descEn: "Manage your franchise zone", icon: Building2, tone: "bg-gradient-gold" },
];

export function Gateway({ onEnter }: { onEnter: (countryCode: string, role: GatewayRole) => void }) {
  const { t, lang, setLang } = useI18n();
  const { state, dispatch } = useStore();
  const [role, setRole] = useState<GatewayRole | null>(null);
  const country = state.countries.find((c) => c.code === state.activeCountryCode) ?? state.countries[0];

  const enter = () => {
    if (!role) return;
    dispatch({ type: "setActiveCountry", code: country.code });
    onEnter(country.code, role);
  };

  const enterAs = (r: GatewayRole) => {
    dispatch({ type: "setActiveCountry", code: country.code });
    onEnter(country.code, r);
  };

  return (
    <div className="min-h-screen bg-metallic relative overflow-hidden">
      <div className="absolute inset-0 opacity-30 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(ellipse at top, #046A38 0%, transparent 55%), radial-gradient(ellipse at bottom right, #D4AF37 0%, transparent 50%)" }} />
      <div className="relative max-w-5xl mx-auto px-5 py-10 pb-28">
        <header className="flex items-center justify-between mb-8">
          <RavaLogo size={56} />
          <button onClick={() => setLang(lang === "en" ? "ar" : "en")}
            className="px-3 py-1.5 rounded-lg bg-card border border-gold text-xs font-bold flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-gold" /> {lang === "en" ? "العربية" : "English"}
          </button>
        </header>

        <div className="text-center mb-8">
          <div className="text-xs uppercase tracking-[0.4em] text-muted-foreground font-bold">{t("welcomeTo")}</div>
          <h1 className="text-4xl font-black mt-2"><span className="text-gold-3d">RAVA</span> <span className="text-foreground">Super App</span></h1>
          <div className="text-xs text-muted-foreground mt-2">{t("tagline")}</div>
        </div>

        <section className="mb-7">
          <div className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-3">{t("selectRole")}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {mainRoles.map((r) => {
              const Icon = r.icon;
              const active = role === r.id;
              const isUnified = r.id === "captainUnified";
              return (
                <button key={r.id} onClick={() => setRole(r.id)}
                  className={cn("p-5 rounded-2xl border-2 text-start transition-all relative overflow-hidden group",
                    "bg-card/90 backdrop-blur-sm hover:-translate-y-0.5 hover:shadow-elegant focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]",
                    active ? "border-gold shadow-royal scale-[1.01] ring-2 ring-[var(--color-gold)]" : "border-border hover:border-gold/60",
                    isUnified && "sm:col-span-2 bg-gradient-to-br from-white via-white to-emerald-50/40 border-emerald-900/20")}>
                  <div className="flex items-center gap-3">
                    <div className={cn("w-12 h-12 rounded-xl grid place-items-center text-primary-foreground shadow-card", r.tone, isUnified && "w-14 h-14 ring-2 ring-gold")}>
                      <Icon className={cn("w-5 h-5", isUnified && "w-7 h-7")} />
                    </div>
                    <div className="flex-1">
                      <div className={cn("font-bold", isUnified ? "text-lg" : "text-sm")}>{lang === "ar" ? r.titleAr : r.titleEn}</div>
                      <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">{lang === "ar" ? r.descAr : r.descEn}</div>
                    </div>
                    {isUnified && <span className="px-2 py-1 rounded-full bg-gold/20 text-gold text-[10px] font-bold border border-gold/40">UNIFIED</span>}
                  </div>
                  {isUnified && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {["MOTO","TRIC","TRUCK","WINSH"].map((p) => (
                        <span key={p} className="px-2 py-0.5 rounded-md bg-emerald-900/5 text-emerald-900 text-[10px] font-mono font-bold border border-emerald-900/15">{p}-XXXX</span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <button onClick={enter} disabled={!role}
          className="w-full py-4 rounded-2xl bg-gradient-royal text-primary-foreground font-bold text-base shadow-royal flex items-center justify-center gap-3 disabled:opacity-40">
          {t("enterApp")} · {country.flag} {lang === "ar" ? country.nameAr : country.name} <ArrowRight className="w-5 h-5" />
        </button>

        <footer className="text-center text-[10px] text-muted-foreground mt-8">
          © {new Date().getFullYear()} RAVA Super App · Multi-tenant Global Edition
        </footer>

        <div className="fixed bottom-0 inset-x-0 z-30 border-t border-border bg-card/95 backdrop-blur-md shadow-elegant">
          <div className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <Lock className="w-3.5 h-3.5 text-gold" />
              <span className="font-bold text-foreground">{lang === "ar" ? "منطقة آمنة" : "Secured Area"}</span>
              <span className="text-muted-foreground hidden sm:inline">· {lang === "ar" ? "للإدارة المركزية فقط" : "Central management only"}</span>
            </div>
            <button onClick={() => enterAs("admin")}
              className="px-4 py-2 rounded-xl bg-gradient-royal text-primary-foreground text-xs font-bold flex items-center gap-2 shadow-royal hover:opacity-90">
              <ShieldCheck className="w-4 h-4" /> {lang === "ar" ? "غرفة التحكم المركزية" : "Central Control Room"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
