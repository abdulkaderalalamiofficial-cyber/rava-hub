import { useEffect, useMemo, useState } from "react";
import { useI18n } from "../i18n";
import { useStore, uid, type VehicleType, type MerchantCommissionCategory } from "../store";
import { EGYPT_CENTERS } from "../data/egyptCenters";
import { Fuel, Shield, AlertOctagon, Activity, TrendingUp, HeartHandshake, Users, KeyRound, X as XIcon, Check, Sliders, Siren, Lock, Minus, Plus, FileDown, Eye, ShieldCheck, History, Store, UserPlus, Search, MapPin, Send, Wallet, Stethoscope, Radio, Zap, UserCog, Navigation2, ArrowRight, CreditCard } from "lucide-react";
import { PlatformControlCenter } from "../components/PlatformControlCenter";
import { PublisherAccountsCenter } from "../components/PublisherAccountsCenter";
import { cn } from "@/lib/utils";
import { useCloudOrders } from "../hooks/useCloudOrders";
import { CaptainTrackingMap } from "../components/CaptainTrackingMapLazy";
import { useServerFn } from "@tanstack/react-start";
import { seedDemoAccounts } from "@/lib/demo-seed.functions";

const ADMIN_PIN = "123456";
const SUPER_ADMIN = { id: "super", name: "Hossam El-Sayed", nid: "29005011234567" };

const vehicleList: VehicleType[] = ["motorbike", "car", "tuktuk", "tricycle", "dababa", "winsh"];
const merchantCats: MerchantCommissionCategory[] = ["restaurants", "supermarket", "pharmacy", "publisher", "other"];
const catLabelKey: Record<MerchantCommissionCategory, string> = {
  restaurants: "catRestaurants", supermarket: "catSupermarket", pharmacy: "catPharmacy", publisher: "catPublisher", other: "catOther",
};

type SectionId = "tracking" | "platform" | "pricing" | "finance" | "team" | "safety" | "demo";
const SECTIONS: { id: SectionId; title: string; subtitle: string; icon: any }[] = [
  { id: "tracking", title: "التتبع والعمليات المباشرة", subtitle: "خريطة الكباتن على مستوى الجمهورية والطلبات اللحظية", icon: Navigation2 },
  { id: "platform", title: "مركز التحكم بالمنصة", subtitle: "بوابات الدفع · تشغيل/إيقاف الخدمات · التسعير الديناميكي · بانرات العميل", icon: CreditCard },
  { id: "pricing", title: "الأسعار والعمولات", subtitle: "مؤشر الوقود، تقسيم الأرباح، تسعير الأسطول وعمولات المحلات", icon: Sliders },
  { id: "finance", title: "المالية والتسويات", subtitle: "الشيت الرئيسي للفروع والدفتر المالي للكباتن والشركاء", icon: Wallet },
  { id: "team", title: "الفريق والشركاء والاعتمادات", subtitle: "إدارة الموظفين، طابور الموافقات، ومزودي الخدمة الطبية", icon: Users },
  { id: "safety", title: "الطوارئ والأمان والتدقيق", subtitle: "نداءات الاستغاثة، سجلات الاحتيال، وسجل التدقيق غير القابل للتعديل", icon: Shield },
  { id: "demo", title: "الحسابات التجريبية", subtitle: "حسابات مراجعي المتاجر بكلمة مرور موحّدة", icon: KeyRound },
];

const ORDER_STATUS_AR: Record<string, string> = {
  pending: "قيد الانتظار", accepted: "مقبول", completed: "مكتمل", cancelled: "ملغى",
};
const SEED_STATUS_AR: Record<string, string> = {
  created: "تم الإنشاء", existing: "موجود", error: "خطأ",
};

