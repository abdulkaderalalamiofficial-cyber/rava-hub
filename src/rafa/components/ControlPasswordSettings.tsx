import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { KeyRound, Check, AlertTriangle } from "lucide-react";
import { updateControlPassword } from "@/lib/control-room.functions";

export function ControlPasswordSettings() {
  const update = useServerFn(updateControlPassword);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const r = await update({ data: { currentPassword: current, newPassword: next } });
      if (r.ok) {
        setMsg({ ok: true, text: "تم تحديث كلمة مرور غرفة التحكم بنجاح." });
        setCurrent("");
        setNext("");
      } else {
        setMsg({ ok: false, text: "كلمة المرور الحالية غير صحيحة." });
      }
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "تعذر تحديث كلمة المرور." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="bg-card border-2 border-border rounded-2xl p-5 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-royal grid place-items-center text-primary-foreground ring-2 ring-gold">
          <KeyRound className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-black text-sm">إعدادات الأمان · كلمة مرور غرفة التحكم</h3>
          <p className="text-[11px] text-muted-foreground">غيّر كلمة المرور في أي وقت — تُحفظ مشفّرة في قاعدة البيانات.</p>
        </div>
      </div>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-bold mb-1.5 block">كلمة المرور الحالية</label>
          <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required
            className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background text-sm focus:border-gold focus:outline-none" />
        </div>
        <div>
          <label className="text-xs font-bold mb-1.5 block">كلمة المرور الجديدة (8 أحرف على الأقل)</label>
          <input type="password" value={next} onChange={(e) => setNext(e.target.value)} required minLength={8} maxLength={200}
            className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background text-sm focus:border-gold focus:outline-none" />
        </div>
        <div className="sm:col-span-2 flex items-center gap-3 flex-wrap">
          <button type="submit" disabled={busy}
            className="px-5 py-2.5 rounded-xl bg-gradient-royal text-primary-foreground font-bold text-sm shadow-royal disabled:opacity-50">
            {busy ? "جارٍ التحديث..." : "تحديث"}
          </button>
          {msg && (
            <span className={`text-xs font-semibold flex items-center gap-1.5 ${msg.ok ? "text-primary" : "text-destructive"}`}>
              {msg.ok ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {msg.text}
            </span>
          )}
        </div>
      </form>
    </section>
  );
}
