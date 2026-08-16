import { useMemo, useState } from "react";
import { useStore, uid, type MedicalProvider, type MedicalBranch, type MedicalSlot, type Weekday } from "../store";
import { Lock, MapPin, Calendar, Plus, X, Trash2, Wallet, TrendingUp, Stethoscope, FlaskConical, Scissors, ShieldCheck, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";

const WEEKDAYS: { id: Weekday; label: string }[] = [
  { id: "sat", label: "السبت" }, { id: "sun", label: "الأحد" }, { id: "mon", label: "الإثنين" },
  { id: "tue", label: "الثلاثاء" }, { id: "wed", label: "الأربعاء" }, { id: "thu", label: "الخميس" }, { id: "fri", label: "الجمعة" },
];

const SPEC_ICON = { clinic: Stethoscope, lab: FlaskConical, salon: Scissors } as const;
const SPEC_LABEL = { clinic: "عيادة طبية", lab: "معمل تحاليل/أشعة", salon: "صالون تجميل / كوافير" } as const;

export function MedicalApp() {
  const { state, dispatch } = useStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [tab, setTab] = useState<"branches" | "schedule" | "sales">("branches");

  const provider = useMemo(() => state.medicalProviders.find((p) => p.id === activeId) ?? null, [state.medicalProviders, activeId]);

  const login = () => {
    const u = username.trim().toLowerCase();
    const p = state.medicalProviders.find((x) => x.username.toLowerCase() === u && x.password === password);
    if (!p) { setError("بيانات الدخول غير صحيحة أو الحساب غير مفعّل بعد"); return; }
    if (p.status !== "approved") { setError("الحساب بانتظار موافقة غرفة التحكم المركزية"); return; }
    setError(""); setActiveId(p.id);
  };

  if (!provider) {
    return (
      <div dir="rtl" className="max-w-md mx-auto p-6 rounded-2xl bg-card border-2 border-gold shadow-royal space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-gold" />
          <div className="text-lg font-bold">دخول مقدم الخدمة الطبية / التجميلية</div>
        </div>
        <p className="text-xs text-muted-foreground">
          استخدم اسم المستخدم وكلمة المرور التي تم إرسالها إليك من <b className="text-gold">شريك المنطقة</b> بعد اعتماد ملفك من <b className="text-success">غرفة التحكم المركزية</b>.
        </p>
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="اسم المستخدم"
          className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm font-mono" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="كلمة المرور" type="password"
          className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm font-mono" />
        {error && <div className="text-xs text-destructive">{error}</div>}
        <button onClick={login} className="w-full px-4 py-2.5 rounded-xl bg-gradient-royal text-primary-foreground font-bold">دخول</button>
        {state.medicalProviders.length > 0 && (
          <div className="text-[10px] text-muted-foreground pt-2 border-t">
            <div className="font-bold mb-1">حسابات تجريبية معتمدة:</div>
            {state.medicalProviders.filter((p) => p.status === "approved").map((p) => (
              <div key={p.id} className="font-mono">{p.username} / {p.password}</div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const SpecIcon = SPEC_ICON[provider.specialty];
  const bookings = state.medicalBookings.filter((b) => b.providerId === provider.id);
  const totalSales = bookings.reduce((s, b) => s + b.price, 0);
  const commissionDue = Math.round(totalSales * (provider.commissionPct / 100));

  return (
    <div dir="rtl" className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 p-4 rounded-2xl bg-card border-2 border-gold shadow-royal">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-gradient-royal grid place-items-center text-primary-foreground ring-2 ring-gold">
            <SpecIcon className="w-7 h-7" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{SPEC_LABEL[provider.specialty]}</div>
            <div className="text-xl font-bold">{provider.name}</div>
            <div className="text-[11px] text-muted-foreground">{provider.specializationLabel}</div>
          </div>
        </div>
        <button onClick={() => { setActiveId(null); setUsername(""); setPassword(""); }} className="text-xs px-3 py-1.5 rounded-lg bg-secondary font-semibold">خروج</button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat icon={TrendingUp} label="إجمالي الحجوزات" value={String(bookings.length)} />
        <Stat icon={Wallet} label="إجمالي المبيعات (كاش)" value={`${totalSales} ج.م`} />
        <Stat icon={ShieldCheck} label={`عمولة رافا (${provider.commissionPct}%)`} value={`${commissionDue} ج.م`} highlight />
      </div>

      <div className="flex gap-1.5 p-1 rounded-xl bg-secondary">
        {([["branches", "الفروع والمواقع"], ["schedule", "أيام العمل والجدول"], ["sales", "المبيعات والعمولة"]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn("flex-1 px-3 py-1.5 rounded-lg text-xs font-bold", tab === id ? "bg-gradient-royal text-primary-foreground shadow-elegant" : "")}>
            {label}
          </button>
        ))}
      </div>

      {tab === "branches" && <BranchesPanel provider={provider} onPatch={(patch) => dispatch({ type: "patchMedicalProvider", id: provider.id, patch })} />}
      {tab === "schedule" && <SchedulePanel provider={provider} onPatch={(patch) => dispatch({ type: "patchMedicalProvider", id: provider.id, patch })} />}
      {tab === "sales" && <SalesPanel provider={provider} bookings={bookings} onMarkPaid={(id) => dispatch({ type: "markMedicalBookingPaid", id })} />}
    </div>
  );
}

function Stat({ icon: Icon, label, value, highlight }: any) {
  return (
    <div className={cn("p-3 rounded-xl border shadow-card", highlight ? "bg-gradient-gold text-gold-foreground" : "bg-card")}>
      <div className="flex items-center gap-1.5 text-[11px] opacity-80"><Icon className="w-3.5 h-3.5" />{label}</div>
      <div className="text-lg font-bold mt-1">{value}</div>
    </div>
  );
}

function BranchesPanel({ provider, onPatch }: { provider: MedicalProvider; onPatch: (p: Partial<MedicalProvider>) => void }) {
  const [label, setLabel] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [address, setAddress] = useState("");
  const [mapUrl, setMapUrl] = useState("");

  const add = () => {
    if (!label.trim() || !governorate.trim()) return;
    const b: MedicalBranch = { id: uid(), label: label.trim(), governorate: governorate.trim(), address: address.trim(), mapUrl: mapUrl.trim() };
    onPatch({ branches: [...provider.branches, b] });
    setLabel(""); setGovernorate(""); setAddress(""); setMapUrl("");
  };
  const remove = (id: string) => onPatch({
    branches: provider.branches.filter((b) => b.id !== id),
    slots: provider.slots.filter((s) => s.branchId !== id),
  });

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="p-4 rounded-2xl bg-card border shadow-card space-y-3">
        <div className="text-sm font-bold flex items-center gap-2"><Plus className="w-4 h-4 text-gold" />إضافة فرع / موقع جديد</div>
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="اسم الفرع (مثال: عيادة المهندسين)" className="w-full px-3 py-2 rounded-lg border bg-background text-sm" />
        <input value={governorate} onChange={(e) => setGovernorate(e.target.value)} placeholder="المحافظة / المدينة" className="w-full px-3 py-2 rounded-lg border bg-background text-sm" />
        <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="العنوان كتابةً" className="w-full px-3 py-2 rounded-lg border bg-background text-sm" />
        <input value={mapUrl} onChange={(e) => setMapUrl(e.target.value)} placeholder="رابط خرائط جوجل" className="w-full px-3 py-2 rounded-lg border bg-background text-xs font-mono" />
        <button onClick={add} className="w-full px-4 py-2 rounded-xl bg-gradient-royal text-primary-foreground font-bold text-sm">إضافة الفرع</button>
        <p className="text-[10px] text-muted-foreground">يدعم النظام عدة فروع في محافظات مختلفة — مناسب للأطباء المتنقلين والمعامل والصالونات.</p>
      </div>
      <div className="p-4 rounded-2xl bg-card border shadow-card space-y-2">
        <div className="text-sm font-bold">الفروع الحالية ({provider.branches.length})</div>
        {provider.branches.length === 0 && <div className="text-xs text-muted-foreground text-center py-6">لم يتم إضافة أي فروع بعد</div>}
        {provider.branches.map((b) => (
          <div key={b.id} className="p-3 rounded-xl border-2 border-gold/30 bg-secondary/40 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="text-sm font-bold flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-gold" />{b.label}</div>
                <div className="text-[11px] text-muted-foreground">{b.governorate}{b.address ? ` · ${b.address}` : ""}</div>
                {b.mapUrl && <a href={b.mapUrl} target="_blank" rel="noreferrer" className="text-[10px] text-gold underline font-mono break-all">{b.mapUrl}</a>}
              </div>
              <button onClick={() => remove(b.id)} className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SchedulePanel({ provider, onPatch }: { provider: MedicalProvider; onPatch: (p: Partial<MedicalProvider>) => void }) {
  const [branchId, setBranchId] = useState(provider.branches[0]?.id ?? "");
  const [weekday, setWeekday] = useState<Weekday>("sat");
  const [from, setFrom] = useState("10:00");
  const [to, setTo] = useState("14:00");

  const toggleHoliday = (d: Weekday) => {
    const has = provider.weeklyHolidays.includes(d);
    onPatch({ weeklyHolidays: has ? provider.weeklyHolidays.filter((x) => x !== d) : [...provider.weeklyHolidays, d] });
  };

  const addSlot = () => {
    if (!branchId) return;
    const s: MedicalSlot = { id: uid(), branchId, weekday, from, to };
    onPatch({ slots: [...provider.slots, s] });
  };
  const removeSlot = (id: string) => onPatch({ slots: provider.slots.filter((s) => s.id !== id) });

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-card border shadow-card">
        <div className="text-sm font-bold mb-2 flex items-center gap-2"><Calendar className="w-4 h-4 text-gold" />أيام الإجازة الأسبوعية</div>
        <p className="text-[11px] text-muted-foreground mb-3">قم بإيقاف أي يوم من أيام الأسبوع كإجازة — سيتم إخفاؤه فوراً من واجهة العميل.</p>
        <div className="grid grid-cols-7 gap-1.5">
          {WEEKDAYS.map((d) => {
            const off = provider.weeklyHolidays.includes(d.id);
            return (
              <button key={d.id} onClick={() => toggleHoliday(d.id)}
                className={cn("py-2 rounded-lg text-[11px] font-bold border-2 transition-all",
                  off ? "bg-destructive/10 border-destructive/40 text-destructive line-through" : "bg-success/10 border-success/40 text-success")}>
                {d.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-card border shadow-card space-y-3">
          <div className="text-sm font-bold">إضافة موعد عمل (يوم / وقت / فرع)</div>
          {provider.branches.length === 0 ? (
            <div className="text-xs text-destructive">أضف فرعاً واحداً على الأقل قبل جدولة المواعيد.</div>
          ) : (
            <>
              <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
                {provider.branches.map((b) => <option key={b.id} value={b.id}>{b.label} — {b.governorate}</option>)}
              </select>
              <select value={weekday} onChange={(e) => setWeekday(e.target.value as Weekday)} className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
                {WEEKDAYS.filter((d) => !provider.weeklyHolidays.includes(d.id)).map((d) => (
                  <option key={d.id} value={d.id}>{d.label}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[11px] font-semibold">من<input type="time" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full mt-1 px-2 py-1.5 rounded-lg border bg-background text-sm" /></label>
                <label className="text-[11px] font-semibold">إلى<input type="time" value={to} onChange={(e) => setTo(e.target.value)} className="w-full mt-1 px-2 py-1.5 rounded-lg border bg-background text-sm" /></label>
              </div>
              <button onClick={addSlot} className="w-full px-4 py-2 rounded-xl bg-gradient-royal text-primary-foreground font-bold text-sm">إضافة الموعد</button>
              <p className="text-[10px] text-muted-foreground">مثال: السبت في القاهرة، الإثنين في الإسكندرية — يدعم الطبيب المتنقل.</p>
            </>
          )}
        </div>

        <div className="p-4 rounded-2xl bg-card border shadow-card">
          <div className="text-sm font-bold mb-2">الجدول الحالي ({provider.slots.length})</div>
          {provider.slots.length === 0 && <div className="text-xs text-muted-foreground text-center py-6">لم تتم إضافة مواعيد بعد</div>}
          <div className="space-y-1.5 max-h-80 overflow-auto">
            {provider.slots.map((s) => {
              const b = provider.branches.find((x) => x.id === s.branchId);
              const d = WEEKDAYS.find((w) => w.id === s.weekday);
              return (
                <div key={s.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/40 text-xs">
                  <span className="px-2 py-0.5 rounded bg-gold/15 text-gold font-bold">{d?.label}</span>
                  <span className="font-mono">{s.from}–{s.to}</span>
                  <span className="flex-1 truncate font-semibold">{b?.label} · {b?.governorate}</span>
                  <button onClick={() => removeSlot(s.id)} className="p-1 rounded text-destructive hover:bg-destructive/10"><X className="w-3.5 h-3.5" /></button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function SalesPanel({ provider, bookings, onMarkPaid }: { provider: MedicalProvider; bookings: any[]; onMarkPaid: (id: string) => void }) {
  const unpaid = bookings.filter((b) => !b.paid);
  const paid = bookings.filter((b) => b.paid);
  const totalSales = bookings.reduce((s, b) => s + b.price, 0);
  const commissionPaid = paid.reduce((s, b) => s + b.price, 0) * (provider.commissionPct / 100);
  const commissionDue = unpaid.reduce((s, b) => s + b.price, 0) * (provider.commissionPct / 100);

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl border-2 border-gold/60 bg-gradient-to-l from-gold/10 via-card to-success/10 shadow-card">
        <div className="text-xs font-bold text-gold mb-1">💰 جميع الحجوزات: دفع كاش في الموقع</div>
        <div className="text-[11px] text-muted-foreground">يقوم العميل بسداد قيمة الخدمة نقداً عند الزيارة. عمولة رافا ({provider.commissionPct}%) محسوبة على إجمالي مبيعاتك ومستحقة كدين لشركة رافا في نهاية الشهر.</div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat icon={Wallet} label="إجمالي المبيعات" value={`${totalSales} ج.م`} />
        <Stat icon={ShieldCheck} label="عمولة محصلة" value={`${Math.round(commissionPaid)} ج.م`} />
        <Stat icon={KeyRound} label="عمولة مستحقة لرافا" value={`${Math.round(commissionDue)} ج.م`} highlight />
      </div>

      <div className="p-4 rounded-2xl bg-card border shadow-card">
        <div className="text-sm font-bold mb-2">سجل الحجوزات</div>
        {bookings.length === 0 && <div className="text-xs text-muted-foreground text-center py-6">لا توجد حجوزات بعد</div>}
        <div className="space-y-1.5">
          {bookings.map((b) => {
            const branch = provider.branches.find((x) => x.id === b.branchId);
            return (
              <div key={b.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/40 text-xs">
                <div className="flex-1">
                  <div className="font-bold">{b.customerName} · {b.service}</div>
                  <div className="text-[10px] text-muted-foreground">{new Date(b.dateISO).toLocaleString()} · {branch?.label ?? "—"}</div>
                </div>
                <span className="font-mono font-bold">{b.price} ج.م</span>
                {b.paid ? (
                  <span className="px-2 py-0.5 rounded bg-success/15 text-success text-[10px] font-bold">تم الدفع</span>
                ) : (
                  <button onClick={() => onMarkPaid(b.id)} className="px-2 py-0.5 rounded bg-gold text-gold-foreground text-[10px] font-bold">تأكيد القبض</button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}