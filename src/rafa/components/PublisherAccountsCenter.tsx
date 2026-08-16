import { useEffect, useState } from "react";
import { KeyRound, UserPlus, Copy, Trash2, ShieldCheck, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  loadPublisherAccounts, savePublisherAccounts, suggestUsername, generatePassword,
  type PublisherAccount, type PublisherKind,
} from "../data/publisherAccounts";

export function PublisherAccountsCenter({ defaultCommission, readOnly = false }: { defaultCommission: number; readOnly?: boolean }) {
  const [list, setList] = useState<PublisherAccount[]>([]);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<PublisherKind>("publisher");
  const [phone, setPhone] = useState("");
  const [iban, setIban] = useState("");
  const [pct, setPct] = useState(defaultCommission);
  const [feat, setFeat] = useState({ digitalLibrary: true, campaigns: true, splitPayments: true });
  const [created, setCreated] = useState<PublisherAccount | null>(null);

  useEffect(() => { setList(loadPublisherAccounts()); }, []);
  useEffect(() => { setPct(defaultCommission); }, [defaultCommission]);

  const persist = (next: PublisherAccount[]) => { setList(next); savePublisherAccounts(next); };

  const generate = () => {
    if (!name.trim()) return;
    const acc: PublisherAccount = {
      id: `pub_${Date.now().toString(36)}`,
      user: suggestUsername(name, kind),
      pass: generatePassword(),
      name: name.trim(),
      kind,
      commissionPct: pct,
      phone: phone.trim() || undefined,
      iban: iban.trim() || undefined,
      features: { ...feat },
      active: true,
      createdAt: Date.now(),
    };
    persist([acc, ...list]);
    setCreated(acc);
    setName(""); setPhone(""); setIban("");
  };

  const copy = (a: PublisherAccount) => {
    try { navigator.clipboard.writeText(`${a.user} / ${a.pass}`); } catch { /* ignore */ }
  };

  return (
    <div className="p-4 rounded-2xl bg-card border-2 border-gold/40 shadow-card space-y-4" dir="rtl">
      <div className="text-sm font-bold flex items-center gap-2">
        <KeyRound className="w-4 h-4 text-gold" /> توليد حسابات الناشرين والمؤلفين
      </div>
      <p className="text-[11px] text-muted-foreground -mt-2">
        العلاقة مباشرة بين المنصة والناشر — لا يمرّ عبر شريك المنطقة. النسبة والخصائص تُربط بالحساب تلقائياً عند التوليد.
      </p>

      {/* Generator form */}
      <div className="grid md:grid-cols-2 gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} disabled={readOnly}
          placeholder="اسم الناشر / المؤلف"
          className="px-3 py-2 rounded-xl border-2 border-gold/25 bg-background text-xs outline-none focus:border-gold" />
        <select value={kind} onChange={(e) => setKind(e.target.value as PublisherKind)} disabled={readOnly}
          className="px-3 py-2 rounded-xl border-2 border-gold/25 bg-background text-xs">
          <option value="publisher">دار نشر</option>
          <option value="author">مؤلف مستقل</option>
        </select>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} disabled={readOnly}
          placeholder="رقم الهاتف (اختياري)"
          className="px-3 py-2 rounded-xl border-2 border-gold/25 bg-background text-xs outline-none focus:border-gold font-mono" />
        <input value={iban} onChange={(e) => setIban(e.target.value)} disabled={readOnly}
          placeholder="IBAN للتسويات (اختياري)"
          className="px-3 py-2 rounded-xl border-2 border-gold/25 bg-background text-xs outline-none focus:border-gold font-mono" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary">
          <span className="text-[11px] font-bold">عمولة المنصة</span>
          <button disabled={readOnly} onClick={() => setPct((v) => Math.max(0, v - 1))}
            className="w-6 h-6 rounded-lg bg-card border text-xs font-bold">−</button>
          <span className="text-xs font-black text-gold w-10 text-center">{pct}%</span>
          <button disabled={readOnly} onClick={() => setPct((v) => Math.min(60, v + 1))}
            className="w-6 h-6 rounded-lg bg-card border text-xs font-bold">+</button>
        </div>
        {([
          ["digitalLibrary", "المكتبة الرقمية"],
          ["campaigns", "الحملات الإعلانية"],
          ["splitPayments", "تقسيم فوري للأرباح"],
        ] as [keyof typeof feat, string][]).map(([k, label]) => (
          <button key={k} disabled={readOnly} onClick={() => setFeat((f) => ({ ...f, [k]: !f[k] }))}
            className={cn("px-2.5 py-1.5 rounded-xl text-[11px] font-bold border-2",
              feat[k] ? "bg-success/15 border-success text-success" : "bg-secondary border-border text-muted-foreground")}>
            {label}
          </button>
        ))}
        <button disabled={readOnly || !name.trim()} onClick={generate}
          className="ms-auto px-3 py-2 rounded-xl bg-gradient-royal text-primary-foreground text-xs font-bold flex items-center gap-1.5 disabled:opacity-40">
          <UserPlus className="w-3.5 h-3.5" /> توليد الحساب
        </button>
      </div>

      {created && (
        <div className="p-3 rounded-xl border-2 border-success/50 bg-success/10 text-xs space-y-1">
          <div className="font-bold flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> تم توليد بيانات الدخول — سلّمها للناشر</div>
          <div className="font-mono">اسم المستخدم: <b>{created.user}</b> · كلمة المرور: <b>{created.pass}</b></div>
        </div>
      )}

      {/* Existing accounts */}
      {list.length === 0 ? (
        <div className="text-center text-[11px] text-muted-foreground py-4">لا توجد حسابات ناشرين بعد</div>
      ) : (
        <div className="space-y-2">
          {list.map((a) => (
            <div key={a.id} className={cn("p-3 rounded-xl border bg-secondary/30 flex flex-wrap items-center gap-2",
              !a.active && "opacity-60")}>
              <BookOpen className="w-4 h-4 text-gold" />
              <div className="flex-1 min-w-[160px]">
                <div className="text-xs font-bold">{a.name} <span className="text-[10px] text-muted-foreground">· {a.kind === "author" ? "مؤلف" : "دار نشر"}</span></div>
                <div className="text-[10px] text-muted-foreground font-mono">{a.user} / {a.pass}{a.iban ? ` · ${a.iban}` : ""}</div>
                <div className="text-[10px] text-emerald-700">عمولة {a.commissionPct}% · {[a.features.digitalLibrary && "مكتبة", a.features.campaigns && "حملات", a.features.splitPayments && "تقسيم فوري"].filter(Boolean).join(" · ")}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => copy(a)} className="px-2 py-1 rounded-lg bg-card border text-[10px] font-bold flex items-center gap-1"><Copy className="w-3 h-3" />نسخ</button>
                <button disabled={readOnly} onClick={() => persist(list.map((x) => x.id === a.id ? { ...x, active: !x.active } : x))}
                  className={cn("px-2 py-1 rounded-lg text-[10px] font-bold border",
                    a.active ? "bg-success/15 border-success text-success" : "bg-secondary border-border text-muted-foreground")}>
                  {a.active ? "مفعّل" : "موقوف"}
                </button>
                <button disabled={readOnly} onClick={() => persist(list.filter((x) => x.id !== a.id))}
                  className="px-2 py-1 rounded-lg bg-destructive/10 text-destructive text-[10px] font-bold flex items-center gap-1"><Trash2 className="w-3 h-3" />حذف</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
