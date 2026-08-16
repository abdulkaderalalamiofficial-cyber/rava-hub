import { useEffect, useMemo, useState } from "react";
import { useI18n } from "../i18n";
import { useStore } from "../store";
import { Phone, Bell, CheckCircle2, Wallet, TrendingUp, Package, Volume2, Plus, X, MapPin, Truck, Info, BookOpen, Megaphone, Settings, Landmark, LogIn, LogOut, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { MerchantCatalog, type CatalogItem, type MerchantType } from "../components/MerchantCatalog";
import { MerchantMedia } from "../components/MerchantMedia";
import { BOOKS } from "../data/booksSeed";
import { loadPublisherAccounts } from "../data/publisherAccounts";

const BANK_KEY = "rava_merchant_bank";
const TYPE_KEY = "rava_merchant_type";
const AUTH_KEY = "rava_merchant_auth";
type BankInfo = { bankName: string; accountName: string; accountNumber: string; iban: string };
type MerchantSession = { name: string; type: MerchantType };

// Demo accounts — recognized on login and drive account-type auto-detection.
const MERCHANT_ACCOUNTS: { user: string; pass: string; name: string; type: MerchantType }[] = [
  { user: "merchant",  pass: "rava123",  name: "متجر رافا التجاري", type: "store" },
  { user: "spare",     pass: "spare123", name: "معرض رافا لقطع الغيار", type: "spare" },
  { user: "publisher", pass: "books123", name: "دار الشروق",        type: "publisher" },
  { user: "author",    pass: "author123", name: "د. أحمد يوسف",     type: "publisher" },
];

export function MerchantApp() {
  const { t } = useI18n();
  const { state, dispatch } = useStore();

  // ==== Login gate — auto-detects account type ====
  const [session, setSession] = useState<MerchantSession | null>(() => {
    if (typeof window === "undefined") return null;
    try { return JSON.parse(localStorage.getItem(AUTH_KEY) || "null"); } catch { return null; }
  });
  useEffect(() => {
    try {
      if (session) localStorage.setItem(AUTH_KEY, JSON.stringify(session));
      else localStorage.removeItem(AUTH_KEY);
      if (session) localStorage.setItem(TYPE_KEY, session.type);
    } catch {}
  }, [session]);

  const merchant = state.merchants[0];
  const orders = state.orders.filter((o) => o.merchantId === merchant?.id);
  const todayOrders = orders.length;
  const revenue = orders.reduce((s, o) => s + o.fareEgp, 0);
  const commissionPct = merchant ? 15 : 0;
  const commission = Math.round(revenue * commissionPct / 100);
  const netDue = revenue - commission;
  const hasIncoming = orders.some((o) => o.status === "pending" || o.status === "accepted");

  const [showFleet, setShowFleet] = useState(false);
  const [tab, setTab] = useState<"orders" | "catalog" | "media">("orders");
  const merchantType: MerchantType = session?.type ?? "store";
  const [showSettings, setShowSettings] = useState(false);
  const [bank, setBank] = useState<BankInfo>(() => {
    if (typeof window === "undefined") return { bankName: "", accountName: "", accountNumber: "", iban: "" };
    try { return JSON.parse(localStorage.getItem(BANK_KEY) || "null") || { bankName: "", accountName: "", accountNumber: "", iban: "" }; }
    catch { return { bankName: "", accountName: "", accountNumber: "", iban: "" }; }
  });
  const saveBank = () => { try { localStorage.setItem(BANK_KEY, JSON.stringify(bank)); } catch {} setShowSettings(false); };
  const [catalog, setCatalog] = useState<CatalogItem[]>(() => merchantType === "publisher" ? seedBooks() : merchantType === "spare" ? seedParts(2000) : seedStore());
  // Reload catalog when session type changes.
  useEffect(() => {
    setCatalog(merchantType === "publisher" ? seedBooks() : merchantType === "spare" ? seedParts(2000) : seedStore());
  }, [merchantType]);
  const [extPhone, setExtPhone] = useState("");
  const [extAddress, setExtAddress] = useState("");
  const [extSubmitted, setExtSubmitted] = useState<null | { id: string; perKm: number }>(null);
  const perKmExternal = state.pricing?.dababa?.perKm ?? 6;
  const publisherPct = state.merchantCommissions?.publisher ?? 15;

  // Digital sales earnings (publisher) — derived from catalog items marked digital
  const digitalRevenue = useMemo(() => {
    if (merchantType !== "publisher") return 0;
    // Demo: assume each digital item sold ~ (i%5) copies at effective price
    return catalog.reduce((s, it) => {
      if (!it.digital && merchantType !== "publisher") return s;
      const price = it.discountActive && it.discountPrice ? it.discountPrice : it.price;
      const sold = (parseInt(it.id.split("-")[1] || "0", 10) % 5);
      return s + price * sold;
    }, 0);
  }, [catalog, merchantType]);
  const digitalCommission = Math.round(digitalRevenue * publisherPct / 100);
  const digitalNet = digitalRevenue - digitalCommission;

  const submitFleet = () => {
    if (!/^01[0125]\d{8}$/.test(extPhone.replace(/\s|-/g, "")) || !extAddress.trim()) return;
    const id = "EXT-" + Math.random().toString(36).slice(2, 7).toUpperCase();
    setExtSubmitted({ id, perKm: perKmExternal });
    setExtPhone(""); setExtAddress("");
  };

  if (!session) {
    return <MerchantLogin onLogin={setSession} />;
  }

  return (
    <div className="space-y-5">

      {/* Top actions: tabs + settings gear (account type auto-detected via localStorage) */}
      <div className="flex gap-2 flex-wrap items-center">
        <button onClick={() => setTab("orders")}
          className={cn("px-4 py-2 rounded-xl text-xs font-bold border-2 transition",
            tab === "orders" ? "bg-gradient-royal text-primary-foreground border-transparent" : "bg-card border-gold/30")}>
          الطلبات
        </button>
        <button onClick={() => setTab("catalog")}
          className={cn("px-4 py-2 rounded-xl text-xs font-bold border-2 transition",
            tab === "catalog" ? "bg-gradient-royal text-primary-foreground border-transparent" : "bg-card border-gold/30")}>
          {merchantType === "publisher" ? "المكتبة الرقمية" : merchantType === "spare" ? "مخزون قطع الغيار" : "كتالوج المتجر"}
        </button>
        <button onClick={() => setTab("media")}
          className={cn("px-4 py-2 rounded-xl text-xs font-bold border-2 transition flex items-center gap-1.5",
            tab === "media" ? "bg-gradient-royal text-primary-foreground border-transparent" : "bg-card border-gold/30")}>
          <Megaphone className="w-3.5 h-3.5" /> الحملات الإعلانية
        </button>
        <button onClick={() => setShowSettings(true)} title="الإعدادات"
          className="ms-auto p-2 rounded-xl bg-card border-2 border-gold/30 hover:bg-secondary transition">
          <Settings className="w-4 h-4 text-gold" />
        </button>
      </div>

      {tab === "catalog" && (
        <div className="p-4 rounded-2xl bg-card border-2 border-emerald-200 shadow-card">
          <MerchantCatalog
            items={catalog}
            merchantType={merchantType}
            onQtyChange={(id, delta) => setCatalog((prev) => prev.map((x) => x.id === id ? { ...x, qty: Math.max(0, x.qty + delta) } : x))}
            onItemUpdate={(id, patch) => setCatalog((prev) => prev.map((x) => x.id === id ? { ...x, ...patch } : x))}
          />
        </div>
      )}

      {tab === "media" && (
        <div className="p-4 rounded-2xl bg-card border-2 border-emerald-200 shadow-card">
          <MerchantMedia />
        </div>
      )}

      {tab === "orders" && (
      <>
      {hasIncoming && (
        <div className="p-3 rounded-xl flash-alert border-2 border-gold flex items-center gap-3 font-bold text-sm">
          <Volume2 className="w-5 h-5" />
          <span>{t("newOrder")}!</span>
          <span className="ms-auto text-[11px] font-semibold opacity-90">{t("silentOverride")}</span>
        </div>
      )}

      {/* Request external fleet support + delivery-only notice — physical stores only */}
      {merchantType !== "publisher" && (
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => setShowFleet(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-royal text-primary-foreground font-bold text-sm shadow-royal hover:opacity-90 flex items-center gap-2">
            <Plus className="w-4 h-4" /> ➕ طلب طيار خارجي
          </button>
          <div className="px-3 py-2 rounded-xl bg-success/10 border border-success/40 text-success text-[11px] font-bold flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" /> تم حساب أجرة التوصيل فقط، عمولة البضاعة 0%
          </div>
          <div className="ms-auto text-[10px] text-muted-foreground flex items-center gap-1">
            <Truck className="w-3 h-3" /> سعر الكيلومتر الحالي:
            <b className="text-gold">{perKmExternal} {t("egp")}/كم</b>
            <span className="opacity-70">(مرتبط بغرفة التحكم المركزية [+/-])</span>
          </div>
        </div>
      )}

      {merchantType !== "publisher" ? (
        <div className="grid md:grid-cols-4 gap-4">
          <Stat icon={Package} label={t("ordersToday")} value={String(todayOrders)} accent />
          <Stat icon={TrendingUp} label={t("todayRevenue")} value={`${revenue} ${t("egp")}`} />
          <Stat icon={Wallet} label={t("commissionTaken")} value={`${commission} ${t("egp")}`} />
          <Stat icon={Wallet} label={t("netDue")} value={`${netDue} ${t("egp")}`} gold />
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          <Stat icon={BookOpen} label="إيراد الكتب اليوم" value={`${digitalRevenue.toLocaleString()} ${t("egp")}`} accent />
          <Stat icon={Wallet} label={`عمولة المنصة الرقمية (${publisherPct}%)`} value={`${digitalCommission.toLocaleString()} ${t("egp")}`} />
          <Stat icon={Wallet} label="صافي مبيعاتك الرقمية" value={`${digitalNet.toLocaleString()} ${t("egp")}`} gold />
        </div>
      )}

      {merchantType === "publisher" && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-[11px] text-emerald-900 flex items-center gap-2">
          <Landmark className="w-3.5 h-3.5" />
          تسوية تلقائية (Split Payments) لكل عملية شراء — يتم توزيع الأرباح فوراً بين المنصة وحسابك البنكي بناءً على النسبة المحددة في غرفة التحكم.
          {!bank.iban && (
            <button onClick={() => setShowSettings(true)} className="ms-auto px-2 py-1 rounded-lg bg-emerald-700 text-white font-bold">
              أضف حسابك البنكي
            </button>
          )}
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-4 h-4 text-gold" />
          <div className="text-sm font-bold">{t("incomingOrders")}</div>
        </div>
        {orders.length === 0 && (
          <div className="p-8 rounded-2xl border-2 border-dashed border-gold/40 text-center text-sm text-muted-foreground">
            {t("pending")}
          </div>
        )}
        <div className="space-y-3">
          {orders.map((o) => {
            const driver = o.driverId ? state.drivers.find((d) => d.id === o.driverId) : null;
            return (
              <div key={o.id} className={cn("p-4 rounded-2xl border shadow-card", (o.status === "pending" || o.status === "accepted") ? "bg-card border-gold" : "bg-card")}>
                {o.status === "accepted" && (
                  <div className="mb-3 p-2.5 rounded-lg bg-gold/15 border border-gold text-xs flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-gold" />
                    <span className="font-bold">{t("predictivePrep")}:</span> {t("prepStart")} 4 {t("minutes")}
                  </div>
                )}
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-sm">#{o.id.toUpperCase()} · {t(o.service)}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{o.dropoff}</div>
                    {o.rxImage && <div className="text-[10px] text-gold font-semibold mt-1">📎 {o.rxImage}</div>}
                  </div>
                  <div className="text-end">
                    <div className="text-lg font-bold">{o.fareEgp} <span className="text-[10px] text-muted-foreground">{t("egp")}</span></div>
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full",
                      o.status === "pending" ? "bg-warning/20 text-warning" : "bg-primary/20 text-primary")}>{o.status}</span>
                  </div>
                </div>

                {driver && (o.status === "accepted" || o.status === "preparing") && (
                  <div className="mt-3 p-3 rounded-xl bg-success/10 border border-success/40 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-royal text-primary-foreground grid place-items-center font-bold text-sm ring-1 ring-gold">
                      {driver.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold">{t("driverHere")}</div>
                      <div className="text-[11px] text-muted-foreground">{driver.name} · {driver.plate}</div>
                    </div>
                    <a href={`tel:${driver.phone}`} className="px-2.5 py-1.5 rounded-lg btn-gold text-xs font-bold flex items-center gap-1.5">
                      <Phone className="w-3 h-3" /> {driver.phone}
                    </a>
                  </div>
                )}

                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  {o.status === "preparing" && (
                    <button onClick={() => dispatch({ type: "advanceOrder", orderId: o.id, status: "enRoute" })}
                      className="px-3 py-1.5 rounded-lg bg-gradient-royal text-primary-foreground text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {t("markReady")}
                    </button>
                  )}
                  {!!o.cashChange && o.cashChange > 0 && (
                    <button onClick={() => dispatch({ type: "changeToCredit", orderId: o.id })}
                      className="px-3 py-1.5 rounded-lg btn-gold text-xs font-bold flex items-center gap-1.5">
                      <Wallet className="w-3.5 h-3.5" /> {t("changeIntoCredit")} ({o.cashChange} {t("egp")})
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fleet Support modal */}
      {showFleet && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center px-4" onClick={() => { setShowFleet(false); setExtSubmitted(null); }}>
          <div className="bg-card w-full max-w-md rounded-2xl border-2 border-gold shadow-royal p-5 space-y-4" onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="flex items-center justify-between">
              <div className="font-bold text-sm flex items-center gap-2">
                <Truck className="w-4 h-4 text-gold" /> طلب طيار خارجي
              </div>
              <button onClick={() => { setShowFleet(false); setExtSubmitted(null); }} className="p-1 rounded hover:bg-secondary"><X className="w-4 h-4" /></button>
            </div>

            {!extSubmitted ? (
              <>
                <div className="text-[11px] text-muted-foreground">
                  أدخل بيانات العميل الخارجي وسيتم تعيين أقرب طيار متاح. التسعير مرتبط بغرفة التحكم المركزية.
                </div>
                <div>
                  <label className="text-xs font-bold mb-1 block">رقم جوال العميل</label>
                  <input value={extPhone} onChange={(e) => setExtPhone(e.target.value)} placeholder="01xxxxxxxxx" inputMode="tel"
                    className="w-full px-3 py-2.5 rounded-xl bg-background border text-sm outline-none focus:border-gold" />
                </div>
                <div>
                  <label className="text-xs font-bold mb-1 block flex items-center gap-1"><MapPin className="w-3 h-3 text-gold" /> تحديد موقع العنوان على الخريطة</label>
                  <input value={extAddress} onChange={(e) => setExtAddress(e.target.value)} placeholder="https://maps.google.com/... أو وصف الموقع"
                    className="w-full px-3 py-2 rounded-xl bg-background border text-sm outline-none focus:border-gold" />
                  <button onClick={() => setExtAddress("📍 موقع محدد من الخريطة")}
                    className="w-full mt-2 text-xs py-4 rounded-lg border-2 border-dashed border-gold/40 hover:bg-gold/5">
                    اختر من الخريطة
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-success/5 border border-success/30 text-[11px] text-success font-semibold">
                  ✓ عمولة البضاعة: 0% — يُحتسب فقط مقابل المسافة ({perKmExternal} {t("egp")}/كم)
                </div>
                <button onClick={submitFleet}
                  disabled={!extPhone.trim() || !extAddress.trim()}
                  className="w-full py-2.5 rounded-xl bg-gradient-royal text-primary-foreground font-bold text-sm disabled:opacity-50">
                  إرسال طلب طيار خارجي
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-success/10 border-2 border-success text-center">
                  <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
                  <div className="text-sm font-bold">تم إرسال الطلب بنجاح</div>
                  <div className="text-[11px] text-muted-foreground mt-1">رقم الطلب: <b className="text-gold">{extSubmitted.id}</b></div>
                  <div className="text-[11px] text-muted-foreground mt-1">سعر الكيلومتر: <b>{extSubmitted.perKm} {t("egp")}/كم</b> · عمولة 0%</div>
                </div>
                <button onClick={() => setExtSubmitted(null)} className="w-full py-2 rounded-lg border text-xs font-semibold hover:bg-secondary">
                  طلب جديد
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      </>
      )}

      {/* Settings modal — merchant type + bank account for settlements */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center px-4" onClick={() => setShowSettings(false)}>
          <div className="bg-card w-full max-w-md rounded-2xl border-2 border-gold shadow-royal p-5 space-y-4" onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="flex items-center justify-between">
              <div className="font-bold text-sm flex items-center gap-2">
                <Settings className="w-4 h-4 text-gold" /> إعدادات الحساب
              </div>
              <button onClick={() => setShowSettings(false)} className="p-1 rounded hover:bg-secondary"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
              <div className="text-[11px] text-muted-foreground">مسجل الدخول</div>
              <div className="text-sm font-bold text-emerald-900 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5" />
                {session?.name ?? "—"}
                <span className="ms-auto text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                  {merchantType === "publisher" ? "ناشر / مؤلف" : merchantType === "spare" ? "قطع غيار" : "تاجر"}
                </span>
              </div>
              <button onClick={() => { setSession(null); setShowSettings(false); }}
                className="mt-2 text-[11px] text-red-600 font-bold flex items-center gap-1">
                <LogOut className="w-3 h-3" /> تسجيل خروج
              </button>
            </div>


            {merchantType === "publisher" && (
              <div className="pt-3 border-t space-y-3">
                <div className="font-bold text-xs flex items-center gap-2 text-emerald-800">
                  <Landmark className="w-4 h-4" /> الحساب البنكي للتسويات
                </div>
                <div className="text-[11px] text-muted-foreground">
                  يُستخدم لاستلام صافي مبيعاتك الرقمية تلقائياً عبر التقسيم الفوري (Split Payments).
                </div>
                {[
                  { k: "bankName", label: "اسم البنك", ph: "مثال: البنك الأهلي المصري" },
                  { k: "accountName", label: "اسم صاحب الحساب", ph: "الاسم كما هو مسجل في البنك" },
                  { k: "accountNumber", label: "رقم الحساب", ph: "1234567890" },
                  { k: "iban", label: "الـ IBAN", ph: "EG38 0011 0000 0000 1234 5678 901" },
                ].map((f) => (
                  <div key={f.k}>
                    <label className="text-[11px] font-bold mb-1 block">{f.label}</label>
                    <input value={bank[f.k as keyof BankInfo]} onChange={(e) => setBank((b) => ({ ...b, [f.k]: e.target.value }))} placeholder={f.ph}
                      className="w-full px-3 py-2 rounded-xl bg-background border text-sm outline-none focus:border-gold font-mono" />
                  </div>
                ))}
              </div>
            )}

            <button onClick={saveBank} className="w-full py-2.5 rounded-xl bg-gradient-royal text-primary-foreground font-bold text-sm">
              حفظ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent, gold }: { icon: typeof Wallet; label: string; value: string; accent?: boolean; gold?: boolean }) {
  return (
    <div className={cn("p-4 rounded-2xl border shadow-card",
      accent && "bg-gradient-royal text-primary-foreground",
      gold && "bg-gradient-gold text-gold-foreground",
      !accent && !gold && "bg-card")}>
      <div className="flex items-center gap-2 text-xs opacity-80"><Icon className="w-3.5 h-3.5" /> {label}</div>
      <div className="text-2xl font-bold mt-1.5">{value}</div>
    </div>
  );
}

function seedParts(n: number): CatalogItem[] {
  const families = ["فلتر", "زيت", "بطارية", "إطار", "مصباح", "شمعة", "كبل", "فيوز", "حساس", "جلبة", "كاوتش", "صنفرة"];
  const sizes = ["M14", "M16", "M18", "8mm", "10mm", "12mm", "14مم", "16مم"];
  const items: CatalogItem[] = [];
  for (let i = 0; i < n; i++) {
    const f = families[i % families.length];
    const s = sizes[(i * 3) % sizes.length];
    items.push({
      id: `it-${i}`,
      sku: `SKU-${(100000 + i).toString(36).toUpperCase()}`,
      name: `${f} ${s} #${i + 1}`,
      price: 25 + (i % 950),
      qty: (i * 7) % 40,
      family: f,
    });
  }
  return items;
}

function seedStore(): CatalogItem[] {
  const groups: { family: string; names: string[] }[] = [
    { family: "مطاعم ومأكولات", names: ["وجبة فراخ مشوية", "بيتزا مارجريتا", "كشري بلدي", "شاورما لحمة", "برجر رافا"] },
    { family: "سوبرماركت", names: ["أرز 1كجم", "سكر 1كجم", "زيت عباد 1لتر", "شاي 250ج", "لبن كامل الدسم"] },
    { family: "صيدلية", names: ["بانادول إكسترا", "فيتامين C 1000", "كمامة طبية × 10", "شراب كحة"] },
    { family: "كافيهات ومشروبات", names: ["قهوة تركي", "لاتيه ساخن", "شاي بالنعناع", "سحلب"] },
    { family: "مكتبات وقرطاسية", names: ["كشكول 100 ورقة", "طقم أقلام", "حقيبة مدرسية", "ألوان خشبية"] },
    { family: "مول رافا", names: ["تي شيرت قطن", "حذاء رياضي", "شنطة يد", "ساعة كاجوال"] },
  ];
  const items: CatalogItem[] = [];
  let i = 0;
  for (const g of groups) {
    for (const n of g.names) {
      items.push({
        id: `st-${i}`,
        sku: `ST-${(1000 + i).toString(36).toUpperCase()}`,
        name: n,
        family: g.family,
        price: 25 + (i * 17) % 400,
        qty: 5 + (i * 3) % 60,
      });
      i++;
    }
  }
  return items;
}

function seedBooks(): CatalogItem[] {
  return BOOKS.map((b, i) => ({
    id: `bk-${i}`,
    sku: `BK-${(1000 + i).toString(36).toUpperCase()}`,
    name: b.title,
    author: b.author,
    family: b.category,
    price: b.price,
    qty: 0,
    digital: true,
  }));
}


function MerchantLogin({ onLogin }: { onLogin: (s: MerchantSession) => void }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const u = user.trim().toLowerCase();
    const acc = MERCHANT_ACCOUNTS.find((a) => a.user === u && a.pass === pass);
    if (acc) { onLogin({ name: acc.name, type: acc.type }); return; }
    // Accounts generated by the admin control room (publishers & authors)
    const gen = loadPublisherAccounts().find((a) => a.user.toLowerCase() === u && a.pass === pass);
    if (!gen) { setErr("بيانات الدخول غير صحيحة"); return; }
    if (!gen.active) { setErr("الحساب موقوف — راجع إدارة المنصة"); return; }
    onLogin({ name: gen.name, type: "publisher" });
  };
  return (
    <div className="max-w-md mx-auto mt-8" dir="rtl">
      <div className="p-6 rounded-2xl border-2 border-gold shadow-royal bg-card space-y-4">
        <div className="text-center space-y-1">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-royal text-primary-foreground grid place-items-center">
            <LogIn className="w-5 h-5" />
          </div>
          <div className="font-bold text-base">تسجيل دخول التاجر</div>
          <div className="text-[11px] text-muted-foreground">النظام يتعرف على نوع الحساب تلقائياً بعد الدخول</div>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs font-bold mb-1 block">اسم المستخدم</label>
            <input value={user} onChange={(e) => { setUser(e.target.value); setErr(null); }}
              className="w-full px-3 py-2.5 rounded-xl bg-background border-2 border-gold/30 text-sm outline-none focus:border-gold"
              autoComplete="username" />
          </div>
          <div>
            <label className="text-xs font-bold mb-1 block">كلمة المرور</label>
            <input type="password" value={pass} onChange={(e) => { setPass(e.target.value); setErr(null); }}
              className="w-full px-3 py-2.5 rounded-xl bg-background border-2 border-gold/30 text-sm outline-none focus:border-gold"
              autoComplete="current-password" />
          </div>
          {err && <div className="p-2 rounded-lg bg-red-50 border border-red-300 text-[11px] font-bold text-red-700">{err}</div>}
          <button type="submit" className="w-full py-2.5 rounded-xl bg-gradient-royal text-primary-foreground font-bold text-sm">
            دخول
          </button>
        </form>
        <div className="text-[10px] text-muted-foreground border-t pt-3 space-y-0.5">
          <div className="font-bold text-emerald-800">حسابات تجريبية:</div>
          <div>تاجر: <b>merchant / rava123</b></div>
          <div>قطع غيار: <b>spare / spare123</b></div>
          <div>ناشر: <b>publisher / books123</b></div>
          <div>مؤلف: <b>author / author123</b></div>
        </div>
      </div>
    </div>
  );
}