export function AdminApp() {
  const { t } = useI18n();
  const { state, dispatch } = useStore();

  // Cloud live orders (Postgres realtime, hierarchical zone-safe)
  const cloud = useCloudOrders();
  // Demo account seeding (admin-only)
  const seedFn = useServerFn(seedDemoAccounts);
  const [seedBusy, setSeedBusy] = useState(false);
  const [seedResult, setSeedResult] = useState<null | { password: string; accounts: { email: string; role: string; status: string; message?: string }[] }>(null);
  const runSeed = async () => {
    setSeedBusy(true);
    try {
      const r = await seedFn();
      setSeedResult(r);
    } catch (e) {
      setSeedResult({ password: "—", accounts: [{ email: "—", role: "—", status: "error", message: e instanceof Error ? e.message : String(e) }] });
    } finally {
      setSeedBusy(false);
    }
  };

  // ===== Secure PIN lock =====
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [pinErr, setPinErr] = useState("");
  const tryUnlock = () => {
    if (pin === ADMIN_PIN) { setUnlocked(true); setPin(""); setPinErr(""); }
    else { setPinErr(t("wrongPin")); }
  };

  // ===== RBAC view-as =====
  const [viewRole, setViewRole] = useState<"super" | "ops">("super");
  const isReadOnly = viewRole === "ops";

  // ===== Active section (card-menu navigation) =====
  const [section, setSection] = useState<SectionId | null>(null);
  

  // ===== Confirm-save dialog =====
  const [confirm, setConfirm] = useState<null | { title: string; body: string; run: () => void }>(null);

  // Pending commission split (only commits on Save)
  const [pendingSplit, setPendingSplit] = useState(state.splitCentralPct);
  useEffect(() => { setPendingSplit(state.splitCentralPct); }, [state.splitCentralPct]);
  const splitDirty = pendingSplit !== state.splitCentralPct;

  // ===== Pending merchant commissions =====
  const [pendingMerch, setPendingMerch] = useState(state.merchantCommissions);
  useEffect(() => { setPendingMerch(state.merchantCommissions); }, [state.merchantCommissions]);
  const merchDirty = merchantCats.some((c) => pendingMerch[c] !== state.merchantCommissions[c]);
  const merchInvalid = merchantCats.some((c) => pendingMerch[c] < 0 || pendingMerch[c] > 50);
  const bumpMerch = (c: MerchantCommissionCategory, delta: number) => {
    if (isReadOnly) return;
    setPendingMerch((m) => {
      const next = Math.round((m[c] + delta) * 10) / 10;
      if (next < 0 || next > 50) return m;
      return { ...m, [c]: next };
    });
  };
  const setMerch = (c: MerchantCommissionCategory, raw: string) => {
    if (isReadOnly) return;
    const v = parseFloat(raw);
    if (isNaN(v)) { setPendingMerch((m) => ({ ...m, [c]: 0 })); return; }
    setPendingMerch((m) => ({ ...m, [c]: Math.max(0, Math.min(50, v)) }));
  };
  const saveMerch = () => {
    if (isReadOnly || !merchDirty || merchInvalid) return;
    const diffs = merchantCats
      .filter((c) => pendingMerch[c] !== state.merchantCommissions[c])
      .map((c) => `${t(catLabelKey[c])}: ${state.merchantCommissions[c]}% → ${pendingMerch[c]}%`)
      .join(" · ");
    setConfirm({
      title: t("confirmSave"), body: diffs,
      run: () => {
        dispatch({ type: "updateMerchantCommissions", patch: { ...pendingMerch } });
        logAction("merchant_commission_update", diffs);
      },
    });
  };

  // ===== Add Region Partner modal =====
  const [partnerOpen, setPartnerOpen] = useState(false);

  const logAction = (actionType: string, details: string) => {
    dispatch({
      type: "logAudit",
      partnerNid: SUPER_ADMIN.nid,
      partnerName: `${SUPER_ADMIN.name} (${viewRole === "super" ? t("superAdmin") : t("opsAdmin")})`,
      actionType,
      details,
    });
  };

  useEffect(() => {
    const t1 = setInterval(() => {
      const types = ["reassign", "fraud"] as const;
      const tp = types[Math.floor(Math.random() * 2)];
      const messages = {
        reassign: "GPS stalled 5m+ — order reassigned",
        fraud: "Fake-trip pattern detected — 0.2km, premium fare",
      };
      const zones = ["Shubra", "Maadi", "Heliopolis"];
      const z = zones[Math.floor(Math.random() * zones.length)];
      dispatch({ type: "addLog", log: { id: uid(), type: tp, msg: messages[tp], ts: Date.now(), zone: z } });
    }, 18_000);
    return () => clearInterval(t1);
  }, [dispatch]);

  const totalPartnerWallet = Object.values(state.walletPartner).reduce((a, b) => a + b, 0);

  // Captains tracked country-wide for the control-room map
  const trackedCaptains = useMemo(
    () =>
      state.drivers.map((d) => ({
        id: d.id,
        name: d.name,
        vehicle: t(d.vehicle),
        plate: d.plate,
        zone: d.zone,
        governorate: (d as { governorate?: string }).governorate ?? "",
        online: d.online,
      })),
    [state.drivers, t],
  );

  const [staffForm, setStaffForm] = useState({ name: "", phone: "", nationalId: "", role: "ops" as const });
  const [pwd, setPwd] = useState<Record<string, string>>({});
  const [reason, setReason] = useState<Record<string, string>>({});

  // ===== Financial Ledger (+ / -) =====
  const [ledgerPrompt, setLedgerPrompt] = useState<null | { kind: "driver" | "partner"; id: string; label: string; sign: 1 | -1; amount: string; note: string }>(null);
  const openLedger = (kind: "driver" | "partner", id: string, label: string, sign: 1 | -1) => {
    if (isReadOnly) return;
    setLedgerPrompt({ kind, id, label, sign, amount: "", note: "" });
  };
  const submitLedger = () => {
    if (!ledgerPrompt) return;
    const amt = parseFloat(ledgerPrompt.amount);
    if (isNaN(amt) || amt <= 0) return;
    const delta = ledgerPrompt.sign * Math.round(amt);
    const note = ledgerPrompt.note.trim() || (ledgerPrompt.sign > 0 ? "Manual credit / bonus" : "Manual debit / fine");
    dispatch({
      type: "adjustWallet",
      kind: ledgerPrompt.kind, id: ledgerPrompt.id, delta, note,
      actorName: `${SUPER_ADMIN.name} (${viewRole === "super" ? t("superAdmin") : t("opsAdmin")})`,
      actorNid: SUPER_ADMIN.nid,
    });
    setLedgerPrompt(null);
  };

  const approve = (appId: string) => {
    const p = pwd[appId] || ("Rf-" + Math.random().toString(36).slice(2, 8));
    dispatch({ type: "approveApplication", appId, password: p });
    setPwd((x) => ({ ...x, [appId]: "" }));
  };
  const reject = (appId: string) => {
    dispatch({ type: "rejectApplication", appId, reason: reason[appId] || "Incomplete documents" });
    setReason((x) => ({ ...x, [appId]: "" }));
  };

  const addStaff = () => {
    if (!/^\d{14}$/.test(staffForm.nationalId)) return;
    if (!staffForm.name || !staffForm.phone) return;
    dispatch({ type: "addStaff", s: { id: uid(), ...staffForm } });
    setStaffForm({ name: "", phone: "", nationalId: "", role: "ops" });
  };

  const branchRows = state.zonePartners.map((p) => {
    const zoneOrders = state.orders.filter((o) => o.zone === p.zone);
    const completed = zoneOrders.filter((o) => o.status === "completed").length;
    const leakage = zoneOrders.filter((o) => o.status === "cancelled" || (o.status === "pending" && Date.now() - o.createdAt > 30_000)).length;
    const partnerProfit = state.walletPartner[p.zone] ?? 0;
    const centralProfit = partnerProfit * (state.splitCentralPct / state.splitPartnerPct);
    return { zone: p.zone, partner: p.name, merchants: state.merchants.filter((m) => m.zone === p.zone).length, captains: state.drivers.filter((d) => d.zone === p.zone).length, completed, partnerProfit, centralProfit, leakage };
  });

  // Bump a pricing field with audit + RBAC guard
  const bumpPricing = (v: VehicleType, field: keyof typeof state.pricing[VehicleType], delta: number) => {
    if (isReadOnly) return;
    const cur = state.pricing[v][field] as number;
    const next = Math.max(0, +(cur + delta).toFixed(2));
    dispatch({ type: "updatePricing", vehicle: v, patch: { [field]: next } as any });
    logAction("pricing_update", `${t(v)} · ${String(field)} ${cur} → ${next}`);
  };

  const requestCommissionSave = () => {
    if (isReadOnly || !splitDirty) return;
    const before = state.splitCentralPct;
    setConfirm({
      title: t("confirmSave"),
      body: `${t("splitCentral")}: ${before}% → ${pendingSplit}%`,
      run: () => {
        dispatch({ type: "updateSplit", central: pendingSplit, partner: 100 - pendingSplit });
        logAction("commission_split_update", `${before}% → ${pendingSplit}%`);
      },
    });
  };

  const exportSettlementPdf = () => {
    const w = window.open("", "_blank", "width=820,height=900");
    if (!w) return;
    const rows = branchRows.map(r => `<tr><td>${r.zone}</td><td>${r.partner}</td><td style="text-align:center">${r.completed}</td><td style="text-align:right">${r.partnerProfit.toFixed(0)}</td><td style="text-align:right">${r.centralProfit.toFixed(0)}</td><td style="text-align:right;color:#b91c1c">${r.leakage}</td></tr>`).join("");
    w.document.write(`<html dir="${document.documentElement.dir}"><head><title>RAVA Settlement · ${new Date().toLocaleDateString()}</title>
      <style>body{font-family:Inter,Cairo,sans-serif;padding:32px;color:#111}h1{color:#046A38;margin:0 0 4px}.muted{color:#666;font-size:12px}table{width:100%;border-collapse:collapse;margin-top:18px;font-size:13px}th,td{padding:8px;border-bottom:1px solid #e5e7eb}th{background:#046A38;color:#fff;text-align:start}.tot{margin-top:16px;padding:12px;background:#fffbea;border:1px solid #D4AF37;border-radius:8px;font-weight:700}</style></head>
      <body><h1>RAVA Super App — Settlement Report</h1>
      <div class="muted">${new Date().toLocaleString()} · Central Revenue: ${state.centralRevenue.toFixed(0)} EGP · Partner Wallets: ${totalPartnerWallet.toFixed(0)} EGP</div>
      <table><thead><tr><th>Zone</th><th>Partner</th><th>Completed</th><th>Partner Profit</th><th>Central Profit</th><th>Leakage</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="tot">Split: ${state.splitCentralPct}% Central / ${state.splitPartnerPct}% Partners · Insurance Fund: ${state.insuranceFund.toFixed(0)} EGP</div>
      <script>window.onload=()=>window.print()</script></body></html>`);
    w.document.close();
    logAction("settlement_pdf_export", `${branchRows.length} branches · revenue ${state.centralRevenue.toFixed(0)}`);
  };

  // ===== Mass pricing sync across a governorate =====
  const syncPricingToGovernorate = (governorate: string) => {
    if (isReadOnly) return;
    const centers = EGYPT_CENTERS[governorate] ?? [];
    logAction("mass_pricing_sync", `${governorate} · ${centers.length} centers · fleet+merchant pricing replicated`);
  };

  // ===== Locked screen =====
  if (!unlocked) {
    return (
      <div className="grid place-items-center py-16">
        <div className="w-full max-w-sm p-6 rounded-2xl bg-card border-2 border-gold shadow-royal text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-royal grid place-items-center mx-auto"><Lock className="w-7 h-7 text-primary-foreground" /></div>
          <div className="mt-3 text-lg font-bold">{t("adminLock")}</div>
          <div className="text-xs text-muted-foreground">{t("centralControl")}</div>
          <input
            type="password" inputMode="numeric" maxLength={6} autoFocus
            value={pin}
            onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 6)); setPinErr(""); }}
            onKeyDown={(e) => e.key === "Enter" && tryUnlock()}
            placeholder="••••••"
            className="mt-4 w-full text-center tracking-[1em] text-2xl font-mono py-3 rounded-xl border-2 bg-background"
          />
          {pinErr && <div className="text-xs text-destructive mt-2">{pinErr}</div>}
          <button onClick={tryUnlock} className="mt-3 w-full py-2.5 rounded-xl bg-gradient-royal text-primary-foreground font-bold">{t("unlock")}</button>
          <div className="mt-2 text-[10px] text-muted-foreground">{t("pinHint")}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-xs text-muted-foreground">{t("centralControl")}</div>
          <div className="text-2xl font-bold bg-gradient-royal bg-clip-text text-transparent">غرفة عمليات RAVA الملكية</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border bg-secondary p-1 text-xs">
            <button onClick={() => setViewRole("super")} className={cn("px-2.5 py-1 rounded-lg flex items-center gap-1 font-bold", viewRole === "super" && "bg-gradient-royal text-primary-foreground")}>
              <ShieldCheck className="w-3 h-3" />{t("superAdmin")}
            </button>
            <button onClick={() => setViewRole("ops")} className={cn("px-2.5 py-1 rounded-lg flex items-center gap-1 font-bold", viewRole === "ops" && "bg-gold text-gold-foreground")}>
              <Eye className="w-3 h-3" />{t("opsAdmin")}
            </button>
          </div>
          <button onClick={exportSettlementPdf} className="px-3 py-2 rounded-xl bg-gold text-gold-foreground text-xs font-bold flex items-center gap-1 shadow-elegant">
            <FileDown className="w-3.5 h-3.5" />{t("exportSettlement")}
          </button>
          <button onClick={() => setPartnerOpen(true)} disabled={isReadOnly}
            className="px-3 py-2 rounded-xl bg-gradient-royal text-primary-foreground text-xs font-bold flex items-center gap-1 shadow-elegant disabled:opacity-40">
            <UserPlus className="w-3.5 h-3.5" />{t("addRegionPartner")}
          </button>
          <button onClick={() => setUnlocked(false)} className="px-3 py-2 rounded-xl bg-secondary text-xs font-bold flex items-center gap-1">
            <Lock className="w-3.5 h-3.5" />{t("lockNow")}
          </button>
        </div>
      </div>
      {isReadOnly && (
        <div className="px-3 py-2 rounded-xl bg-gold/15 border border-gold text-xs font-bold flex items-center gap-2">
          <Eye className="w-3.5 h-3.5 text-gold" />{t("readOnlyOps")}
        </div>
      )}

      {!section && (
        <>
          <div className="grid md:grid-cols-4 gap-4">
            <Big icon={TrendingUp} label={t("masterRevenue")} value={`${state.centralRevenue.toFixed(0)} ${t("egp")}`} gold />
            <Big icon={Activity} label={t("liveOrders")} value={String(state.orders.filter((o) => o.status !== "completed").length)} />
            <Big icon={Shield} label={t("partners")} value={`${totalPartnerWallet.toFixed(0)} ${t("egp")}`} />
            <Big icon={HeartHandshake} label={t("insurance")} value={`${state.insuranceFund.toFixed(0)} ${t("egp")}`} />
          </div>

          {/* ===== Card menu — each card opens its own section ===== */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SECTIONS.map((s) => (
              <button key={s.id} onClick={() => setSection(s.id)}
                className="group text-start p-5 rounded-2xl bg-card border-2 border-border hover:border-gold shadow-card hover:shadow-royal transition-all">
                <div className="w-12 h-12 rounded-2xl bg-gradient-royal grid place-items-center text-primary-foreground shadow-royal ring-1 ring-gold mb-3 group-hover:scale-105 transition-transform">
                  <s.icon className="w-6 h-6" />
                </div>
                <div className="text-base font-black">{s.title}</div>
                <div className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{s.subtitle}</div>
              </button>
            ))}
          </div>
        </>
      )}

      {section && (
        <button onClick={() => setSection(null)}
          className="inline-flex w-fit items-center gap-2 px-3 py-2 rounded-xl bg-secondary text-xs font-bold hover:bg-gold/15">
          <ArrowRight className="w-3.5 h-3.5" /> رجوع للقائمة الرئيسية
        </button>
      )}

      {section === "platform" && (
        <>
          <SectionHeader icon={CreditCard} title="مركز التحكم بالمنصة" subtitle="بوابات الدفع · الخدمات · التسعير الديناميكي · بانرات العميل" />
          <PlatformControlCenter readOnly={isReadOnly} />
        </>
      )}

      {section === "tracking" && (
      <>
      {/* ===== Section: Live tracking & operations ===== */}
      <SectionHeader icon={Navigation2} title="التتبع والعمليات المباشرة" subtitle="خريطة الكباتن على مستوى الجمهورية والطلبات اللحظية" />

      {/* National captain tracking map — live movement per zone */}
      <div className="p-4 rounded-2xl border-2 border-gold/40 bg-card shadow-card">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-royal grid place-items-center text-primary-foreground shadow-royal ring-1 ring-gold">
            <Navigation2 className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="text-sm font-bold">خريطة تتبع الكباتن — الجمهورية</div>
            <div className="text-[11px] text-muted-foreground">تحركات مباشرة لكل زون (مراكز وأقاليم)</div>
          </div>
          <span className="ms-auto px-2 py-1 rounded-full bg-success/15 text-success text-[11px] font-bold flex items-center gap-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
            {trackedCaptains.filter((c) => c.online).length} مباشر
          </span>
        </div>
        <CaptainTrackingMap captains={trackedCaptains} height={420} />
      </div>

      {/* Cloud Live Orders — Postgres realtime stream */}
      <div className="p-4 rounded-2xl border-2 border-gold/40 bg-card shadow-card">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
            </span>
            <Radio className="w-4 h-4 text-gold" />
            <div className="text-sm font-bold">الطلبات المباشرة السحابية <span className="text-[10px] text-muted-foreground font-normal">(تحديث لحظي · آمن حسب الزون)</span></div>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="px-2 py-1 rounded-full bg-success/15 text-success font-bold flex items-center gap-1">
              <Zap className="w-3 h-3" />{cloud.liveCount} نشط
            </span>
            <span className="px-2 py-1 rounded-full bg-secondary font-bold">{cloud.orders.length} حديثة</span>
            <span className={cn("px-2 py-1 rounded-full font-bold", cloud.loaded ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>
              {cloud.loaded ? "● متصل" : "جارٍ الاتصال…"}
            </span>
          </div>
        </div>
        {cloud.lastEvent && (
          <div className="mb-2 p-2 rounded-lg bg-gold/10 border border-gold/40 text-[11px] font-semibold flex items-center gap-2">
            <Activity className="w-3 h-3 text-gold" />
            <span className="uppercase tracking-wider">{cloud.lastEvent.type}</span>
            <span>#{cloud.lastEvent.row.id.slice(0, 8)}</span>
            <span className="text-muted-foreground">· {cloud.lastEvent.row.service}</span>
            <span className="text-muted-foreground">· {ORDER_STATUS_AR[cloud.lastEvent.row.status] ?? cloud.lastEvent.row.status}</span>
            {cloud.lastEvent.row.zone && <span className="ms-auto text-muted-foreground">{cloud.lastEvent.row.zone}</span>}
          </div>
        )}
        <div className="max-h-48 overflow-y-auto divide-y divide-border/50 text-xs">
          {cloud.orders.length === 0 && (
            <div className="py-6 text-center text-muted-foreground text-[11px]">
              لا توجد طلبات سحابية بعد. بمجرد أن يكتب تطبيق كابتن أو تاجر إلى السحابة، ستظهر هنا فورًا.
            </div>
          )}
          {cloud.orders.slice(0, 12).map((o) => (
            <div key={o.id} className="py-2 flex items-center gap-2">
              <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold",
                o.status === "pending" && "bg-warning/20 text-warning",
                o.status === "accepted" && "bg-primary/20 text-primary",
                o.status === "completed" && "bg-success/20 text-success",
                o.status === "cancelled" && "bg-destructive/20 text-destructive",
              )}>{ORDER_STATUS_AR[o.status] ?? o.status}</span>
              <span className="font-bold">#{o.id.slice(0, 6)}</span>
              <span className="text-muted-foreground">{o.service}</span>
              {o.zone && <span className="ms-auto text-[10px] text-muted-foreground">{o.zone}</span>}
              <span className="text-gold font-bold">{Number(o.fare_egp).toFixed(0)} {t("egp")}</span>
            </div>
          ))}
        </div>
      </div>

      </>
      )}

      {section === "pricing" && (
      <>
      {/* ===== Section: Pricing & commissions ===== */}
      <SectionHeader icon={Sliders} title="الأسعار والعمولات" subtitle="مؤشر الوقود، تقسيم الأرباح، تسعير الأسطول وعمولات المحلات" />

      <div className="grid lg:grid-cols-2 gap-5">
        <Card title={t("fuelIndex")} icon={Fuel}>
          <div className="text-3xl font-bold mb-3 text-gold">×{state.fuelIndex.toFixed(2)}</div>
          <input type="range" min={0.6} max={1.8} step={0.01} value={state.fuelIndex}
            onChange={(e) => dispatch({ type: "setFuel", v: +e.target.value })}
            className="w-full accent-[var(--primary)]" />
          <div className="grid grid-cols-3 mt-3 gap-2 text-[11px] text-center">
            {(["motorbike","car","winsh"] as VehicleType[]).map((v) => (
              <div key={v} className="p-2 rounded-lg bg-secondary">
                <div className="text-muted-foreground capitalize">{v}</div>
                <div className="font-bold">{(state.pricing[v].perKm * state.fuelIndex).toFixed(1)} {t("perKm")}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card title={t("splitEngine")} icon={Sliders}>
          <div className="relative h-7 rounded-full bg-secondary overflow-hidden ring-1 ring-gold">
            <div className="absolute inset-y-0 start-0 bg-gradient-royal transition-all" style={{ width: `${pendingSplit}%` }} />
            <div className="absolute inset-y-0 end-0 bg-gradient-gold transition-all" style={{ width: `${100 - pendingSplit}%` }} />
          </div>
          <div className="flex justify-between text-[11px] mt-2 font-bold">
            <span>{pendingSplit}% {t("central")}</span>
            <span>{100 - pendingSplit}% {t("partners")}</span>
          </div>
          <input type="range" min={10} max={90} value={pendingSplit} disabled={isReadOnly}
            onChange={(e) => setPendingSplit(+e.target.value)} className="w-full mt-3 disabled:opacity-40" />
          <div className="flex items-center justify-between gap-2 mt-2">
            <span className="text-[10px] text-muted-foreground">
              {splitDirty ? `قيد الحفظ · المعتمد: ${state.splitCentralPct}/${state.splitPartnerPct}` : `مباشر · ${state.splitCentralPct}/${state.splitPartnerPct}`}
            </span>
            <button onClick={requestCommissionSave} disabled={!splitDirty || isReadOnly}
              className="px-3 py-1.5 rounded-lg bg-gradient-royal text-primary-foreground text-xs font-bold disabled:opacity-40 flex items-center gap-1">
              <Check className="w-3 h-3" />{t("saveChanges")}
            </button>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            {Object.entries(state.walletPartner).map(([z, v]) => (
              <div key={z} className="p-2 rounded-lg bg-secondary flex flex-col">
                <span className="text-[10px] text-muted-foreground">{z}</span>
                <span className="font-bold text-gold">{v.toFixed(0)} {t("egp")}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title={t("pricingManager")} icon={Sliders} wide>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-muted-foreground border-b">
                <th className="text-start py-2">المركبة</th>
                <th>{t("basePrice")}</th>
                <th>{t("perKmRate")}</th>
                <th>{t("commission")}</th>
                <th>{t("outOfZoneFee")}</th>
              </tr></thead>
              <tbody>
                {vehicleList.map((v) => {
                  const p = state.pricing[v];
                  return (
                    <tr key={v} className="border-b border-gold/10">
                      <td className="py-1.5 font-bold capitalize">{t(v)}</td>
                      <td><Stepper v={p.base} step={1} onBump={(d) => bumpPricing(v, "base", d)} disabled={isReadOnly} /></td>
                      <td><Stepper v={p.perKm} step={0.5} onBump={(d) => bumpPricing(v, "perKm", d)} disabled={isReadOnly} /></td>
                      <td><Stepper v={p.commissionPct} step={1} suffix="%" onBump={(d) => bumpPricing(v, "commissionPct", d)} disabled={isReadOnly} /></td>
                      <td><Stepper v={p.outOfZonePremium} step={1} onBump={(d) => bumpPricing(v, "outOfZonePremium", d)} disabled={isReadOnly} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title={t("merchantCommMgmt")} icon={Store} wide>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-muted-foreground border-b">
                <th className="text-start py-2">{t("role")}</th>
                <th className="text-start">{t("commission")} (%)</th>
                <th className="text-end">{t("changeLogged")}</th>
              </tr></thead>
              <tbody>
                {merchantCats.map((c) => {
                  const v = pendingMerch[c];
                  const dirty = v !== state.merchantCommissions[c];
                  const invalid = v < 0 || v > 50;
                  return (
                    <tr key={c} className="border-b border-gold/10">
                      <td className="py-2 font-bold">{t(catLabelKey[c])}</td>
                      <td>
                        <div className="inline-flex items-center gap-1 rounded-lg border bg-background overflow-hidden">
                          <button onClick={() => bumpMerch(c, -0.5)} disabled={isReadOnly}
                            className="w-7 h-7 grid place-items-center bg-secondary hover:bg-destructive/15 disabled:opacity-30 transition">
                            <Minus className="w-3 h-3" />
                          </button>
                          <input type="number" min={0} max={50} step={0.5}
                            value={v}
                            onChange={(e) => setMerch(c, e.target.value)}
                            disabled={isReadOnly}
                            className={cn("w-16 text-center text-xs font-bold tabular-nums bg-transparent outline-none py-1",
                              invalid && "text-destructive")} />
                          <button onClick={() => bumpMerch(c, 0.5)} disabled={isReadOnly}
                            className="w-7 h-7 grid place-items-center bg-secondary hover:bg-success/20 disabled:opacity-30 transition">
                            <Plus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-gold font-bold">%</span>
                        </div>
                        {invalid && <div className="text-[10px] text-destructive mt-1">{t("invalidPct")}</div>}
                      </td>
                      <td className="text-end text-[10px] text-muted-foreground">
                        {dirty ? <span className="text-gold font-bold">قيد الحفظ</span> : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">0% ≤ value ≤ 50% · {t("changeLogged")}</span>
            <button onClick={saveMerch} disabled={!merchDirty || merchInvalid || isReadOnly}
              className="px-3 py-1.5 rounded-lg bg-gradient-royal text-primary-foreground text-xs font-bold disabled:opacity-40 flex items-center gap-1">
              <Check className="w-3 h-3" />{t("saveChanges")}
            </button>
          </div>
        </Card>
      </div>

      </>
      )}

      {section === "finance" && (
      <>
      {/* ===== Section: Finance & settlements ===== */}
      <SectionHeader icon={Wallet} title="المالية والتسويات" subtitle="الشيت الرئيسي للفروع والدفتر المالي للكباتن والشركاء" />

      <div className="grid lg:grid-cols-2 gap-5">
        <Card title={t("masterSheet")} icon={TrendingUp} wide>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-muted-foreground border-b">
                <th className="text-start py-2">{t("branch")}</th>
                <th>{t("activeMerchants")}</th><th>{t("activeDrivers")}</th>
                <th>{t("completedOrders")}</th>
                <th className="text-end">{t("partnerProfit")}</th>
                <th className="text-end">{t("centralProfit")}</th>
                <th className="text-end text-destructive">{t("leakage")}</th>
              </tr></thead>
              <tbody>
                {branchRows.map((r) => (
                  <tr key={r.zone} className="border-b border-gold/10">
                    <td className="py-1.5 font-bold">{r.zone}<div className="text-[10px] text-muted-foreground font-normal">{r.partner}</div></td>
                    <td className="text-center">{r.merchants}</td>
                    <td className="text-center">{r.captains}</td>
                    <td className="text-center">{r.completed}</td>
                    <td className="text-end font-bold text-gold">{r.partnerProfit.toFixed(0)}</td>
                    <td className="text-end font-bold text-primary">{r.centralProfit.toFixed(0)}</td>
                    <td className="text-end font-bold text-destructive">{r.leakage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="تسويات المكتبة الرقمية" icon={Wallet} wide>
          <div className="text-[11px] text-muted-foreground mb-2">
            تقسيم فوري (Split Payments) لمبيعات الكتب — النسبة مقروءة من "إدارة عمولات المحلات · الناشرون والمكتبة الرقمية" ({state.merchantCommissions.publisher}%).
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-muted-foreground border-b">
                <th className="text-start py-2">الناشر</th>
                <th className="text-end">مبيعات الكتب</th>
                <th className="text-end">عمولة المنصة</th>
                <th className="text-end">صافي الناشر</th>
                <th className="text-center">IBAN</th>
                <th className="text-center">الحالة</th>
              </tr></thead>
              <tbody>
                {(() => {
                  const pct = state.merchantCommissions.publisher;
                  const demo = [
                    { name: "دار الشروق", iban: "EG38 0011 0000 0000 1234 5678 901", gross: 12480 },
                    { name: "دار المعارف", iban: "EG21 0022 0000 0000 9876 5432 100", gross: 8320 },
                    { name: "المؤلف: د. أحمد يوسف", iban: "EG55 0033 0000 0000 5544 3322 110", gross: 3600 },
                  ];
                  return demo.map((p) => {
                    const commission = Math.round(p.gross * pct / 100);
                    const net = p.gross - commission;
                    return (
                      <tr key={p.iban} className="border-b border-gold/10">
                        <td className="py-2 font-bold">{p.name}</td>
                        <td className="text-end tabular-nums">{p.gross.toLocaleString()}</td>
                        <td className="text-end tabular-nums text-primary font-bold">{commission.toLocaleString()}</td>
                        <td className="text-end tabular-nums text-gold font-bold">{net.toLocaleString()}</td>
                        <td className="text-center font-mono text-[10px] text-muted-foreground">{p.iban}</td>
                        <td className="text-center"><span className="px-2 py-0.5 rounded-full bg-success/15 text-success text-[10px] font-bold">جاهز للتحويل</span></td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="الدفتر المالي · Financial Ledger" icon={Wallet} wide>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-muted-foreground border-b">
                <th className="text-start py-2">النوع</th>
                <th className="text-start">الاسم</th>
                <th className="text-start">المعرّف</th>
                <th className="text-end">الرصيد (ج.م)</th>
                <th className="text-center">إجراء</th>
              </tr></thead>
              <tbody>
                {state.drivers.map((d) => {
                  const bal = state.walletDriver[d.id] ?? 0;
                  return (
                    <tr key={`drv-${d.id}`} className="border-b border-gold/10">
                      <td className="py-2"><span className="px-1.5 py-0.5 rounded bg-secondary text-[10px] font-bold">كابتن</span></td>
                      <td className="font-bold">{d.name}<div className="text-[10px] text-muted-foreground font-normal">{d.zone} · {d.vehicle}</div></td>
                      <td className="font-mono text-[10px] text-gold">{d.prefix ?? d.plate}</td>
                      <td className={cn("text-end font-bold tabular-nums", bal < 0 ? "text-destructive" : "text-success")}>{bal.toFixed(0)}</td>
                      <td className="text-center">
                        <div className="inline-flex gap-1.5 justify-center">
                          <button onClick={() => openLedger("driver", d.id, d.name, 1)} disabled={isReadOnly}
                            className="w-8 h-8 grid place-items-center rounded-lg bg-gradient-gold text-gold-foreground shadow-elegant disabled:opacity-40" title="إضافة رصيد / مكافأة">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => openLedger("driver", d.id, d.name, -1)} disabled={isReadOnly}
                            className="w-8 h-8 grid place-items-center rounded-lg text-primary-foreground shadow-elegant disabled:opacity-40"
                            style={{ background: "linear-gradient(135deg, oklch(0.72 0.05 180), oklch(0.55 0.15 155))" }} title="خصم / غرامة">
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {state.zonePartners.map((p) => {
                  const bal = state.walletPartner[p.zone] ?? 0;
                  return (
                    <tr key={`prt-${p.nationalId}`} className="border-b border-gold/10">
                      <td className="py-2"><span className="px-1.5 py-0.5 rounded bg-gold/20 text-[10px] font-bold">شريك</span></td>
                      <td className="font-bold">{p.name}<div className="text-[10px] text-muted-foreground font-normal">{p.zone}</div></td>
                      <td className="font-mono text-[10px] text-gold">{p.nationalId}</td>
                      <td className={cn("text-end font-bold tabular-nums", bal < 0 ? "text-destructive" : "text-gold")}>{bal.toFixed(0)}</td>
                      <td className="text-center">
                        <div className="inline-flex gap-1.5 justify-center">
                          <button onClick={() => openLedger("partner", p.zone, p.name, 1)} disabled={isReadOnly}
                            className="w-8 h-8 grid place-items-center rounded-lg bg-gradient-gold text-gold-foreground shadow-elegant disabled:opacity-40" title="إضافة رصيد / مكافأة">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => openLedger("partner", p.zone, p.name, -1)} disabled={isReadOnly}
                            className="w-8 h-8 grid place-items-center rounded-lg text-primary-foreground shadow-elegant disabled:opacity-40"
                            style={{ background: "linear-gradient(135deg, oklch(0.72 0.05 180), oklch(0.55 0.15 155))" }} title="خصم / غرامة">
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-[10px] text-muted-foreground flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-gradient-gold inline-block" /> ذهبي = إضافة رصيد / مكافأة
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "linear-gradient(135deg, oklch(0.72 0.05 180), oklch(0.55 0.15 155))" }} /> فضّي / زمردي = خصم / غرامة
          </div>
        </Card>
      </div>

      </>
      )}

      {section === "team" && (
      <>
      {/* ===== Section: Team, partners & approvals ===== */}
      <SectionHeader icon={Users} title="الفريق والشركاء والاعتمادات" subtitle="إدارة الموظفين، طابور الموافقات، ومزودي الخدمة الطبية" />

      {/* ===== Publisher & author account generator (platform-direct) ===== */}
      <PublisherAccountsCenter defaultCommission={state.merchantCommissions.publisher} readOnly={isReadOnly} />

      {/* ===== Region partners breakdown (governorate → centers) ===== */}
      <PartnersByRegion partners={state.zonePartners} />



      <div className="grid lg:grid-cols-2 gap-5">
        <Card title={t("staffMgmt")} icon={Users}>
          <div className="space-y-2">
            {state.adminStaff.map((s) => (
              <div key={s.id} className="p-2.5 rounded-lg bg-secondary/50 text-xs">
                <div className="font-bold">{s.name} · <span className="text-gold uppercase">{s.role}</span></div>
                <div className="text-muted-foreground text-[10px] font-mono">{s.nationalId} · {s.phone}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t space-y-2">
            <input placeholder={t("name")} value={staffForm.name} onChange={(e) => setStaffForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-2 py-1.5 rounded-md border text-xs bg-background" />
            <div className="grid grid-cols-2 gap-2">
              <input placeholder={t("phone")} value={staffForm.phone} onChange={(e) => setStaffForm((f) => ({ ...f, phone: e.target.value }))}
                className="px-2 py-1.5 rounded-md border text-xs bg-background" />
              <select value={staffForm.role} onChange={(e) => setStaffForm((f) => ({ ...f, role: e.target.value as any }))}
                className="px-2 py-1.5 rounded-md border text-xs bg-background">
                <option value="ops">ops</option><option value="finance">finance</option><option value="support">support</option><option value="compliance">compliance</option>
              </select>
            </div>
            <input placeholder={t("nationalId")} value={staffForm.nationalId} onChange={(e) => setStaffForm((f) => ({ ...f, nationalId: e.target.value.replace(/\D/g, "").slice(0, 14) }))}
              className="w-full px-2 py-1.5 rounded-md border text-xs bg-background font-mono tracking-widest" />
            <button onClick={addStaff} className="w-full px-3 py-1.5 rounded-lg bg-gradient-royal text-primary-foreground text-xs font-bold">{t("addStaff")}</button>
            <div className="text-[10px] text-muted-foreground">{t("featureLocks")}: ops=full · finance=ledger+payouts · support=read-only · compliance=fraud+sos</div>
          </div>
        </Card>

        <Card title={t("approvalQueue")} icon={KeyRound}>
          {state.applications.length === 0 && <div className="text-center text-xs text-muted-foreground py-6">—</div>}
          <div className="space-y-2">
            {state.applications.map((a) => (
              <div key={a.id} className="p-3 rounded-xl border bg-secondary/30">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="text-sm font-bold">{a.targetName} <span className="text-[10px] text-muted-foreground">· {a.targetRole}</span></div>
                    <div className="text-[11px] text-muted-foreground">{a.zone} · {a.phone}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input placeholder={t("password")} value={pwd[a.id] || ""} onChange={(e) => setPwd((x) => ({ ...x, [a.id]: e.target.value }))}
                      className="px-2 py-1 rounded-md border text-xs bg-background font-mono w-32" />
                    <button onClick={() => approve(a.id)} className="px-2.5 py-1 rounded-lg bg-success text-success-foreground text-xs font-bold flex items-center gap-1"><Check className="w-3 h-3" />{t("pushCredentials")}</button>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <input placeholder="سبب الرفض" value={reason[a.id] || ""} onChange={(e) => setReason((x) => ({ ...x, [a.id]: e.target.value }))}
                    className="flex-1 px-2 py-1 rounded-md border text-xs bg-background" />
                  <button onClick={() => reject(a.id)} className="px-2.5 py-1 rounded-lg bg-destructive text-destructive-foreground text-xs font-bold flex items-center gap-1"><XIcon className="w-3 h-3" />{t("pushRejection")}</button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="p-4 rounded-2xl bg-card border-2 border-gold/40 shadow-card">
        <div className="text-sm font-bold mb-3 flex items-center gap-2"><Stethoscope className="w-4 h-4 text-gold" />طلبات مقدمي الخدمة الطبية / التجميلية بانتظار الموافقة</div>
        {state.partnerApplications.filter((a) => a.kind === "medical" && a.status === "pending").length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-4">لا توجد طلبات بانتظار الموافقة</div>
        ) : (
          <div className="space-y-2">
            {state.partnerApplications.filter((a) => a.kind === "medical" && a.status === "pending").map((app) => (
              <div key={app.id} className="p-3 rounded-xl border bg-secondary/40 flex flex-wrap items-center gap-3">
                {app.promoImage && <img src={app.promoImage} alt={app.name} className="w-14 h-14 rounded-lg object-cover border border-gold/40" />}
                <div className="flex-1 min-w-[180px]">
                  <div className="text-sm font-bold">{app.name}</div>
                  <div className="text-[11px] text-muted-foreground">{app.operationType} · {app.specializationLabel}</div>
                  <div className="text-[10px] text-muted-foreground">{app.governorate} · {app.phone}</div>
                </div>
                <div className="flex gap-1.5">
                  <button disabled={isReadOnly} onClick={() => { dispatch({ type: "decidePartnerApp", appId: app.id, approve: true }); logAction("medical_provider_approved", `${app.name} · ${app.specializationLabel}`); }}
                    className="px-3 py-1.5 rounded-lg bg-success/15 text-success text-xs font-bold border border-success/40 disabled:opacity-40">اعتماد</button>
                  <button disabled={isReadOnly} onClick={() => { const r = prompt("سبب الرفض؟") || "غير مطابق للشروط"; dispatch({ type: "decidePartnerApp", appId: app.id, approve: false, reason: r }); logAction("medical_provider_rejected", `${app.name} · ${r}`); }}
                    className="px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-bold border border-destructive/40 disabled:opacity-40">رفض</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      </>
      )}

      {section === "safety" && (
      <>
      {/* ===== Section: Safety, SOS & audit ===== */}
      <SectionHeader icon={Shield} title="الطوارئ والأمان والتدقيق" subtitle="نداءات الاستغاثة، سجلات الاحتيال، وسجل التدقيق غير القابل للتعديل" />

      <div className="grid lg:grid-cols-2 gap-5">
        <Card title={t("sosRoom")} icon={Siren} wide>
          {state.sosEvents.length === 0 ? (
            <div className="text-center text-xs text-success py-6 font-semibold">✓ {t("noSos")}</div>
          ) : (
            <div className="space-y-2">
              {state.sosEvents.map((e) => (
                <div key={e.id} className="p-3 rounded-xl bg-destructive/15 border border-destructive flash-alert text-xs font-bold flex items-center gap-3">
                  <Siren className="w-4 h-4 text-destructive" />
                  <span>{e.customer} · {e.zone}</span>
                  <span className="ms-auto text-[10px] opacity-80">{new Date(e.ts).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title={`${t("safetyLogs")} · ${t("fraudLogs")}`} icon={AlertOctagon} wide>
          <div className="space-y-1.5 max-h-72 overflow-auto">
            {state.logs.map((l) => (
              <div key={l.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/40 text-xs">
                <span className={"w-1.5 h-1.5 rounded-full " + (l.type === "sos" ? "bg-destructive animate-pulse" : l.type === "fraud" ? "bg-warning" : l.type === "escrow" ? "bg-gold" : "bg-primary")} />
                <span className="flex-1">{l.msg}</span>
                {l.zone && <span className="text-[10px] text-muted-foreground">{l.zone}</span>}
                <span className="text-[10px] text-muted-foreground">{new Date(l.ts).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title={t("auditPanel")} icon={History} wide>
          {state.auditLog.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground py-6">{t("noAuditYet")}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="text-muted-foreground border-b">
                  <th className="text-start py-2">{t("actionId")}</th>
                  <th className="text-start">{t("timestamp")}</th>
                  <th className="text-start">{t("actionBy")}</th>
                  <th className="text-start">{t("actionType")}</th>
                  <th className="text-start">{t("actionDetails")}</th>
                </tr></thead>
                <tbody>
                  {state.auditLog.slice(0, 30).map((e) => (
                    <tr key={e.id} className="border-b border-gold/10 select-none" title="Read-only · immutable">
                      <td className="py-1.5 font-mono text-gold">#ACT-{e.seq}</td>
                      <td className="font-mono text-[10px] text-muted-foreground">{new Date(e.ts).toLocaleString()}</td>
                      <td className="font-bold">{e.partnerName}</td>
                      <td><span className="px-1.5 py-0.5 rounded bg-secondary text-[10px] font-mono">{e.actionType}</span></td>
                      <td className="text-muted-foreground">{e.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-2 text-[10px] text-muted-foreground flex items-center gap-1"><Lock className="w-3 h-3" /> إضافة فقط · لا يُسمح بالتعديل أو الحذف</div>
            </div>
          )}
        </Card>
      </div>

      </>
      )}

      {section === "demo" && (
      <>
      {/* ===== Section: Demo accounts ===== */}
      <SectionHeader icon={KeyRound} title="الحسابات التجريبية" subtitle="حسابات مراجعي المتاجر (App Store / Google Play) بكلمة مرور موحّدة" />

      {/* Demo account seeding for App Store / Play Store reviewers */}
      <div className="p-4 rounded-2xl border-2 border-primary/40 bg-card shadow-card">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <UserCog className="w-4 h-4 text-gold" />
            <div>
              <div className="text-sm font-bold">حسابات تجريبية لمراجعي المتاجر</div>
              <div className="text-[11px] text-muted-foreground">عميل · كابتن · تاجر — كلمة مرور موحّدة لاعتماد المراجعة الفوري على Google Play و App Store.</div>
            </div>
          </div>
          <button onClick={runSeed} disabled={seedBusy || isReadOnly}
            className="px-4 py-2 rounded-xl bg-gradient-royal text-primary-foreground text-xs font-bold flex items-center gap-1 shadow-royal disabled:opacity-50">
            <UserPlus className="w-3.5 h-3.5" />{seedBusy ? "جارٍ الإنشاء…" : "إنشاء / تحديث الحسابات التجريبية"}
          </button>
        </div>
        {seedResult && (
          <div className="mt-3 p-3 rounded-xl bg-secondary/40 border border-border space-y-2">
            <div className="text-[11px] font-bold">كلمة المرور الموحّدة: <span className="text-gold font-mono">{seedResult.password}</span></div>
            <div className="space-y-1">
              {seedResult.accounts.map((a) => (
                <div key={a.email} className="flex items-center gap-2 text-[11px]">
                  <span className={cn("px-1.5 py-0.5 rounded font-bold",
                    a.status === "created" && "bg-success/20 text-success",
                    a.status === "existing" && "bg-primary/20 text-primary",
                    a.status === "error" && "bg-destructive/20 text-destructive",
                  )}>{SEED_STATUS_AR[a.status] ?? a.status}</span>
                  <span className="font-bold">{a.role}</span>
                  <span className="font-mono">{a.email}</span>
                  {a.message && <span className="text-destructive">· {a.message}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      </>
      )}



      <AddRegionPartnerModal
        open={partnerOpen}
        onClose={() => setPartnerOpen(false)}
        assignedCenters={new Set(state.zonePartners.map((p) => p.center).filter(Boolean) as string[])}
        onCreate={(payload) => {
          dispatch({ type: "addZonePartnerFull", p: payload.partner });
          logAction("region_partner_created",
            `${payload.partner.name} · ${payload.partner.governorate} / ${payload.partner.center} · user=${payload.partner.username}`);
          if (payload.applyAll) {
            syncPricingToGovernorate(payload.partner.governorate || "");
          }
        }}
      />


      {/* Confirm-save dialog */}
      {confirm && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur grid place-items-center px-4" onClick={() => setConfirm(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-card border-2 border-gold rounded-2xl shadow-royal max-w-sm w-full p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-gold" />
              <div className="font-bold text-base">{confirm.title}</div>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">{confirm.body}</div>
            <div className="mt-2 text-[11px] text-gold flex items-center gap-1"><Check className="w-3 h-3" /> {t("changeLogged")}</div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setConfirm(null)} className="flex-1 px-3 py-2 rounded-lg bg-secondary text-sm font-bold">{t("cancel")}</button>
              <button onClick={() => { confirm.run(); setConfirm(null); }} className="flex-1 px-3 py-2 rounded-lg bg-gradient-royal text-primary-foreground text-sm font-bold">{t("confirm")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Financial Ledger prompt */}
      {ledgerPrompt && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur grid place-items-center px-4" onClick={() => setLedgerPrompt(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-card border-2 border-gold rounded-2xl shadow-royal max-w-sm w-full p-5">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-gold" />
              <div className="font-bold text-base">
                {ledgerPrompt.sign > 0 ? "إضافة رصيد / مكافأة" : "خصم / غرامة"} — {ledgerPrompt.label}
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <label className="block">
                <div className="text-[11px] font-semibold text-muted-foreground mb-1">المبلغ (ج.م)</div>
                <input type="number" min={1} autoFocus value={ledgerPrompt.amount}
                  onChange={(e) => setLedgerPrompt((p) => p && ({ ...p, amount: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm" />
              </label>
              <label className="block">
                <div className="text-[11px] font-semibold text-muted-foreground mb-1">السبب / ملاحظة</div>
                <input value={ledgerPrompt.note}
                  onChange={(e) => setLedgerPrompt((p) => p && ({ ...p, note: e.target.value }))}
                  placeholder={ledgerPrompt.sign > 0 ? "مكافأة شهرية / مسح ديون" : "غرامة تشغيلية / كاش غير مُسلَّم"}
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm" />
              </label>
            </div>
            <div className="mt-2 text-[11px] text-gold flex items-center gap-1"><Check className="w-3 h-3" /> {t("changeLogged")}</div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setLedgerPrompt(null)} className="flex-1 px-3 py-2 rounded-lg bg-secondary text-sm font-bold">{t("cancel")}</button>
              <button onClick={submitLedger} className={cn("flex-1 px-3 py-2 rounded-lg text-sm font-bold text-primary-foreground", ledgerPrompt.sign > 0 ? "bg-gradient-gold text-gold-foreground" : "")}
                style={ledgerPrompt.sign < 0 ? { background: "linear-gradient(135deg, oklch(0.72 0.05 180), oklch(0.55 0.15 155))" } : undefined}>
                {ledgerPrompt.sign > 0 ? "تطبيق الإضافة" : "تطبيق الخصم"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <div className="w-10 h-10 shrink-0 rounded-2xl bg-gradient-royal grid place-items-center text-primary-foreground shadow-royal ring-1 ring-gold">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <h2 className="text-base font-black truncate">{title}</h2>
        {subtitle && <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>}
      </div>
      <div className="ms-2 flex-1 h-px bg-gradient-to-l from-gold/40 to-transparent" />
    </div>
  );
}

function Stepper({ v, step, suffix, onBump, disabled }: { v: number; step: number; suffix?: string; onBump: (d: number) => void; disabled?: boolean }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border bg-background overflow-hidden">
      <button onClick={() => onBump(-step)} disabled={disabled}
        className="w-6 h-6 grid place-items-center bg-secondary hover:bg-destructive/15 disabled:opacity-30 transition">
        <Minus className="w-3 h-3" />
      </button>
      <span className="w-14 text-center text-xs font-bold tabular-nums">{Number(v).toFixed(step < 1 ? 1 : 0)}{suffix ?? ""}</span>
      <button onClick={() => onBump(step)} disabled={disabled}
        className="w-6 h-6 grid place-items-center bg-secondary hover:bg-success/20 disabled:opacity-30 transition">
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}

function Big({ icon: Icon, label, value, gold }: any) {
  return (
    <div className={cn("p-4 rounded-2xl border shadow-elegant", gold ? "bg-gradient-gold text-gold-foreground" : "bg-gradient-surface")}>
      <div className="flex items-center gap-2 text-xs opacity-80"><Icon className="w-3.5 h-3.5" /> {label}</div>
      <div className="text-2xl font-bold mt-1.5">{value}</div>
    </div>
  );
}

function Card({ title, children, icon: Icon, wide }: { title: string; children: any; icon?: any; wide?: boolean }) {
  return (
    <div className={cn("p-5 rounded-2xl bg-card border shadow-card", wide && "lg:col-span-2")}>
      <div className="flex items-center gap-2 mb-3">
        {Icon && <Icon className="w-4 h-4 text-gold" />}
        <div className="text-sm font-bold">{title}</div>
      </div>
      {children}
    </div>
  );
}

type NewPartnerPayload = {
  partner: import("../store").ZonePartnerFull;
  applyAll: boolean;
};

function randomToken(len: number) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function AddRegionPartnerModal({
  open, onClose, assignedCenters, onCreate,
}: {
  open: boolean;
  onClose: () => void;
  assignedCenters: Set<string>;
  onCreate: (p: NewPartnerPayload) => void;
}) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [nid, setNid] = useState("");
  const [gov, setGov] = useState("");
  const [center, setCenter] = useState("");
  const [search, setSearch] = useState("");
  const [applyAll, setApplyAll] = useState(false);
  const [issued, setIssued] = useState<{ username: string; password: string } | null>(null);

  useEffect(() => {
    if (!open) {
      setName(""); setPhone(""); setEmail(""); setNid(""); setGov(""); setCenter("");
      setSearch(""); setApplyAll(false); setIssued(null);
    }
  }, [open]);

  const governorates = Object.keys(EGYPT_CENTERS);
  const centers = (EGYPT_CENTERS[gov] ?? []).filter((c) => c.toLowerCase().includes(search.toLowerCase()));

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validPhone = /^[0-9+\-\s]{7,15}$/.test(phone);
  const validNid = /^\d{14}$/.test(nid);
  const canSubmit = name.trim().length >= 3 && validPhone && validEmail && validNid && gov && center && !assignedCenters.has(center);

  const generate = () => {
    if (!canSubmit) return;
    const username = (name.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 12) || "partner") + "_" + randomToken(3).toLowerCase();
    const password = randomToken(10);
    setIssued({ username, password });
    onCreate({
      partner: {
        nationalId: nid, name, zone: center,
        phone, country: "EG", governorate: gov, center, username, password,
      },
      applyAll,
    });
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[65] bg-black/70 backdrop-blur grid place-items-center p-4 overflow-y-auto" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="bg-card border-2 border-gold rounded-2xl shadow-royal w-full max-w-2xl p-5 my-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-gold" />
            <div className="font-bold">{t("addRegionPartner")}</div>
          </div>
          <button onClick={onClose}><XIcon className="w-4 h-4" /></button>
        </div>

        {!issued && (
          <div className="mt-4 space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <Field label={t("fullName")}>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("fullName")}
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm" />
              </Field>
              <Field label={t("phone")}>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-1234-5678"
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm font-mono" />
              </Field>
              <Field label={t("emailAddr")}>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="partner@rava.app"
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm" />
              </Field>
              <Field label={t("nationalId")}>
                <input value={nid} onChange={(e) => setNid(e.target.value.replace(/\D/g, "").slice(0, 14))}
                  placeholder="14 digits" className="w-full px-3 py-2 rounded-lg border bg-background text-sm font-mono tracking-widest" />
              </Field>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <Field label={t("selectGovernorate")}>
                <select value={gov}
                  onChange={(e) => { setGov(e.target.value); setCenter(""); setSearch(""); }}
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
                  <option value="">— {t("selectGovernorate")} —</option>
                  {governorates.map((g) => (
                    <option key={g} value={g}>{g} ({EGYPT_CENTERS[g].length})</option>
                  ))}
                </select>
              </Field>
              <Field label={t("selectCenter")}>
                <div className="relative">
                  <Search className="absolute start-2 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("searchCenter")} disabled={!gov}
                    className="w-full ps-7 pe-3 py-2 rounded-lg border bg-background text-sm disabled:opacity-40" />
                </div>
              </Field>
            </div>

            {gov && (
              <div className="max-h-48 overflow-auto rounded-lg border bg-background/50 p-2 grid grid-cols-2 md:grid-cols-3 gap-1.5">
                {centers.length === 0 && (
                  <div className="col-span-full text-center text-xs text-muted-foreground py-4">—</div>
                )}
                {centers.map((c) => {
                  const locked = assignedCenters.has(c);
                  const active = center === c;
                  return (
                    <button key={c} type="button" disabled={locked}
                      onClick={() => setCenter(c)}
                      title={locked ? t("centerLocked") : t("available")}
                      className={cn(
                        "flex items-center justify-between gap-1 px-2 py-1.5 rounded-md text-[11px] border transition",
                        locked && "bg-destructive/10 border-destructive/30 text-muted-foreground cursor-not-allowed line-through",
                        !locked && active && "bg-gradient-royal text-primary-foreground border-gold font-bold",
                        !locked && !active && "bg-secondary hover:bg-gold/10",
                      )}>
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 shrink-0" />{c}
                      </span>
                      <span className="text-[9px] opacity-70">{locked ? t("assigned") : t("available")}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <label className="flex items-center gap-2 text-xs cursor-pointer p-2 rounded-lg bg-gold/10 border border-gold/30">
              <input type="checkbox" checked={applyAll} onChange={(e) => setApplyAll(e.target.checked)} />
              <span className="font-bold">{t("applyAllCenters")}</span>
              {gov && <span className="text-[10px] text-muted-foreground">· {EGYPT_CENTERS[gov]?.length ?? 0} centers</span>}
            </label>

            <div className="flex items-center gap-2 pt-2">
              <button onClick={onClose} className="flex-1 px-3 py-2.5 rounded-lg bg-secondary text-sm font-bold">{t("cancel")}</button>
              <button onClick={generate} disabled={!canSubmit}
                className="flex-1 px-3 py-2.5 rounded-lg bg-gradient-royal text-primary-foreground text-sm font-bold flex items-center justify-center gap-1 disabled:opacity-40">
                <Send className="w-3.5 h-3.5" />{t("generateAndSend")}
              </button>
            </div>
          </div>
        )}

        {issued && (
          <div className="mt-4 space-y-3">
            <div className="p-3 rounded-xl bg-success/15 border border-success text-success text-sm font-bold flex items-center gap-2">
              <Check className="w-4 h-4" /> {t("credentialsSent")}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-secondary">
                <div className="text-[10px] text-muted-foreground">{t("tempUsername")}</div>
                <div className="font-mono text-sm font-bold mt-1">{issued.username}</div>
              </div>
              <div className="p-3 rounded-xl bg-secondary">
                <div className="text-[10px] text-muted-foreground">{t("tempPassword")}</div>
                <div className="font-mono text-sm font-bold mt-1 text-gold">{issued.password}</div>
              </div>
            </div>
            <div className="text-[11px] text-warning flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> {t("mustChangeFirstLogin")}
            </div>
            {applyAll && (
              <div className="text-[11px] text-gold flex items-center gap-1">
                <Check className="w-3 h-3" /> {t("pricingSynced")}
              </div>
            )}
            <button onClick={onClose} className="w-full px-3 py-2.5 rounded-lg bg-gradient-royal text-primary-foreground text-sm font-bold">
              {t("confirm")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{label}</span>
      {children}
    </label>
  );
}

/* ============= Region Partners Breakdown ============= */
function PartnersByRegion({ partners }: { partners: import("../store").ZonePartnerFull[] }) {
  const grouped = partners.reduce<Record<string, Record<string, number>>>((acc, p) => {
    const gov = (p.governorate && p.governorate.trim()) || "غير محدد";
    const center = (p.center && p.center.trim()) || p.zone || "غير محدد";
    acc[gov] = acc[gov] || {};
    acc[gov][center] = (acc[gov][center] || 0) + 1;
    return acc;
  }, {});
  const govs = Object.keys(grouped).sort();
  const totalPartners = partners.length;
  const totalGovs = govs.length;
  const totalCenters = govs.reduce((n, g) => n + Object.keys(grouped[g]).length, 0);

  return (
    <div className="p-4 rounded-2xl bg-card border-2 border-gold/40 shadow-card">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="text-sm font-bold flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gold" /> شركاء المناطق حسب المحافظة والمركز
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="px-2 py-1 rounded-lg bg-gradient-royal text-primary-foreground font-bold">{totalPartners} شريك</span>
          <span className="px-2 py-1 rounded-lg bg-gold text-gold-foreground font-bold">{totalGovs} محافظة</span>
          <span className="px-2 py-1 rounded-lg bg-secondary font-bold">{totalCenters} مركز</span>
        </div>
      </div>
      {govs.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-6">لا يوجد شركاء مسجّلين بعد</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {govs.map((g) => {
            const centers = Object.entries(grouped[g]).sort((a, b) => b[1] - a[1]);
            const govCount = centers.reduce((n, [, v]) => n + v, 0);
            return (
              <div key={g} className="p-3 rounded-xl bg-secondary/40 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[13px] font-bold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gold" /> {g}
                  </div>
                  <span className="text-[10px] font-bold text-gold-foreground bg-gold px-2 py-0.5 rounded-md">{govCount}</span>
                </div>
                <div className="space-y-1">
                  {centers.map(([c, n]) => (
                    <div key={c} className="flex items-center justify-between text-[11px] px-2 py-1 rounded-md bg-background/60">
                      <span className="truncate">{c}</span>
                      <span className="font-bold text-gold">{n}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

