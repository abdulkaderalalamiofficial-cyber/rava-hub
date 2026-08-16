import { useEffect, useRef, useState } from "react";
import { useI18n } from "../i18n";
import { ShieldCheck, Lock, ArrowRight, AlertTriangle } from "lucide-react";
import { RavaLogo } from "./RavaLogo";

const CONTROL_PASSWORD = "Abdou1996";
const STORAGE_KEY = "rava_control_unlocked";
const MAX_ATTEMPTS = 5;
const LOCK_SECONDS = 60;

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [lockLeft, setLockLeft] = useState(0);
  const lockTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const locked = lockLeft > 0;
  const remaining = Math.max(0, MAX_ATTEMPTS - attempts);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") setUnlocked(true);
    } catch {
      /* ignore */
    }
  }, []);

  const startLock = () => {
    setLockLeft(LOCK_SECONDS);
    if (lockTimer.current) clearInterval(lockTimer.current);
    lockTimer.current = setInterval(() => {
      setLockLeft((s) => {
        if (s <= 1) {
          if (lockTimer.current) clearInterval(lockTimer.current);
          setAttempts(0);
          setError(null);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  useEffect(() => () => { if (lockTimer.current) clearInterval(lockTimer.current); }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) return;
    if (password === CONTROL_PASSWORD) {
      try {
        sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* ignore */
      }
      setError(null);
      setAttempts(0);
      setUnlocked(true);
      return;
    }
    const next = attempts + 1;
    setAttempts(next);
    setPassword("");
    if (next >= MAX_ATTEMPTS) {
      startLock();
      setError(
        ar
          ? `تجاوزت عدد المحاولات المسموح بها. تم القفل مؤقتًا لمدة ${LOCK_SECONDS} ثانية.`
          : `Too many attempts. Locked for ${LOCK_SECONDS} seconds.`,
      );
    } else {
      const left = MAX_ATTEMPTS - next;
      setError(
        ar
          ? `كلمة المرور غير صحيحة. المحاولات المتبقية: ${left}`
          : `Incorrect password. ${left} attempt(s) left.`,
      );
    }
  };


  if (unlocked) return <>{children}</>;

  return (
    <div className="min-h-screen bg-metallic relative overflow-hidden flex items-center justify-center px-5 py-10">
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at top, #046A38 0%, transparent 55%), radial-gradient(ellipse at bottom right, #D4AF37 0%, transparent 50%)",
        }}
      />
      <div className="relative w-full max-w-md">
        <div className="flex justify-center mb-5">
          <RavaLogo size={56} />
        </div>
        <div className="bg-card/95 backdrop-blur-md border-2 border-border rounded-3xl shadow-elegant p-7 ring-1 ring-gold/20">
          <div className="text-center mb-5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-royal grid place-items-center text-primary-foreground shadow-royal ring-2 ring-gold">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-black mt-3">
              {lang === "ar" ? "غرفة التحكم المركزية" : "Central Control Room"}
            </h1>
            <p className="text-[11px] text-muted-foreground mt-1">
              {lang === "ar"
                ? "أدخل كلمة المرور للدخول"
                : "Enter the password to continue"}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="text-xs font-bold mb-1.5 block">
                {ar ? "كلمة المرور" : "Password"}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                disabled={locked}
                className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background text-sm focus:border-gold focus:outline-none disabled:opacity-50"
              />
            </div>
            {error && (
              <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/40 text-destructive text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {locked && (
              <div className="p-2.5 rounded-lg bg-gold/10 border border-gold/40 text-xs font-bold text-center">
                {ar ? `يمكنك المحاولة مجددًا خلال ${lockLeft} ثانية` : `Try again in ${lockLeft}s`}
              </div>
            )}
            {!locked && attempts > 0 && (
              <div className="text-[11px] text-muted-foreground text-center font-semibold">
                {ar ? `المحاولات المتبقية: ${remaining}` : `${remaining} attempt(s) remaining`}
              </div>
            )}
            <button
              type="submit"
              disabled={locked}
              className="w-full py-3 rounded-xl bg-gradient-royal text-primary-foreground font-bold text-sm shadow-royal flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              {locked ? (ar ? "مقفل مؤقتًا" : "Locked") : ar ? "دخول" : "Enter"}
              {!locked && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
