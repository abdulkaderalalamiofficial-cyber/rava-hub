import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useI18n } from "../i18n";
import { Globe, LogOut, Moon, Sun, User } from "lucide-react";
import type { Role } from "./Shell";

/**
 * Profile / settings panel.
 * Logout lives here only — it is intentionally absent from the global chrome.
 */
export function ProfileSheet({
  role,
  roleLabel,
  dark,
  setDark,
  onLogout,
}: {
  role: Role;
  roleLabel: string;
  dark: boolean;
  setDark: (fn: (d: boolean) => boolean) => void;
  onLogout: () => void;
}) {
  const { lang, dir } = useI18n();
  const ar = lang === "ar";

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          aria-label={ar ? "الحساب والإعدادات" : "Profile & settings"}
          className="h-10 w-10 rounded-full grid place-items-center bg-gradient-royal text-primary-foreground shadow-elegant ring-1 ring-[color-mix(in_oklab,var(--color-gold)_45%,transparent)] transition-transform hover:scale-105 active:scale-95"
        >
          <User className="w-[18px] h-[18px]" />
        </button>
      </SheetTrigger>
      <SheetContent side={dir === "rtl" ? "left" : "right"} className="w-[21rem] max-w-[90vw] p-0">
        <div dir={dir} className="flex h-full flex-col">
          <SheetHeader className="px-6 pt-6 pb-4">
            <SheetTitle className="text-lg font-black tracking-tight">
              {ar ? "الحساب والإعدادات" : "Profile & settings"}
            </SheetTitle>
          </SheetHeader>

          <div className="px-6 pb-6 flex flex-col gap-4 overflow-y-auto">
            <div className="rounded-3xl p-5 bg-gradient-surface border border-[color-mix(in_oklab,var(--color-gold)_25%,transparent)] shadow-card">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl grid place-items-center bg-gradient-royal text-primary-foreground">
                  <User className="w-5 h-5" />
                </div>
                <div className="leading-tight">
                  <div className="font-black text-base">{roleLabel}</div>
                  <div className="text-xs text-muted-foreground font-medium">RAVA · {role}</div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border bg-card shadow-card divide-y">
              <div className="flex items-center justify-between gap-3 px-5 py-4">
                <div className="flex items-center gap-3 text-sm font-semibold">
                  <Globe className="w-4 h-4 text-primary" />
                  {ar ? "لغة الجهاز" : "Device language"}
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold chip-silver">
                  {ar ? "العربية" : "English"}
                </span>
              </div>
              <button
                onClick={() => setDark((d) => !d)}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-accent/10"
              >
                <span className="flex items-center gap-3 text-sm font-semibold">
                  {dark ? <Sun className="w-4 h-4 text-gold" /> : <Moon className="w-4 h-4 text-primary" />}
                  {ar ? "المظهر" : "Appearance"}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold chip-silver">
                  {dark ? (ar ? "داكن" : "Dark") : ar ? "فاتح" : "Light"}
                </span>
              </button>
            </div>

            <button
              onClick={onLogout}
              className="w-full rounded-2xl px-5 py-4 text-sm font-black bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              {ar ? "تسجيل الخروج" : "Log out"}
            </button>

            <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
              {ar
                ? "تتغير لغة التطبيق تلقائيًا حسب إعدادات هاتفك."
                : "App language follows your device settings automatically."}
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
