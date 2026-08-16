import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "../i18n";
import { useStore, uid, type VehicleType, type ServiceType, type PartnerApplication, type MedicalSpecialty } from "../store";
import { UserPlus, Store, TrendingUp, Wallet, MapPin, Inbox, FileText, Lock, KeyRound, ShieldAlert, Upload, ChevronDown, Stethoscope, ClipboardList, CheckCircle2, XCircle, Clock } from "lucide-react";
import { AlertOverlay } from "../components/AlertOverlay";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export function PartnerApp() {
  const { t } = useI18n();
  const { state, dispatch } = useStore();
  const [nid, setNid] = useState("29101011234567");
  const [submittedNid, setSubmittedNid] = useState<string | null>("29101011234567");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"overview" | "submissions" | "inbox" | "ledger" | "audit">("overview");
  const [toast, setToast] = useState<string>("");
  const [flash, setFlash] = useState<{ kind: "approved" | "rejected"; name: string; role: string } | null>(null);

  const partner = useMemo(() => state.zonePartners.find((p) => p.nationalId === submittedNid) ?? null, [state.zonePartners, submittedNid]);

  const login = () => {
    if (!/^\d{14}$/.test(nid)) { setError(t("invalidNid")); return; }
    const p = state.zonePartners.find((p) => p.nationalId === nid);
    if (!p) { setError(t("notFound")); return; }
    setError(""); setSubmittedNid(nid);
  };

  if (!partner) {
    return (
      <div className="max-w-md mx-auto p-6 rounded-2xl bg-card border-2 border-gold shadow-royal">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="w-5 h-5 text-gold" />
          <div className="text-lg font-bold">{t("partnerLogin")}</div>
        </div>
        <p className="text-xs text-muted-foreground mb-4">{t("enterNid")}</p>
        <input value={nid} onChange={(e) => setNid(e.target.value.replace(/\D/g, "").slice(0, 14))}
          className="w-full px-3 py-2 rounded-lg border bg-background text-sm tracking-widest font-mono" placeholder="14 digits" />
        {error && <div className="mt-2 text-xs text-destructive">{error}</div>}
        <button onClick={login} className="mt-3 w-full px-4 py-2.5 rounded-xl bg-gradient-royal text-primary-foreground font-bold">{t("submit")}</button>
        <div className="mt-4 text-[10px] text-muted-foreground">Demo IDs: 29101011234567 (Shubra) · 28505121234567 (Maadi) · 29201011234567 (Heliopolis)</div>
      </div>
    );
  }

  const zone = partner.zone;
  const drivers = state.drivers.filter((d) => d.zone === zone);
  const merchants = state.merchants.filter((m) => m.zone === zone);
  const earnings = state.walletPartner[zone] ?? 0;
  const zoneOrders = state.orders.filter((o) => o.zone === zone);
  const inbox = state.partnerInbox[partner.nationalId] ?? [];
  const audit = state.logs.filter((l) => l.zone === zone);
  const mySubmissions = useMemo(
    () => state.partnerApplications.filter((a) => a.partnerNid === partner.nationalId),
    [state.partnerApplications, partner.nationalId],
  );

  // Real-time flash when Admin changes status of any of my submissions
  const prevStatusRef = useRef<Record<string, PartnerApplication["status"]>>({});
  useEffect(() => {
    const prev = prevStatusRef.current;
    let changed: PartnerApplication | null = null;
    for (const a of mySubmissions) {
      const before = prev[a.id];
      if (before && before === "pending" && a.status !== "pending") {
        changed = a;
        break;
      }
    }
    const next: Record<string, PartnerApplication["status"]> = {};
    mySubmissions.forEach((a) => { next[a.id] = a.status; });
    prevStatusRef.current = next;
    if (changed) {
      setFlash({ kind: changed.status as "approved" | "rejected", name: changed.name, role: changed.kind });
      setTab("submissions");
      const t = setTimeout(() => setFlash(null), 3500);
      return () => clearTimeout(t);
    }
  }, [mySubmissions]);

  // Realtime: subscribe to Postgres changes on partner_applications + medical_bookings
  // so Admin status changes (approve / reject) flash instantly in the Partner UI
  // without a manual reload. We match incoming DB rows back to local store
  // entries by (partnerNid + kind + name) and replay the decision through the
  // existing reducer so the badge + flash effect both fire.
  const storeRef = useRef(state);
  storeRef.current = state;
  useEffect(() => {
    if (!partner) return;
    const nid = partner.nationalId;
    const handleAppRow = (row: any) => {
      if (!row || row.partner_nid !== nid) return;
      if (row.status !== "approved" && row.status !== "rejected") return;
      const apps = storeRef.current.partnerApplications;
      const local = apps.find(
        (a) => a.partnerNid === nid && a.kind === row.kind && a.name === row.name && a.status === "pending",
      );
      if (local) {
        dispatch({
          type: "decidePartnerApp",
          appId: local.id,
          approve: row.status === "approved",
          reason: row.reason ?? undefined,
        });
      } else {
        // No local pending row — still surface the flash so the partner sees it.
        setFlash({
          kind: row.status,
          name: row.name ?? "—",
          role: row.kind ?? "merchant",
        });
        setTab("submissions");
        setTimeout(() => setFlash(null), 3500);
      }
    };
    const handleMedicalRow = (row: any) => {
      // Medical bookings: flash on paid → true transition for this partner's providers.
      if (!row || !row.paid) return;
      const providers = storeRef.current.medicalProviders.filter((p) => p.partnerNid === nid);
      if (!providers.some((p) => p.id === row.provider_id)) return;
      setFlash({ kind: "approved", name: row.customer_name ?? "حجز طبي", role: "medical" });
      setTimeout(() => setFlash(null), 3500);
    };

    const channel = supabase
      .channel(`partner-realtime-${nid}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "partner_applications", filter: `partner_nid=eq.${nid}` },
        (payload) => handleAppRow(payload.new),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "partner_applications", filter: `partner_nid=eq.${nid}` },
        (payload) => handleAppRow(payload.new),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "medical_bookings" },
        (payload) => handleMedicalRow(payload.new),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [partner, dispatch]);

  const tabs: { id: typeof tab; label: string; icon: any }[] = [
    { id: "overview", label: t("overview"), icon: TrendingUp },
    { id: "submissions", label: "حالة الطلبات", icon: ClipboardList },
    { id: "inbox", label: t("inbox"), icon: Inbox },
    { id: "ledger", label: t("ledger"), icon: FileText },
    { id: "audit", label: t("audit"), icon: Lock },
  ];

  const handleCaptainSubmit = (app: PartnerApplication) => {
    dispatch({ type: "submitPartnerApp", app });
    setToast("تم إرسال طلب الكابتن إلى غرفة التحكم — بانتظار الموافقة");
    setTimeout(() => setToast(""), 3500);
  };
  const handleMerchantSubmit = (app: PartnerApplication) => {
    dispatch({ type: "submitPartnerApp", app });
    setToast("تم إرسال طلب المحل إلى غرفة التحكم — بانتظار الموافقة");
    setTimeout(() => setToast(""), 3500);
  };
  const handleMedicalSubmit = (app: PartnerApplication) => {
    dispatch({ type: "submitPartnerApp", app });
    setToast("تم إرسال طلب مقدم الخدمة الطبية إلى غرفة التحكم — بانتظار الموافقة");
    setTimeout(() => setToast(""), 3500);
  };

  return (
    <div className="space-y-5">
      {flash && <AlertOverlay />}
      {flash && (
        <div dir="rtl" className={cn(
          "p-3 rounded-xl border-2 flash-alert font-bold text-sm flex items-center gap-3",
          flash.kind === "approved" ? "bg-success/15 border-success text-success" : "bg-destructive/15 border-destructive text-destructive",
        )}>
          {flash.kind === "approved" ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <span>
            تنبيه فوري: تم {flash.kind === "approved" ? "قبول" : "رفض"} طلب {flash.role === "merchant" ? "المحل" : flash.role === "captain" ? "الكابتن" : "مقدم الخدمة الطبية"} «{flash.name}» من غرفة التحكم المركزية.
          </span>
        </div>
      )}
      <div className="flex flex-wrap gap-3 justify-between items-end">
        <div>
          <div className="text-xs text-muted-foreground">{t("zoneHub")}</div>
          <div className="text-2xl font-bold flex items-center gap-2"><MapPin className="w-5 h-5 text-gold" />{partner.name} · {zone}</div>
          <div className="text-[10px] text-muted-foreground font-mono">NID {partner.nationalId}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setSubmittedNid(null)} className="text-xs px-3 py-1.5 rounded-lg bg-secondary font-semibold">Logout</button>
        </div>
      </div>

      {toast && (
        <div className="px-3 py-2 rounded-lg bg-success/15 border border-success/40 text-xs font-semibold text-success">
          {toast}
        </div>
      )}

      <div className="grid md:grid-cols-4 gap-4">
        <Stat icon={Wallet} label={t("splitEarnings")} value={`${earnings.toFixed(0)} ${t("egp")}`} highlight />
        <Stat icon={UserPlus} label={t("activeDrivers")} value={String(drivers.length)} />
        <Stat icon={Store} label={t("activeMerchants")} value={String(merchants.length)} />
        <Stat icon={TrendingUp} label={t("liveOrders")} value={String(zoneOrders.length)} />
      </div>

      <div className="flex gap-1.5 p-1 rounded-xl bg-secondary overflow-x-auto max-w-full">
        {tabs.map((tb) => (
          <button key={tb.id} onClick={() => setTab(tb.id)}
            className={cn("shrink-0 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap",
              tab === tb.id ? "bg-gradient-royal text-primary-foreground shadow-elegant" : "")}>

            <tb.icon className="w-3.5 h-3.5" /> {tb.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
        <div dir="rtl" className="grid lg:grid-cols-2 gap-5">
          <CaptainForm zone={zone} partnerNid={partner.nationalId} onSubmit={handleCaptainSubmit} />
          <MerchantForm zone={zone} partnerNid={partner.nationalId} onSubmit={handleMerchantSubmit} />
        </div>
        <div dir="rtl">
          <MedicalProviderForm zone={zone} partnerNid={partner.nationalId} onSubmit={handleMedicalSubmit} />
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          <Card title={t("registerDriver")}>
            <div className="space-y-2">
              {drivers.map((d) => (
                <div key={d.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/50">
                  <div className="w-8 h-8 rounded-full bg-gradient-royal text-primary-foreground grid place-items-center text-xs font-bold ring-1 ring-gold">{d.name.charAt(0)}</div>
                  <div className="flex-1">
                    <div className="text-sm font-bold">{d.name}</div>
                    <div className="text-[10px] text-muted-foreground">{d.vehicle} · ★ {d.rating}</div>
                  </div>
                  <span className={"w-2 h-2 rounded-full " + (d.online ? "bg-success animate-pulse" : "bg-muted-foreground")} />
                </div>
              ))}
            </div>
          </Card>
          <Card title={t("manageMerchants")}>
            <div className="space-y-2">
              {merchants.map((m) => (
                <div key={m.id} className="p-2.5 rounded-lg bg-secondary/50">
                  <div className="text-sm font-bold">{m.name}</div>
                  <div className="text-[10px] text-muted-foreground">{m.category} · {m.phone}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card title={t("zoneAnalytics")}>
            <div className="grid grid-cols-7 gap-2 h-32 items-end">
              {[40, 65, 55, 80, 90, 70, 95].map((h, i) => (
                <div key={i} className="rounded-t-lg bg-gradient-royal opacity-90" style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2 text-[10px] text-muted-foreground text-center mt-1.5">
              {["S","M","T","W","T","F","S"].map((d, i) => <div key={i}>{d}</div>)}
            </div>
          </Card>
        </div>
        </>
      )}

      {tab === "inbox" && (
        <Card title={t("inbox")}>
          <div className="space-y-2">
            {inbox.length === 0 && <div className="text-center text-xs text-muted-foreground py-8">—</div>}
            {inbox.map((it) => (
              <div key={it.id} className={cn("p-3 rounded-xl border", it.kind === "credentials" ? "bg-gold/10 border-gold" : "bg-destructive/10 border-destructive/40")}>
                <div className="flex items-center gap-2 text-xs font-bold">
                  {it.kind === "credentials" ? <KeyRound className="w-3.5 h-3.5 text-gold" /> : <Lock className="w-3.5 h-3.5 text-destructive" />}
                  {it.kind === "credentials" ? t("credentialsDrop") : t("rejectionLog")} · {it.targetRole}
                </div>
                <div className="text-sm font-bold mt-1">{it.targetName}</div>
                {it.kind === "credentials" ? (
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded bg-card border">{t("username")}: <b>{it.username}</b></div>
                    <div className="p-2 rounded bg-card border">{t("password")}: <b>{it.password}</b></div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground mt-1">{it.reason}</div>
                )}
                <div className="text-[10px] text-muted-foreground mt-2">{new Date(it.ts).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "submissions" && (
        <Card title="حالة الطلبات المرسلة (Submissions Status)">
          <div dir="rtl" className="space-y-2">
            {mySubmissions.length === 0 && (
              <div className="text-center text-xs text-muted-foreground py-8">
                لم تقم بإرسال أي طلبات بعد. استخدم نماذج التسجيل في صفحة "نظرة عامة" لإرسال طلبات الكباتن، المحلات، الصيدليات، ومقدمي الخدمة الطبية.
              </div>
            )}
            {mySubmissions.map((a) => {
              const roleLabel = a.kind === "merchant" ? "محل / صيدلية" : a.kind === "captain" ? "كابتن" : "خدمة طبية";
              const statusMeta = a.status === "approved"
                ? { icon: CheckCircle2, cls: "bg-success/15 border-success text-success", ar: "تم القبول", en: "Approved" }
                : a.status === "rejected"
                ? { icon: XCircle, cls: "bg-destructive/15 border-destructive text-destructive", ar: "تم الرفض", en: "Rejected" }
                : { icon: Clock, cls: "bg-warning/15 border-warning text-warning", ar: "قيد الانتظار", en: "Pending" };
              const Icon = statusMeta.icon;
              return (
                <div key={a.id} className="p-3 rounded-xl border bg-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-bold truncate">{a.name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {roleLabel} · {a.governorate}{a.center ? " · " + a.center : ""}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(a.ts).toLocaleString()}
                      </div>
                    </div>
                    <span className={cn("shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold", statusMeta.cls)}>
                      <Icon className="w-3.5 h-3.5" />
                      {statusMeta.ar} / {statusMeta.en}
                    </span>
                  </div>
                  {a.status === "rejected" && a.reason && (
                    <div className="mt-2 text-[11px] text-destructive">سبب الرفض: {a.reason}</div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {tab === "ledger" && (
        <div className="grid lg:grid-cols-2 gap-5">
          <Card title={t("merchantNetDue")}>
            <table className="w-full text-xs">
              <thead><tr className="text-muted-foreground border-b">
                <th className="text-start py-1.5">Merchant</th><th className="text-end">Revenue</th><th className="text-end">{t("netDue")}</th>
              </tr></thead>
              <tbody>
                {merchants.map((m) => {
                  const rev = zoneOrders.filter((o) => o.merchantId === m.id).reduce((s, o) => s + o.fareEgp, 0);
                  const net = Math.round(rev * 0.85);
                  return (
                    <tr key={m.id} className="border-b border-gold/10">
                      <td className="py-1.5 font-semibold">{m.name}</td>
                      <td className="text-end">{rev} {t("egp")}</td>
                      <td className="text-end font-bold text-gold">{net} {t("egp")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
          <Card title={t("captainDebts")}>
            <table className="w-full text-xs">
              <thead><tr className="text-muted-foreground border-b">
                <th className="text-start py-1.5">Captain</th><th className="text-center">Vehicle</th><th className="text-end">Balance</th>
              </tr></thead>
              <tbody>
                {drivers.map((d) => {
                  const bal = state.walletDriver[d.id] ?? 0;
                  return (
                    <tr key={d.id} className="border-b border-gold/10">
                      <td className="py-1.5 font-semibold">{d.name}</td>
                      <td className="text-center">{d.vehicle}</td>
                      <td className={cn("text-end font-bold", bal < 0 ? "text-destructive" : "text-success")}>{bal} {t("egp")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {tab === "audit" && (
        <Card title={t("auditTrail")}>
          <div className="space-y-1.5 max-h-96 overflow-auto">
            {audit.length === 0 && <div className="text-center text-xs text-muted-foreground py-4">—</div>}
            {audit.map((l) => (
              <div key={l.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/40 text-xs">
                <span className={"w-1.5 h-1.5 rounded-full " + (l.type === "sos" ? "bg-destructive animate-pulse" : l.type === "fraud" ? "bg-warning" : l.type === "escrow" ? "bg-gold" : "bg-primary")} />
                <span className="flex-1">{l.msg}</span>
                <span className="text-[10px] text-muted-foreground">{new Date(l.ts).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div dir="rtl" className="mt-2 p-3 rounded-xl border-2 border-gold/60 bg-gradient-to-l from-gold/10 via-card to-success/10 shadow-card">
        <div className="flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-gold mt-0.5 shrink-0" />
          <div className="text-[11px] leading-relaxed">
            <span className="font-bold text-gold">تنبيه (صمام الأمان): </span>
            يتم إرسال البيانات المرفوعة، المنيو، وفيديو العرض للمحل والأسعار إلى
            <b className="text-success"> غرفة التحكم المركزية </b>
            للموافقة أو الرفض قبل التفعيل الحي على التطبيق.
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, highlight }: any) {
  return (
    <div className={cn("p-4 rounded-2xl border shadow-card", highlight ? "bg-gradient-gold text-gold-foreground" : "bg-card")}>
      <div className="flex items-center gap-2 text-xs opacity-80"><Icon className="w-3.5 h-3.5" /> {label}</div>
      <div className="text-2xl font-bold mt-1.5">{value}</div>
    </div>
  );
}
function Card({ title, children }: any) {
  return (
    <div className="p-4 rounded-2xl bg-card border shadow-card">
      <div className="text-sm font-bold mb-3">{title}</div>
      {children}
    </div>
  );
}

// ============================================================
// Onboarding modals
// ============================================================

const VEHICLE_OPTIONS: { value: VehicleType; label: string }[] = [
  { value: "motorbike", label: "رافا موتوسيكل — نقل أفراد / مرسيل / مناديب" },
  { value: "tricycle",  label: "رافا تروسيكل — بضائع خفيفة داخل المنطقة" },
  { value: "dababa",    label: "رافا دبابة نقل / ربع نقل" },
  { value: "tuktuk",    label: "رافا توكتوك — مشوار داخلي" },
  { value: "car",       label: "رافا سيارة ملاكي — مشاوير خاصة" },
  { value: "winsh",     label: "رافا ونش إنقاذ" },
];

const MERCHANT_OPTIONS: { value: ServiceType; label: string }[] = [
  { value: "kiosk",    label: "☕ مشروبات ساخنة فقط" },
  { value: "errands",  label: "🧺 خدمة غسيل سجاد وبطاطين" },
  { value: "errands",  label: "🪵 مستودع أنابيب" },
  { value: "errands",  label: "🧹 خدمات عمال نظافة" },
  { value: "pharmacy", label: "💊 صيدلية" },
  { value: "food",     label: "🍔 مأكولات" },
  { value: "grocery",  label: "🛒 سوبر ماركت" },
  { value: "kiosk",    label: "🍹 مشروبات وعصائر" },
  { value: "errands",  label: "🥿 أحذية وشنط" },
  { value: "errands",  label: "👕 ملابس رجالي" },
  { value: "errands",  label: "👗 ملابس نسائي" },
  { value: "errands",  label: "💄 مكياجات وإكسسوارات" },
  { value: "errands",  label: "⌚ إكسسوارات رجالي" },
  { value: "food",     label: "🥘 مطعم شغل بيتي" },
  { value: "kiosk",    label: "🥜 محمصة وتسالي" },
  { value: "food",     label: "🧁 محل حلويات" },
  { value: "errands",  label: "📁 أخرى" },
];

function Field({ label, error, children }: { label: string; error?: string; children: any }) {
  return (
    <label className="block">
      <div className="text-[11px] font-semibold text-muted-foreground mb-1">{label}</div>
      {children}
      {error && <div className="text-[10px] text-destructive mt-1">{error}</div>}
    </label>
  );
}

const inputCls = "w-full px-3 py-2 rounded-lg border bg-background text-sm";
const selectCls = inputCls + " appearance-none pr-8";

function FancySelect<T extends string>({ value, onChange, options }: { value: number; onChange: (idx: number) => void; options: { value: T; label: string }[]; }) {
  return (
    <div className="relative">
      <select
        className={selectCls}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {options.map((o, i) => (
          <option key={i} value={i}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="w-4 h-4 text-gold absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}

function SearchableSelect<T extends string>({ value, onChange, options }: { value: number; onChange: (idx: number) => void; options: { value: T; label: string }[]; }) {
  const [query, setQuery] = useState("");
  const filtered = options
    .map((o, i) => ({ o, i }))
    .filter(({ o }) => o.label.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <div className="space-y-1.5">
      <input
        className={inputCls + " text-xs"}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="ابحث في الأنشطة..."
      />
      <div className="relative">
        <select
          className={selectCls}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        >
          {filtered.length === 0 && <option disabled>لا توجد نتائج</option>}
          {filtered.map(({ o, i }) => (
            <option key={i} value={i}>{o.label}</option>
          ))}
        </select>
        <ChevronDown className="w-4 h-4 text-gold absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    </div>
  );
}

function PhotoUpload({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void; }) {
  const onFile = (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result ?? ""));
    reader.readAsDataURL(f);
  };
  return (
    <div>
      <div className="text-[11px] font-semibold text-muted-foreground mb-1">{label}</div>
      <div className="flex items-center gap-3">
        <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-gold/50 bg-background text-xs font-semibold text-gold hover:bg-gold/5">
          <Upload className="w-4 h-4" />
          {value ? "تغيير الصورة" : "اختر صورة"}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
        <div className="w-16 h-16 rounded-lg border border-gold/40 bg-secondary/40 overflow-hidden grid place-items-center text-[10px] text-muted-foreground">
          {value ? <img src={value} alt="preview" className="w-full h-full object-cover" /> : "معاينة"}
        </div>
      </div>
    </div>
  );
}

function FormCard({ accent, title, children }: { accent: "royal" | "gold"; title: string; children: any }) {
  return (
    <div className={cn("p-4 rounded-2xl border-2 bg-card shadow-card", accent === "royal" ? "border-success/60" : "border-gold/60")}>
      <div className={cn("text-sm font-bold mb-3 inline-flex items-center gap-2", accent === "royal" ? "text-success" : "text-gold")}>
        {title}
      </div>
      {children}
    </div>
  );
}

function CaptainForm({ zone, partnerNid, onSubmit }: { zone: string; partnerNid: string; onSubmit: (a: PartnerApplication) => void; }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [license, setLicense] = useState("");
  const [nidPhoto, setNidPhoto] = useState("");
  const [criminalRecordPhoto, setCriminalRecordPhoto] = useState("");
  const [appointmentCardPhoto, setAppointmentCardPhoto] = useState("");
  const [vehicleIdx, setVehicleIdx] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = () => {
    const e: Record<string, string> = {};
    const arabicName = /^[\u0600-\u06FF\s]{6,}$/;
    if (!arabicName.test(name.trim())) e.name = "الاسم رباعي بحروف عربية";
    if (!/^(010|011|012|015)\d{8}$/.test(phone.trim())) e.phone = "رقم موبايل مصري غير صحيح";
    if (!/^[A-Za-z0-9\u0600-\u06FF\-\/ ]{4,}$/.test(license.trim())) e.license = "رخصة غير صحيحة";
    if (!nidPhoto) e.nidPhoto = "ارفع صورة البطاقة";
    if (!criminalRecordPhoto) e.criminalRecordPhoto = "ارفع صورة الفيش الجنائي";
    if (!appointmentCardPhoto) e.appointmentCardPhoto = "ارفع صورة بطاقة التعيين";
    setErrors(e);
    if (Object.keys(e).length) return;
    const opt = VEHICLE_OPTIONS[vehicleIdx];
    onSubmit({
      id: uid(), ts: Date.now(), partnerNid, kind: "captain",
      name: name.trim(), phone: phone.trim(),
      governorate: zone, vehicle: opt.value,
      operationType: opt.label,
      license: license.trim(),
      nidPhoto,
      criminalRecordPhoto,
      appointmentCardPhoto,
      status: "pending",
    });
    setName(""); setPhone(""); setLicense(""); setNidPhoto("");
    setCriminalRecordPhoto(""); setAppointmentCardPhoto("");
    setVehicleIdx(0); setErrors({});
  };

  return (
    <FormCard accent="royal" title="إضافة كابتن جديد">
      <div className="space-y-3">
        <Field label="الاسم رباعي" error={errors.name}>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم بالحروف العربية" />
        </Field>
        <Field label="رقم الهاتف" error={errors.phone}>
          <input className={inputCls + " font-mono"} inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="01XXXXXXXXX" />
        </Field>
        <Field label="رخصة القيادة" error={errors.license}>
          <input className={inputCls} value={license} onChange={(e) => setLicense(e.target.value)} placeholder="رقم/كود الرخصة" />
        </Field>
        <Field label="صورة بطاقة الرقم القومي (وجه وظهر)" error={errors.nidPhoto}>
          <PhotoUpload label="" value={nidPhoto} onChange={setNidPhoto} />
        </Field>
        <Field label="صورة فيش جنائي" error={errors.criminalRecordPhoto}>
          <PhotoUpload label="" value={criminalRecordPhoto} onChange={setCriminalRecordPhoto} />
        </Field>
        <Field label="صورة من بطاقة التعيين" error={errors.appointmentCardPhoto}>
          <PhotoUpload label="" value={appointmentCardPhoto} onChange={setAppointmentCardPhoto} />
        </Field>
        <Field label="نوع التشغيل">
          <FancySelect value={vehicleIdx} onChange={setVehicleIdx} options={VEHICLE_OPTIONS} />
        </Field>
        <div className="text-[10px] text-muted-foreground bg-secondary/40 rounded-lg p-2 border border-gold/20">
          سيتم إرسال البيانات إلى <b>غرفة التحكم المركزية</b> ضمن قائمة "بانتظار الموافقة" مع تصنيف المركبة.
        </div>
        <button onClick={submit} className="w-full px-4 py-2.5 rounded-xl bg-gradient-royal text-primary-foreground font-bold">
          إرسال للموافقة
        </button>
      </div>
    </FormCard>
  );
}

const MEDICAL_OPTIONS: { value: MedicalSpecialty; label: string }[] = [
  { value: "clinic", label: "🩺 عيادة طبية / دكتور" },
  { value: "lab",    label: "🧪 معمل تحاليل وأشعة" },
  { value: "salon",  label: "💇 صالون تجميل / كوافير" },
];

function MedicalProviderForm({ zone, partnerNid, onSubmit }: { zone: string; partnerNid: string; onSubmit: (a: PartnerApplication) => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [specIdx, setSpecIdx] = useState(0);
  const [specializationLabel, setSpecializationLabel] = useState("");
  const [promoImage, setPromoImage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = () => {
    const e: Record<string, string> = {};
    if (name.trim().length < 3) e.name = "الاسم الكامل مطلوب";
    if (!/^(010|011|012|015)\d{8}$/.test(phone.trim())) e.phone = "رقم موبايل مصري غير صحيح";
    if (specializationLabel.trim().length < 3) e.specializationLabel = "التخصص الفرعي مطلوب (مثال: باطنة / أشعة / كوافير حريمي)";
    if (!promoImage) e.promoImage = "ارفع صورة دعائية عالية الجودة";
    setErrors(e);
    if (Object.keys(e).length) return;
    const opt = MEDICAL_OPTIONS[specIdx];
    const tmpUser = (name.trim() || "user").toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 16) || "med_" + Math.random().toString(36).slice(2, 6);
    const tmpPass = "TMP-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    onSubmit({
      id: uid(), ts: Date.now(), partnerNid, kind: "medical",
      name: name.trim(), phone: phone.trim(),
      governorate: zone,
      specialty: opt.value, specializationLabel: specializationLabel.trim(),
      promoImage,
      operationType: opt.label,
      status: "pending",
    });
    setName(""); setPhone(""); setSpecializationLabel(""); setPromoImage(""); setSpecIdx(0); setErrors({});
    // local hint about temp creds
    console.info("Pending medical provider · tmp creds:", tmpUser, tmpPass);
  };

  return (
    <FormCard accent="gold" title="إضافة مقدم خدمة طبية / تجميلية">
      <div className="space-y-3">
        <Field label="الاسم الكامل (د./مركز/صالون)" error={errors.name}>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="د. أحمد سامي / صالون لمسة جمال" />
        </Field>
        <Field label="رقم الهاتف" error={errors.phone}>
          <input className={inputCls + " font-mono"} inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="01XXXXXXXXX" />
        </Field>
        <Field label="نوع الخدمة">
          <FancySelect value={specIdx} onChange={setSpecIdx} options={MEDICAL_OPTIONS} />
        </Field>
        <Field label="التخصص الفرعي / النشاط" error={errors.specializationLabel}>
          <input className={inputCls} value={specializationLabel} onChange={(e) => setSpecializationLabel(e.target.value)} placeholder="مثال: باطنة وقلب / أشعة مقطعية / كوافير حريمي وميكب" />
        </Field>
        <Field label="صورة دعائية عالية الجودة" error={errors.promoImage}>
          <PhotoUpload label="" value={promoImage} onChange={setPromoImage} />
        </Field>
        <div className="text-[10px] text-muted-foreground bg-secondary/40 rounded-lg p-2 border border-gold/20 flex items-start gap-1.5">
          <Stethoscope className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
          <span>
            عند الإرسال يتم توليد اسم مستخدم وكلمة مرور مؤقتة، وتبقى الحالة <b>"بانتظار الموافقة"</b> حتى يتم اعتماد الملف من <b className="text-success">غرفة التحكم المركزية</b>. عند الموافقة يصلك في صندوق الوارد بياناتُ الدخول النهائية.
          </span>
        </div>
        <button onClick={submit} className="w-full px-4 py-2.5 rounded-xl bg-gradient-gold text-gold-foreground font-bold">
          إرسال للموافقة
        </button>
      </div>
    </FormCard>
  );
}

function MerchantForm({ zone, partnerNid, onSubmit }: { zone: string; partnerNid: string; onSubmit: (a: PartnerApplication) => void; }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [signboard, setSignboard] = useState("");
  const [about, setAbout] = useState("");
  const [catIdx, setCatIdx] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validUrl = (u: string) => {
    try {
      const url = new URL(u);
      if (!/^https?:$/.test(url.protocol)) return false;
      return /google\.|goo\.gl|maps\.app|maps\./i.test(url.hostname + url.pathname);
    } catch { return false; }
  };

  const submit = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "مطلوب";
    if (!/^(010|011|012|015)\d{8}$/.test(phone.trim())) e.phone = "رقم موبايل مصري غير صحيح";
    if (address.trim().length < 6) e.address = "يجب كتابة العنوان بالتفصيل";
    if (!validUrl(mapUrl.trim())) e.mapUrl = "رابط خرائط جوجل غير صحيح";
    if (!signboard) e.signboard = "ارفع صورة اللافتة";
    if (about.trim().length < 6) e.about = "اكتب نبذة قصيرة";
    setErrors(e);
    if (Object.keys(e).length) return;
    const opt = MERCHANT_OPTIONS[catIdx];
    onSubmit({
      id: uid(), ts: Date.now(), partnerNid, kind: "merchant",
      name: name.trim(), phone: phone.trim(),
      governorate: zone,
      address: address.trim(), mapUrl: mapUrl.trim(),
      category: opt.value,
      categoryLabel: opt.label,
      signboardPhoto: signboard,
      about: about.trim(),
      status: "pending",
    });
    setName(""); setPhone(""); setAddress(""); setMapUrl(""); setSignboard(""); setAbout(""); setCatIdx(0); setErrors({});
  };

  return (
    <FormCard accent="gold" title="إضافة محل جديد">
      <div className="space-y-3">
        <Field label="اسم المحل" error={errors.name}>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="رقم التواصل" error={errors.phone}>
          <input className={inputCls + " font-mono"} inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="01XXXXXXXXX" />
        </Field>
        <Field label="العنوان كتابةً" error={errors.address}>
          <textarea className={inputCls + " min-h-[70px]"} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="الشارع، المنطقة، علامة مميزة..." />
        </Field>
        <Field label="رابط موقع المحل على خرائط جوجل" error={errors.mapUrl}>
          <input className={inputCls + " text-xs font-mono"} value={mapUrl} onChange={(e) => setMapUrl(e.target.value)} placeholder="https://maps.app.goo.gl/..." />
        </Field>
        <Field label="صورة للافتة المحل" error={errors.signboard}>
          <PhotoUpload label="" value={signboard} onChange={setSignboard} />
        </Field>
        <Field label="نبذة عن المحل" error={errors.about}>
          <textarea className={inputCls + " min-h-[60px]"} value={about} onChange={(e) => setAbout(e.target.value)} placeholder="تخصص المحل، ساعات العمل، مميزاته..." />
        </Field>
        <Field label="نوع المحل">
          <SearchableSelect value={catIdx} onChange={setCatIdx} options={MERCHANT_OPTIONS} />
        </Field>
        <div className="text-[10px] text-muted-foreground bg-secondary/40 rounded-lg p-2 border border-gold/20">
          بعد الموافقة سيظهر المحل تلقائياً في <b>واجهة العميل</b> تحت الفلتر/التصنيف الصحيح.
        </div>
        <button onClick={submit} className="w-full px-4 py-2.5 rounded-xl bg-gradient-gold text-gold-foreground font-bold">
          إرسال للموافقة
        </button>
      </div>
    </FormCard>
  );
}
