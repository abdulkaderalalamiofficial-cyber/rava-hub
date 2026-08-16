import { useState } from "react";
import { useI18n } from "../i18n";
import { useStore, type CaptainFleet } from "../store";
import { Compass, Lock, ArrowRight, ShieldCheck } from "lucide-react";

const PREFIX_TO_FLEET: Record<string, CaptainFleet> = {
  MOTO: "tayar",
  TRIC: "cargo",
  TRUCK: "cargo",
  DABA: "cargo",
  WINSH: "winsh",
  WNSH: "winsh",
  CAR: "captain",
  TUK: "captain",
  VIP: "captain",
};

const FLEET_LABEL_AR: Record<CaptainFleet, string> = {
  tayar: "تطبيق التوصيل السريع (مأكولات · صيدلية · طلبات عاجلة)",
  captain: "تطبيق رحلات الركاب",
  cargo: "تطبيق الشحن والبضائع الثقيلة",
  winsh: "تطبيق الإنقاذ والونش",
};

export function CaptainLogin({ onSuccess }: { onSuccess: (fleet: CaptainFleet) => void }) {
  const { lang } = useI18n();
  const { state } = useStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [resolved, setResolved] = useState<{ fleet: CaptainFleet; label: string; code: string } | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const code = username.trim().toUpperCase();
    if (!code || !password) {
      setError(lang === "ar" ? "يرجى إدخال الكود وكلمة المرور" : "Enter your code and password");
      return;
    }
    // Try driver prefix match first
    const driver = state.drivers.find((d) => d.prefix?.toUpperCase() === code);
    let fleet: CaptainFleet | undefined;
    if (driver) {
      fleet = driver.fleet;
    } else {
      const prefix = code.split("-")[0];
      fleet = PREFIX_TO_FLEET[prefix];
    }
    if (!fleet) {
      setError(lang === "ar"
        ? "كود غير معروف. الصيغة: MOTO-XXXX · TRIC-XXXX · TRUCK-XXXX · WINSH-XXXX"
        : "Unknown code. Format: MOTO-XXXX · TRIC-XXXX · TRUCK-XXXX · WINSH-XXXX");
      return;
    }
    setResolved({ fleet, label: FLEET_LABEL_AR[fleet], code });
    setTimeout(() => onSuccess(fleet!), 900);
  };

  return (
    <div className="min-h-screen bg-metallic relative overflow-hidden flex items-center justify-center px-5 py-10">
      <div className="absolute inset-0 opacity-30 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(ellipse at top, #046A38 0%, transparent 55%), radial-gradient(ellipse at bottom right, #D4AF37 0%, transparent 50%)" }} />
      <div className="relative w-full max-w-md">

        <div className="bg-card/95 backdrop-blur-md border-2 border-border rounded-3xl shadow-elegant p-7 ring-1 ring-gold/20">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-royal grid place-items-center text-primary-foreground shadow-royal ring-2 ring-gold">
              <Compass className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black mt-3">{lang === "ar" ? "تطبيق كابتن رافا الموحد" : "RAVA Unified Captain"}</h1>
            <p className="text-xs text-muted-foreground mt-1">
              {lang === "ar" ? "بوابة دخول واحدة لكل فئات الكباتن" : "Single sign-in for all captain tiers"}
            </p>
          </div>

          {!resolved ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-bold mb-1.5 block">
                  {lang === "ar" ? "كود الكابتن / اسم المستخدم" : "Captain code / Username"}
                </label>
                <input value={username} onChange={(e) => setUsername(e.target.value)}
                  placeholder="MOTO-1234"
                  className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background text-sm font-mono uppercase tracking-wider focus:border-gold focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold mb-1.5 block">
                  {lang === "ar" ? "كلمة المرور" : "Password"}
                </label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background text-sm focus:border-gold focus:outline-none" />
              </div>
              {error && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/40 text-destructive text-xs font-semibold">
                  {error}
                </div>
              )}
              <button type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-royal text-primary-foreground font-bold text-sm shadow-royal flex items-center justify-center gap-2 hover:opacity-95">
                <Lock className="w-4 h-4" /> {lang === "ar" ? "دخول آمن" : "Secure Login"} <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-3 border-t border-border">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">
                  {lang === "ar" ? "محرك التوجيه التلقائي" : "Auto-routing engine"}
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  {[
                    { p: "MOTO-XXXX", l: lang === "ar" ? "توصيل سريع" : "Express delivery" },
                    { p: "TRIC-XXXX", l: lang === "ar" ? "بضائع خفيفة" : "Light cargo" },
                    { p: "TRUCK-XXXX", l: lang === "ar" ? "شحن ثقيل" : "Heavy transport" },
                    { p: "WINSH-XXXX", l: lang === "ar" ? "إنقاذ وونش" : "Rescue & towing" },
                    { p: "VIP-XXXX", l: lang === "ar" ? "نقل ركاب VIP بين المدن" : "VIP intercity passenger" },
                  ].map((x) => (
                    <div key={x.p} className="p-2 rounded-lg bg-emerald-900/5 border border-emerald-900/15">
                      <div className="font-mono font-bold text-emerald-900">{x.p}</div>
                      <div className="text-muted-foreground">{x.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-3 text-center py-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-success/15 border-2 border-success grid place-items-center">
                <ShieldCheck className="w-7 h-7 text-success" />
              </div>
              <div className="text-sm font-bold">{lang === "ar" ? "تم التحقق · جارٍ التوجيه..." : "Verified · Routing..."}</div>
              <div className="font-mono text-xs px-3 py-1.5 rounded-md bg-gold/15 text-gold inline-block font-bold">{resolved.code}</div>
              <div className="text-xs text-muted-foreground">{lang === "ar" ? resolved.label : resolved.fleet}</div>
            </div>
          )}
        </div>

        <p className="text-center text-[10px] text-muted-foreground mt-4">
          {lang === "ar" ? "النظام يحدد مساحة العمل تلقائياً بناءً على نوع الكود" : "Workspace auto-selected based on code prefix"}
        </p>
      </div>
    </div>
  );
}
