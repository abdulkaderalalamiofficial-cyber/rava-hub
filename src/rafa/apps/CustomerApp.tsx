import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "../i18n";
import { useStore, calcFare, uid, type ServiceType, type VehicleType } from "../store";
import { LiveMap } from "../components/LiveMapLazy";
import { EGYPT_CENTERS } from "../data/egyptCenters";
import { useCustomerBlock } from "../hooks/useCustomerBlock";
import { SparePartsBreakdownPin } from "../components/SparePartsBreakdownPin";
import { usePlatformConfig } from "../platformConfig";
import { Link } from "@tanstack/react-router";
import { ALL_BOOKS, LIBRARY_CATEGORIES } from "../data/libraryCatalog";
import { filterByZone, isOpenZoneService, checkVehicleZone, zoneBadgeAr } from "../geoZoning";

function CustomerPaymentMethods() {
  const { cfg } = usePlatformConfig();
  const enabled = cfg.gateways.filter((g) => g.enabled);
  const [sel, setSel] = useState<string>(enabled[0]?.id ?? "");
  if (enabled.length === 0) {
    return (
      <div className="p-3 rounded-xl border-2 border-destructive/40 bg-destructive/5 text-xs text-destructive font-bold text-center">
        لا توجد وسيلة دفع مفعّلة حالياً — تواصل مع الدعم.
      </div>
    );
  }
  const chosen = enabled.find((g) => g.id === sel) ?? enabled[0];
  return (
    <div className="p-3 rounded-xl border-2 border-gold/30 bg-card space-y-2">
      <div className="text-xs font-bold flex items-center gap-1.5">💳 اختر وسيلة الدفع</div>
      <div className="grid grid-cols-2 gap-1.5">
        {enabled.map((g) => (
          <button key={g.id} type="button" onClick={() => setSel(g.id)}
            className={`p-2 rounded-lg border-2 text-start text-[11px] font-bold flex items-center gap-1.5 transition-all ${sel === g.id ? "border-gold bg-gold/10" : "border-border bg-secondary/40"}`}>
            <span className="text-lg leading-none">{g.emoji}</span>
            <span className="flex-1 truncate">{g.nameAr}</span>
          </button>
        ))}
      </div>
      {chosen && (chosen.payUrl || chosen.payNumber || chosen.payNote) && (
        <div className="p-2.5 rounded-xl border-2 border-gold/40 bg-gold/5 space-y-1.5">
          {chosen.payNote && <div className="text-[11px] font-semibold">{chosen.payNote}</div>}
          {chosen.payNumber && (
            <button type="button"
              onClick={() => { void navigator.clipboard?.writeText(chosen.payNumber!); }}
              className="w-full px-2 py-1.5 rounded-lg bg-secondary text-[11px] font-mono flex items-center justify-between gap-2">
              <span dir="ltr">{chosen.payNumber}</span>
              <span className="font-sans font-bold">نسخ الرقم</span>
            </button>
          )}
          {chosen.payUrl && (
            <a href={chosen.payUrl} target="_blank" rel="noopener noreferrer"
              className="block w-full px-2 py-2 rounded-lg bg-gradient-royal text-primary-foreground text-[11px] font-bold text-center">
              ادفع الآن عبر {chosen.nameAr} ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}


function CustomerBanners() {
  const { cfg } = usePlatformConfig();
  const active = cfg.banners.filter((b) => b.enabled);
  if (active.length === 0) return null;
  return (
    <div className="space-y-1.5">
      {active.map((b) => (
        <div key={b.id} className={`p-3 rounded-2xl shadow-elegant text-xs ${b.tone === "gold" ? "bg-gradient-gold text-gold-foreground" : b.tone === "royal" ? "bg-gradient-royal text-primary-foreground" : "bg-blue-600 text-white"}`}>
          <div className="font-black">{b.titleAr}</div>
          {b.bodyAr && <div className="opacity-90 mt-0.5">{b.bodyAr}</div>}
        </div>
      ))}
    </div>
  );
}

function CustomerBlockBanner() {
  const { activeBlock } = useCustomerBlock();
  if (!activeBlock) return null;
  const until = activeBlock.blocked_until ? new Date(activeBlock.blocked_until).toLocaleString("ar-EG") : "";
  return (
    <div className="rounded-2xl p-3 bg-red-600 text-white shadow-elegant flex items-start gap-2">
      <span className="text-lg leading-none">🚫</span>
      <div className="flex-1 text-xs">
        <div className="font-bold">تم إيقاف الطلبات مؤقتاً</div>
        <div className="opacity-90 mt-0.5">سبب: {activeBlock.reason} · {activeBlock.ghost_cancel_count} إلغاءات بعد توجّه الكابتن خلال 7 أيام.</div>
        {until && <div className="opacity-80 mt-0.5">حتى: {until}</div>}
      </div>
    </div>
  );
}
import {
  Bike, Car, Truck, Wrench, Calendar, Wallet, Phone, Plus, X, Bell, Users as UsersIcon,
  MapPinned, Search, ShieldAlert, Store as StoreIcon, ChevronLeft, Clock, Tag, MapPin,
  Flag, Link2, Map as MapIcon, MessageCircle, Package, Sparkles, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------- RAVA Bookings (clinics, labs, salons) + Future modules ----------
type BookingServiceId = "libraries" | "clinics" | "labs" | "salons";
const BOOKING_SERVICES: { id: BookingServiceId; emoji: string; title: string; sub: string; sampleProviders: string[] }[] = [
  { id: "libraries", emoji: "📚", title: "المكتبات والقرطاسيات", sub: "كتب · قرطاسية · أدوات مدرسية", sampleProviders: ["مكتبة الأنجلو — القاهرة", "مكتبة مدينتي — الجيزة", "مكتبة دار الفكر — الإسكندرية", "مكتبة النهضة — المنصورة"] },
  { id: "clinics", emoji: "🩺", title: "حجز الأطباء والعيادات", sub: "أطباء معتمدون · حجز موعد فوري", sampleProviders: ["د. أحمد سامي — باطنة", "د. منى حسن — أطفال", "د. كريم عبدالله — جلدية", "د. ليلى محمود — نساء وتوليد"] },
  { id: "labs", emoji: "🧪", title: "معامل التحاليل والإشاعات", sub: "تحاليل طبية · أشعة · نتائج معتمدة", sampleProviders: ["معمل المختبر — تحاليل شاملة", "البرج للمعامل الطبية", "ألفا لاب — صورة دم كاملة", "مختبرات المقطم الطبية"] },
  { id: "salons", emoji: "💇", title: "صالونات التجميل والكوافير", sub: "كوافير رجالي · حريمي · سبا · بشرة", sampleProviders: ["صالون لمسة جمال — حريمي", "Barber Lounge — رجالي", "أنوثة سبا — بشرة وعناية", "Studio M — قص وصبغة"] },
];

// ---------- Local guest profile (lazy registration) ----------
type GuestProfile = {
  name?: string; phone?: string; email?: string; promo?: string;
  governorate?: string; center?: string;
};
const PROFILE_KEY = "rava_customer_profile_v1";
const loadProfile = (): GuestProfile => {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}"); } catch { return {}; }
};
const saveProfile = (p: GuestProfile) => localStorage.setItem(PROFILE_KEY, JSON.stringify(p));

// ---------- 7 fleet options ----------
type CustomerVehicleId = VehicleType | "courier" | "winsh";
type FleetOpt = { id: CustomerVehicleId; backend: VehicleType; icon: typeof Bike; emoji: string; label: string; sub: string };
const FLEET_GRID: FleetOpt[] = [
  { id: "car",       backend: "car",       icon: Car,     emoji: "🚗", label: "سيارة ملاكي",            sub: "مشاوير خاصة" },
  { id: "tuktuk",    backend: "tuktuk",    icon: Bike,    emoji: "🛺", label: "توكتوك",                  sub: "مشوار داخلي" },
  { id: "motorbike", backend: "motorbike", icon: Bike,    emoji: "🏍️", label: "رافا موتوسيكل",           sub: "نقل أفراد" },
  { id: "courier",   backend: "motorbike", icon: Package, emoji: "🛍️", label: "مناديب توصيل من المحلات", sub: "اطلب ووصّل لك" },
  { id: "tricycle",  backend: "tricycle",  icon: Bike,    emoji: "🛺", label: "تروسيكل",                 sub: "نقل بضائع" },
  { id: "dababa",    backend: "dababa",    icon: Truck,   emoji: "🛻", label: "دبابة (ربع نقل)",         sub: "نقل خفيف" },
];

// ---------- 6 mall folders ----------
type MallFolderId = "pharmacy" | "food" | "grocery" | "cafe" | "mall" | "home" | "spare";
const MALL_FOLDERS: { id: MallFolderId; emoji: string; title: string; desc: string; categories: ServiceType[]; subLabels: string[] }[] = [
  { id: "pharmacy", emoji: "💊", title: "الصيدلية والرعاية الصحية", desc: "صيدليات معتمدة في منطقتك",     categories: ["pharmacy"],            subLabels: ["صيدليات"] },
  { id: "food",     emoji: "🍔", title: "المأكولات والمطاعم",        desc: "مطاعم، شغل بيتي، حلويات",        categories: ["food"],                subLabels: ["مأكولات", "مطعم شغل بيتي", "محل حلويات"] },
  { id: "grocery",  emoji: "🛒", title: "السوبرماركت والتسوق اليومي",  desc: "بقالة، عصائر، تسالي",            categories: ["grocery", "kiosk"],    subLabels: ["سوبر ماركت", "مشروبات وعصائر", "محمصة وتسالي"] },
  { id: "cafe",     emoji: "☕", title: "كافيهات ومشروبات",            desc: "مشروبات ساخنة فقط",              categories: ["kiosk"],               subLabels: ["مشروبات ساخنة فقط"] },
  { id: "mall",     emoji: "🛍️", title: "مول رافا التجاري",            desc: "ملابس، أحذية، إكسسوارات",        categories: ["errands"],             subLabels: ["ملابس رجالي", "ملابس نسائي", "أحذية وشنط", "مكياجات وإكسسوارات", "إكسسوارات رجالي"] },
  { id: "home",     emoji: "🧹", title: "الخدمات المنزلية واليومية",   desc: "نظافة، غسيل، أنابيب",            categories: ["laundry", "errands"],  subLabels: ["خدمات عمال نظافة", "غسيل سجاد وبطاطين", "مستودع أنابيب"] },
  { id: "spare",    emoji: "🔧", title: "قطع غيار وإكسسوارات السيارات والمعدات", desc: "من الإبرة للصاروخ — لكل الآلات", categories: ["errands"],         subLabels: ["قطع غيار سيارات", "إكسسوارات وكماليات", "معدات ثقيلة", "زيوت وفلاتر", "أدوات ورش"] },
];

// ---------- Cart / Budget / Auto-Split ----------
type CartItem = { merchantId: string; merchantName: string; folderId: MallFolderId; category: ServiceType; name: string; price: number; qty: number };
// Deterministic sample items for a merchant — replaced by real catalog later.
function itemsForMerchant(folderId: MallFolderId, merchantName: string): { name: string; price: number }[] {
  const catalogs: Record<MallFolderId, { name: string; price: number }[]> = {
    pharmacy: [{ name: "بانادول إكسترا", price: 35 }, { name: "فيتامين C 1000", price: 95 }, { name: "كمامة طبية × 10", price: 25 }],
    food:     [{ name: "كشري وسط", price: 45 }, { name: "ساندويتش فراخ", price: 65 }, { name: "حلويات شرقية ½ كيلو", price: 120 }],
    grocery:  [{ name: "أرز 1 كيلو", price: 38 }, { name: "زيت عافية 1 لتر", price: 95 }, { name: "بيض × 10", price: 75 }],
    cafe:     [{ name: "قهوة تركي", price: 25 }, { name: "شاي بالنعناع", price: 18 }, { name: "كابتشينو", price: 45 }],
    mall:     [{ name: "تيشيرت قطن", price: 220 }, { name: "حذاء رياضي", price: 650 }, { name: "حقيبة يد", price: 480 }],
    home:     [{ name: "ساعة نظافة منزل", price: 180 }, { name: "غسيل سجادة 2×3", price: 250 }, { name: "أسطوانة بوتاجاز", price: 200 }],
    spare:    [{ name: "فلتر زيت", price: 180 }, { name: "بطارية 70 أمبير", price: 2850 }, { name: "زيت محرك 4 لتر", price: 520 }, { name: "إطار مقاس 14", price: 1450 }],
  };
  // Slight per-merchant variance so two stores don't look identical.
  const offset = (merchantName.charCodeAt(0) % 5) - 2;
  return catalogs[folderId].map((it) => ({ ...it, price: Math.max(5, it.price + offset * 5) }));
}
/** Heavy items in Spare Parts must be dispatched to cargo-capable vehicles. */
function vehicleForFolder(folderId: MallFolderId): VehicleType {
  if (folderId === "spare") return "tricycle"; // tricycle / dababa / winsh routing
  if (folderId === "home") return "dababa";
  return "motorbike";
}
/** Per-category delivery fee (one independent delivery per split order). */
function deliveryFeeForFolder(folderId: MallFolderId): number {
  if (folderId === "spare") return 90;
  if (folderId === "home") return 70;
  if (folderId === "pharmacy") return 25;
  return 40;
}

export function CustomerApp() {
  const { t } = useI18n();
  const { state, dispatch } = useStore();

  // ---------- Profile / first-time location ----------
  const [profile, setProfile] = useState<GuestProfile>(() => loadProfile());
  const needsLocation = !profile.governorate || !profile.center;
  const [search, setSearch] = useState("");
  const [openFolder, setOpenFolder] = useState<MallFolderId | null>(null);
  const [mallTab, setMallTab] = useState<string | null>(null);
  const [showInbox, setShowInbox] = useState(false);

  // ---------- Breakdown Pin (wired to spare-parts workflow) ----------
  const [breakdownPin, setBreakdownPin] = useState<{ lat: number; lng: number; vehicle: "tricycle" | "dababa" | "winsh" } | null>(null);

  // ---------- Cart / Budget Tracker / Auto-Split ----------
  const [cart, setCart] = useState<CartItem[]>([]);
  const [budget, setBudget] = useState<string>("");
  const [showCart, setShowCart] = useState(false);
  const cartTotal = cart.reduce((s, it) => s + it.price * it.qty, 0);
  const budgetNum = Number(budget) || 0;
  const overBudget = budgetNum > 0 && cartTotal > budgetNum;
  const addToCart = (it: Omit<CartItem, "qty">) => setCart((cs) => {
    const key = (x: CartItem) => x.merchantId + "|" + x.name;
    const idx = cs.findIndex((x) => key(x) === key({ ...it, qty: 0 }));
    if (idx >= 0) { const next = [...cs]; next[idx] = { ...next[idx], qty: next[idx].qty + 1 }; return next; }
    return [...cs, { ...it, qty: 1 }];
  });
  const decFromCart = (merchantId: string, name: string) => setCart((cs) => {
    const idx = cs.findIndex((x) => x.merchantId === merchantId && x.name === name);
    if (idx < 0) return cs;
    const next = [...cs];
    if (next[idx].qty <= 1) next.splice(idx, 1);
    else next[idx] = { ...next[idx], qty: next[idx].qty - 1 };
    return next;
  });
  const qtyOf = (merchantId: string, name: string) =>
    cart.find((x) => x.merchantId === merchantId && x.name === name)?.qty ?? 0;

  // ---------- Vehicle modal flow ----------
  const [activeVehicle, setActiveVehicle] = useState<FleetOpt | null>(null);
  const [motoSubChoice, setMotoSubChoice] = useState<"persons" | "fetch" | null>(null);
  // courier inputs
  const [courierItems, setCourierItems] = useState("");
  const [courierBudget, setCourierBudget] = useState<string>("");
  const [courierPickup, setCourierPickup] = useState("");
  const [courierDelivery, setCourierDelivery] = useState("");
  // fetch (rafa-hatli) inputs
  const [fetchItems, setFetchItems] = useState("");
  const [fetchBudget, setFetchBudget] = useState("");
  const [fetchStore, setFetchStore] = useState("");
  // ride inputs
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [stops, setStops] = useState<string[]>([]);
  const [scheduled, setScheduled] = useState("");

  // ---------- Registration / OTP gate ----------
  const [pendingSubmit, setPendingSubmit] = useState<null | (() => void)>(null);
  const [regStep, setRegStep] = useState<"otp" | "profile" | null>(null);
  const [otpPhone, setOtpPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPromo, setRegPromo] = useState("");

  // ---------- RAVA Bookings state ----------
  const [bookingService, setBookingService] = useState<BookingServiceId | null>(null);
  const [bookingGov, setBookingGov] = useState<string>("");
  const [bookingProvider, setBookingProvider] = useState<string>("");
  const [bookingDate, setBookingDate] = useState<string>("");
  const [showVipTravel, setShowVipTravel] = useState(false);
  const [lastBookingSummary, setLastBookingSummary] = useState<string>("");

  // ---------- Timers for active order ----------
  const myOrders = state.orders.filter((o) => o.customer === (profile.name || "Guest"));
  const activeOrder = myOrders.find((o) => o.status !== "completed" && o.status !== "cancelled");
  const driver = activeOrder?.driverId ? state.drivers.find((d) => d.id === activeOrder.driverId) : null;
  const [arrivedAt, setArrivedAt] = useState<number | null>(null);
  const [waitElapsed, setWaitElapsed] = useState(0);
  useEffect(() => {
    if (!arrivedAt) return;
    const id = setInterval(() => setWaitElapsed(Math.floor((Date.now() - arrivedAt) / 1000)), 1000);
    return () => clearInterval(id);
  }, [arrivedAt]);
  const waitMin = Math.floor(waitElapsed / 60);
  const waitExtraFee = Math.max(0, (waitMin - 10)) * 3; // 3 EGP/min after 10 grace

  // resend countdown
  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setInterval(() => setResendIn((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [resendIn]);

  const persistProfile = (p: GuestProfile) => { saveProfile(p); setProfile(p); };

  // ---------- Booking submit logic ----------
  const submitRide = () => {
    const km = 8.4 + stops.length * 2.2;
    const v = (activeVehicle?.backend ?? "car") as VehicleType;
    const fare = calcFare(v, km, state.fuelIndex, state.pricing, false);
    dispatch({
      type: "addOrder",
      order: {
        id: uid(), service: "ride", vehicle: v, customer: profile.name || "Guest",
        pickup, dropoff, stops, distanceKm: km, fareEgp: fare,
        status: "pending", createdAt: Date.now(), zone: profile.center || state.homeZone,
        destZone: profile.center || state.homeZone,
        scheduledFor: scheduled ? new Date(scheduled).getTime() : undefined,
      },
    });
    setActiveVehicle(null); setMotoSubChoice(null);
    setPickup(""); setDropoff(""); setStops([]); setScheduled("");
  };
  const submitCourier = () => {
    dispatch({
      type: "addOrder",
      order: {
        id: uid(), service: "errands", vehicle: "motorbike", customer: profile.name || "Guest",
        pickup: courierPickup || "—", dropoff: courierDelivery || "—",
        distanceKm: 6, fareEgp: 60,
        status: "pending", createdAt: Date.now(), zone: profile.center || state.homeZone,
        destZone: profile.center || state.homeZone,
        cashChange: Number(courierBudget) || 0,
      },
    });
    setActiveVehicle(null); setCourierItems(""); setCourierBudget(""); setCourierPickup(""); setCourierDelivery("");
  };
  const submitFetch = () => {
    dispatch({
      type: "addOrder",
      order: {
        id: uid(), service: "errands", vehicle: "motorbike", customer: profile.name || "Guest",
        pickup: fetchStore || "—", dropoff: profile.center || "—",
        distanceKm: 5, fareEgp: 45,
        status: "pending", createdAt: Date.now(), zone: profile.center || state.homeZone,
        destZone: profile.center || state.homeZone,
        cashChange: Number(fetchBudget) || 0,
      },
    });
    setActiveVehicle(null); setMotoSubChoice(null);
    setFetchItems(""); setFetchBudget(""); setFetchStore("");
  };

  // ---------- Auto-Split Checkout ----------
  // Each category becomes its own independent order with its own delivery fee.
  const checkoutCart = () => {
    if (cart.length === 0) return;
    const groups = new Map<string, CartItem[]>();
    cart.forEach((it) => {
      const k = it.folderId + "|" + it.merchantId;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k)!.push(it);
    });
    const orders: import("../store").Order[] = [];
    const blocked: string[] = [];
    groups.forEach((items) => {
      const folder = items[0].folderId;
      const subtotal = items.reduce((s, x) => s + x.price * x.qty, 0);
      const delivery = deliveryFeeForFolder(folder);
      // Spare-parts: cargo-only routing; override with breakdown-pin vehicle if pinned
      const v = folder === "spare" && breakdownPin ? breakdownPin.vehicle as VehicleType : vehicleForFolder(folder);
      const dropoff = folder === "spare" && breakdownPin
        ? `📍 موقع العطل ${breakdownPin.lat.toFixed(5)},${breakdownPin.lng.toFixed(5)}`
        : (profile.center || profile.governorate || "—");
      // Strict zone enforcement for motorcycle / tricycle deliveries.
      const merchantZone = state.merchants.find((m) => m.id === items[0].merchantId)?.zone;
      const zoneCheck = checkVehicleZone(v, {
        originZone: merchantZone,
        destZone: profile.center || profile.governorate,
        distanceKm: 4,
        customerZone,
      });
      if (!zoneCheck.allowed) {
        blocked.push(`${items[0].merchantName}: ${zoneCheck.reasonAr}`);
        return;
      }
      orders.push({
        id: uid(),
        service: items[0].category,
        vehicle: v,
        customer: profile.name || "Guest",
        merchantId: items[0].merchantId,
        pickup: items[0].merchantName,
        dropoff,
        distanceKm: 4,
        fareEgp: subtotal + delivery,
        status: "pending",
        createdAt: Date.now(),
        zone: profile.center || state.homeZone,
        destZone: profile.center || state.homeZone,
        // store cart line items in `extra`-style fields via stops for visibility
        stops: items.map((x) => `${x.name} × ${x.qty}`),
      });
    });
    if (blocked.length > 0) {
      dispatch({ type: "addNotif", n: { id: uid(), ts: Date.now(),
        title: "طلبات خارج النطاق الجغرافي 🚫",
        body: blocked.join(" — ") } });
    }
    if (orders.length === 0) return;
    dispatch({ type: "addOrders", orders });
    dispatch({ type: "addNotif", n: { id: uid(), ts: Date.now(),
      title: `تم تقسيم السلة إلى ${orders.length} طلب${orders.length > 1 ? "ات" : ""} مستقلة 🚚`,
      body: `إجمالي ${cartTotal} ج.م — كل تصنيف يُرسل لكابتن مختلف لتجنّب الالتباس.` } });
    setCart([]);
    setShowCart(false);
    setOpenFolder(null);
  };

  const gateAndRun = (fn: () => void) => {
    if (profile.name && profile.phone) { fn(); return; }
    setPendingSubmit(() => fn);
    setRegStep("otp");
  };

  const sendOtp = () => {
    if (!/^01[0125]\d{8}$/.test(otpPhone.replace(/\s|-/g, ""))) return;
    const code = String(Math.floor(1000 + Math.random() * 9000));
    setOtpSent(code); setResendIn(45);
  };
  const verifyOtp = () => {
    if (otpCode && otpCode === otpSent) {
      setRegStep("profile");
    }
  };
  const completeRegistration = () => {
    if (!regName.trim()) return;
    const newProf: GuestProfile = {
      ...profile, name: regName.trim(), phone: otpPhone,
      email: regEmail.trim() || undefined, promo: regPromo.trim() || undefined,
    };
    persistProfile(newProf);
    setRegStep(null);
    const fn = pendingSubmit;
    setPendingSubmit(null);
    setOtpCode(""); setOtpSent(null);
    setTimeout(() => fn?.(), 0);
  };

  // ---------- Geo-zoning ----------
  const customerZone = useMemo(
    () => ({ governorate: profile.governorate, center: profile.center }),
    [profile.governorate, profile.center],
  );

  // ---------- Mall data ----------
  const activeFolder = openFolder ? MALL_FOLDERS.find((f) => f.id === openFolder) : null;
  const folderMerchants = useMemo(() => {
    if (!activeFolder) return [];
    const q = search.trim().toLowerCase();
    // Restaurants / shops are zone-specific; open-zone services are untouched.
    const base = filterByZone(
      activeFolder.id,
      state.merchants.filter((m) => activeFolder.categories.includes(m.category)),
      customerZone,
    ).filter((m) => !q || m.name.toLowerCase().includes(q));
    if (!mallTab) return base;
    return base.filter((m) => m.name.toLowerCase().includes(mallTab.toLowerCase()));
  }, [activeFolder, state.merchants, search, mallTab, customerZone]);

  // ---------- Per-Partner Activation (per center + category) ----------
  // Open-zone services (library, rides) are always live. Zone-specific folders
  // are live only when an approved merchant exists in the customer's zone.
  const isFolderActive = (folder: { id?: string; categories: ServiceType[] }) => {
    if (folder.id && isOpenZoneService(folder.id)) return true;
    if (!profile.governorate) return false;
    return filterByZone(
      folder.id ?? "",
      state.merchants.filter((m) => folder.categories.includes(m.category)),
      customerZone,
    ).length > 0;
  };

  // Merchant prep + +5min buffer mock timer
  const prepStartRef = useRef<number | null>(null);
  if (activeOrder && (activeOrder.status === "accepted" || activeOrder.status === "preparing") && !prepStartRef.current) {
    prepStartRef.current = Date.now();
  }
  const [, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick((x) => x + 1), 1000); return () => clearInterval(id); }, []);
  const prepRemaining = prepStartRef.current
    ? Math.max(0, 15 * 60 - Math.floor((Date.now() - prepStartRef.current) / 1000) + 5 * 60)
    : 0;
  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ---------- First-time location overlay ----------
  if (needsLocation) {
    return <LocationPicker onDone={(gov, center) => persistProfile({ ...profile, governorate: gov, center })} />;
  }

  return (
    <div className="grid lg:grid-cols-3 gap-5 w-full max-w-full overflow-x-hidden">
      <div className="lg:col-span-2 space-y-5 min-w-0 max-w-full">

        <CustomerBlockBanner />
        {/* Compact banner (~30% shorter) */}
        <div className="rounded-2xl p-3.5 bg-gradient-hero text-primary-foreground shadow-royal relative overflow-hidden">
          <div className="absolute inset-0 shimmer opacity-30 pointer-events-none" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[15px] font-bold truncate">
                {profile.name
                  ? `مرحباً بك في رافا، يومك سعيد يا ${profile.name} 👋`
                  : "مرحباً بك في رافا، تصفح خدماتنا الآن"}
              </div>
              <div className="text-[11px] opacity-85 mt-0.5 flex items-center gap-1.5">
                <MapPinned className="w-3 h-3" />
                <span>{profile.governorate} · {profile.center}</span>
                <button
                  onClick={() => persistProfile({ ...profile, governorate: undefined, center: undefined })}
                  className="underline opacity-80 hover:opacity-100">تغيير</button>
              </div>
            </div>
            <button onClick={() => setShowInbox(true)} className="relative p-2 rounded-xl bg-white/15 backdrop-blur shrink-0">
              <Bell className="w-4 h-4" />
              {state.notifications.length > 0 && (
                <span className="absolute -top-1 -end-1 w-4 h-4 rounded-full bg-gold text-[10px] text-gold-foreground grid place-items-center font-bold">
                  {state.notifications.length}
                </span>
              )}
            </button>
          </div>
        </div>

        <CustomerBanners />

        {/* Intelligent search */}
        <div className="relative">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن مطعم، صيدلية، أو خدمة..."
            className="w-full ps-9 pe-3 py-3 rounded-2xl bg-card border border-gold/30 focus:border-gold outline-none text-sm shadow-card"
            dir="rtl"
          />
        </div>

        {/* MID: Mall first */}
        <Section title="نفسك في إيه دلوقتي؟ 😋" subtitle="مول رافا الذكي">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {MALL_FOLDERS.filter((f) => f.id !== "mall" && f.id !== "spare").map((f) => {
              const live = isFolderActive(f);
              return (
                <button key={f.id}
                  onClick={() => { setOpenFolder(f.id); setMallTab(null); }}
                  className="group p-3 rounded-xl border bg-card transition-all text-start relative overflow-hidden hover:border-gold">
                  <div className="absolute -end-4 -top-4 text-5xl opacity-10 group-hover:opacity-20 transition-opacity">{f.emoji}</div>
                  <div className="text-2xl mb-1">{f.emoji}</div>
                  <div className="text-xs font-bold leading-tight">{f.title}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{f.desc}</div>
                  <div className={`absolute top-1.5 start-1.5 text-[8px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5 ${live ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"}`}>
                    {live ? zoneBadgeAr(f.id, customerZone) : "قريباً في منطقتك"}
                  </div>
                </button>
              );
            })}

            <button
              onClick={() => { setBookingService("libraries"); setBookingGov(profile.governorate || ""); setBookingProvider(""); setBookingDate(""); }}
              className="group p-3 rounded-xl border bg-card hover:border-gold transition-all text-start relative overflow-hidden">
              <div className="absolute -end-4 -top-4 text-5xl opacity-10 group-hover:opacity-20 transition-opacity">📚</div>
              <div className="text-2xl mb-1">📚</div>
              <div className="text-xs font-bold leading-tight">المكتبات والقرطاسيات</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">كتب · قرطاسية · أدوات مدرسية</div>
              <div className="absolute top-1.5 start-1.5 text-[8px] px-1.5 py-0.5 rounded-full font-bold bg-gold/20 text-gold">
                {zoneBadgeAr("libraries", customerZone)}
              </div>
            </button>
          </div>

          {/* Full-width: مول رافا التجاري */}
          {(() => {
            const mall = MALL_FOLDERS.find((f) => f.id === "mall")!;
            return (
              <button
                onClick={() => { setOpenFolder(mall.id); setMallTab(null); }}
                className="group mt-2 w-full p-4 rounded-xl border bg-card hover:border-gold transition-all text-start relative overflow-hidden flex items-center gap-3">
                <div className="absolute -end-4 -top-4 text-6xl opacity-10 group-hover:opacity-20 transition-opacity">{mall.emoji}</div>
                <div className="text-3xl">{mall.emoji}</div>
                <div className="flex-1">
                  <div className="text-sm font-bold leading-tight">{mall.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{mall.desc}</div>
                </div>
              </button>
            );
          })()}

          {/* Full-width: مكتبة RAVA الرقمية — Open Zone (صفحة مستقلة بكل الأقسام) */}
          <Link
            to="/library"
            className="group mt-2 w-full p-4 rounded-xl border bg-card hover:border-gold transition-all text-start relative overflow-hidden flex items-center gap-3">
            <div className="absolute -end-4 -top-4 text-6xl opacity-10 group-hover:opacity-20 transition-opacity">📚</div>
            <div className="text-3xl">📚</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold leading-tight flex items-center gap-2">
                مكتبة RAVA الرقمية
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-success/20 text-success">مفتوحة</span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {LIBRARY_CATEGORIES.length} أقسام · {ALL_BOOKS.length} كتاب — متاحة في كل المحافظات
              </div>
            </div>
          </Link>



          {/* Full-width: قطع غيار وإكسسوارات السيارات والمعدات (Needle to Rocket) */}
          {(() => {
            const spare = MALL_FOLDERS.find((f) => f.id === "spare")!;
            return (
              <button
                onClick={() => { setOpenFolder(spare.id); setMallTab(null); }}
                className="group mt-2 w-full p-4 rounded-xl border-2 bg-gradient-to-br from-card via-card to-gold/5 text-start relative overflow-hidden flex items-center gap-3 shadow-card transition-all border-gold/40 hover:border-gold">
                <div className="absolute -end-4 -top-4 text-6xl opacity-10 group-hover:opacity-20 transition-opacity">{spare.emoji}</div>
                <div className="text-3xl">{spare.emoji}</div>
                <div className="flex-1">
                  <div className="text-sm font-bold leading-tight flex items-center gap-2">
                    {spare.title}
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-success/20 text-success">متاح في منطقتك</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{spare.desc}</div>
                  <div className="text-[10px] text-gold/80 mt-1">🚛 توصيل بمركبات الشحن (تروسيكل · دبابة · ونش)</div>
                </div>
              </button>
            );
          })()}

        </Section>

        {/* BOTTOM: Vehicles */}
        <Section title="جاي على مزاجك تركب إيه دلوقتي؟ 😎" subtitle="اختر المركبة">
          <div className="grid grid-cols-3 gap-2">
            {FLEET_GRID.map((v) => {
              const Icon = v.icon;
              return (
                <button key={v.id} onClick={() => { setActiveVehicle(v); setMotoSubChoice(null); }}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border bg-card hover:border-gold transition-all text-center opacity-100">
                  <div className="text-xl leading-none">{v.emoji}</div>
                  <Icon className="w-4 h-4 text-gold" />
                  <span className="text-[11px] font-bold leading-tight">{v.label}</span>
                  <span className="text-[10px] leading-tight text-muted-foreground">{v.sub}</span>
                </button>
              );
            })}
          </div>

          {/* Utility row: Winsh + SOS rectangular */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => setActiveVehicle({ id: "winsh", backend: "winsh", icon: Wrench, emoji: "🚨", label: "ونش إنقاذ", sub: "سحب وقطر" })}
              className="flex items-center gap-2 p-3 rounded-xl border border-gold/40 bg-card hover:border-gold transition-all">
              <Wrench className="w-5 h-5 text-gold" />
              <div className="text-start leading-tight">
                <div className="text-xs font-bold">ونش إنقاذ</div>
                <div className="text-[10px] text-muted-foreground">سحب وقطر سيارات</div>
              </div>
            </button>
            <button
              onClick={() => dispatch({ type: "fireSos", customer: profile.name || "Guest", zone: profile.center || state.homeZone })}
              className="flex items-center gap-2 p-3 rounded-xl border border-destructive/40 bg-destructive/10 hover:bg-destructive/20 transition-all text-destructive">
              <ShieldAlert className="w-5 h-5" />
              <div className="text-start leading-tight">
                <div className="text-xs font-bold">الطوارئ</div>
                <div className="text-[10px] opacity-80">إرسال إشارة SOS</div>
              </div>
            </button>
          </div>
        </Section>

        {/* RAVA Bookings & Services — National coverage */}
        <Section title="حجوزات وخدمات رافا 🏥" subtitle="حجز عيادات · معامل · صالونات — بحث وطني في كل المحافظات">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {BOOKING_SERVICES.filter((s) => s.id !== "libraries").map((s) => (
              <button key={s.id}
                onClick={() => { setBookingService(s.id); setBookingGov(profile.governorate || ""); setBookingProvider(""); setBookingDate(""); }}
                className="p-3 rounded-xl border bg-card hover:border-gold transition-all text-start relative overflow-hidden group">
                <div className="absolute -end-3 -top-3 text-4xl opacity-10 group-hover:opacity-20">{s.emoji}</div>
                <div className="text-2xl mb-1">{s.emoji}</div>
                <div className="text-xs font-bold leading-tight">{s.title}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</div>
              </button>
            ))}
          </div>
          <div className="mt-2 text-[10px] text-muted-foreground text-center px-2">
            🌍 يمكنك حجز مقدم خدمة في أي محافظة بغض النظر عن موقعك الحالي
          </div>
        </Section>

      </div>

      {/* Right column: wallet + active order */}
      <div className="space-y-5">
        <div className="p-4 rounded-2xl bg-card border shadow-card relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-gold opacity-10 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Wallet className="w-4 h-4 text-gold" /> {t("familyWallet")}
            </div>
            <div className="text-3xl font-bold mt-2 bg-gradient-royal bg-clip-text text-transparent">
              {state.walletCustomer.toFixed(0)} <span className="text-sm text-muted-foreground font-normal">{t("egp")}</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">{t("balance")}</div>
            <div className="mt-3 pt-3 border-t">
              <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 flex items-center gap-1"><UsersIcon className="w-3 h-3" /> {t("familyMembers")}</div>
              <div className="flex flex-wrap gap-1.5">
                {state.family.map((f) => (
                  <span key={f.name} className="text-[11px] px-2 py-1 rounded-full chip-silver font-semibold">{f.name} · {f.share}%</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {activeOrder && (
          <div className="p-4 rounded-2xl border-2 border-gold bg-gradient-surface shadow-royal space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-primary uppercase tracking-wider">{t("activeOrder")}</div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">{activeOrder.status}</span>
            </div>
            {driver ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-royal grid place-items-center text-primary-foreground font-bold ring-2 ring-gold">{driver.name.charAt(0)}</div>
                  <div className="flex-1">
                    <div className="text-sm font-bold">{driver.name}</div>
                    <div className="text-[11px] text-muted-foreground">{driver.plate} · ★ {driver.rating}</div>
                  </div>
                  <a href={`tel:${driver.phone}`} className="p-2 rounded-lg btn-gold"><Phone className="w-4 h-4" /></a>
                </div>
                <LiveMap mode="customer" height={200} label={`${t("eta")} ${Math.max(1, Math.ceil(prepRemaining / 60))} ${t("minutes")}`} />
              </>
            ) : (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-warning animate-pulse" /> {t("pending")}
              </div>
            )}

            {/* Captain arrival waiting timer */}
            {!arrivedAt && driver && (
              <button onClick={() => { setArrivedAt(Date.now()); setWaitElapsed(0); }}
                className="w-full text-[11px] px-3 py-1.5 rounded-lg border border-gold/40 hover:bg-gold/10">
                محاكاة: الكابتن وصل نقطة الاستلام
              </button>
            )}
            {arrivedAt && (
              <div className="p-3 rounded-xl border-2 border-gold bg-gold/10 text-xs leading-relaxed">
                <div className="flex items-center gap-2 font-bold text-gold-foreground/90">
                  <Clock className="w-3.5 h-3.5 text-gold" />
                  تنبيه: الكابتن في انتظارك الآن — {fmt(waitElapsed)}
                </div>
                <div className="mt-1 text-[11px] opacity-90">
                  لديك 10 دقائق مجانية كحد أقصى، وفي حال التأخر لأكثر من ذلك،
                  سيحتسب النظام تكلفة وقت انتظار إضافية تلقائياً للفاتورة.
                </div>
                {waitExtraFee > 0 && (
                  <div className="mt-1 font-bold text-destructive">
                    وقت إضافي: {waitMin - 10} د · +{waitExtraFee} {t("egp")}
                  </div>
                )}
              </div>
            )}

            {/* Merchant prep timer with +5 min buffer */}
            {activeOrder.service !== "ride" && prepStartRef.current && (
              <div className="p-3 rounded-xl border bg-card text-xs">
                <div className="flex items-center gap-2 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-gold" />
                  تجهيز الطلب — متبقي {fmt(prepRemaining)}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">+5 دقائق هامش أمان للطريق</div>
              </div>
            )}

            <div className="text-[11px] text-muted-foreground">{activeOrder.pickup} → {activeOrder.dropoff}</div>
          </div>
        )}
      </div>

      {/* Inbox */}
      {showInbox && (
        <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center px-4" onClick={() => setShowInbox(false)}>
          <div className="bg-card rounded-2xl border border-gold shadow-royal max-w-md w-full p-5 max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()} dir="auto">
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold flex items-center gap-2"><Bell className="w-4 h-4 text-gold" /> {t("offers")}</div>
              <button onClick={() => setShowInbox(false)} className="p-1 rounded hover:bg-secondary"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-2">
              {state.notifications.map((n) => (
                <div key={n.id} className="p-3 rounded-xl bg-secondary/60 border border-gold/30">
                  <div className="text-sm font-semibold">{n.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">{n.body}</div>
                  <div className="text-[10px] text-muted-foreground mt-1.5">{new Date(n.ts).toLocaleString()}</div>
                </div>
              ))}
              {state.notifications.length === 0 && <div className="text-center text-xs text-muted-foreground py-8">—</div>}
            </div>
          </div>
        </div>
      )}

      {/* Mall folder */}
      {activeFolder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center px-0 md:px-4 animate-in fade-in duration-200"
          onClick={() => { setOpenFolder(null); setMallTab(null); }}>
          <div className="bg-card w-full md:max-w-lg md:rounded-2xl rounded-t-3xl border border-gold/40 shadow-royal max-h-[85vh] overflow-auto animate-in slide-in-from-bottom-8 duration-300"
            onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-gold/20 p-4 flex items-center gap-3 z-10">
              <button onClick={() => { setOpenFolder(null); setMallTab(null); }} className="p-1.5 rounded-lg hover:bg-secondary"><ChevronLeft className="w-4 h-4 rotate-180" /></button>
              <div className="text-2xl">{activeFolder.emoji}</div>
              <div className="flex-1">
                <div className="text-sm font-bold">{activeFolder.title}</div>
                <div className="text-[11px] text-muted-foreground">{folderMerchants.length} محل متاح في {profile.center}</div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => setMallTab(null)}
                  className={cn("text-[11px] px-3 py-1.5 rounded-full font-bold transition-all border",
                    mallTab === null ? "bg-gradient-royal text-primary-foreground border-transparent shadow-elegant" : "bg-secondary/60 border-gold/20 hover:border-gold")}>
                  الكل
                </button>
                {activeFolder.subLabels.map((s) => {
                  const isActive = mallTab === s;
                  return (
                    <button key={s} onClick={() => setMallTab(isActive ? null : s)}
                      className={cn("text-[11px] px-3 py-1.5 rounded-full font-bold transition-all border",
                        isActive ? "bg-gradient-royal text-primary-foreground border-transparent shadow-elegant" : "bg-secondary/60 border-gold/20 hover:border-gold")}>
                      {s}
                    </button>
                  );
                })}
              </div>
              {openFolder === "spare" && (
                <>
                  <SparePartsBreakdownPin onPinReady={(pin) => {
                    setBreakdownPin(pin);
                    dispatch({ type: "addNotif", n: { id: uid(), ts: Date.now(),
                      title: "تم تثبيت دبوس العطل 📍",
                      body: `سيتم تحويل طلبات قطع الغيار التالية إلى موقعك (${pin.vehicle === "winsh" ? "ونش" : pin.vehicle === "dababa" ? "ربع نقل" : "تروسيكل"}).` } });
                  }} />
                  {breakdownPin && (
                    <button
                      onClick={() => {
                        const order: import("../store").Order = {
                          id: uid(), service: "errands", vehicle: breakdownPin.vehicle as VehicleType,
                          customer: profile.name || "Guest",
                          pickup: "أقرب محل قطع غيار",
                          dropoff: `📍 ${breakdownPin.lat.toFixed(5)},${breakdownPin.lng.toFixed(5)}`,
                          distanceKm: 6, fareEgp: 120,
                          status: "pending", createdAt: Date.now(),
                          zone: profile.center || state.homeZone,
                          destZone: profile.center || state.homeZone,
                          stops: ["🚨 طلب إنقاذ — عطل في الطريق"],
                        };
                        dispatch({ type: "addOrder", order });
                        dispatch({ type: "addNotif", n: { id: uid(), ts: Date.now(),
                          title: "🚨 تم إرسال طلب إنقاذ فوري",
                          body: "جاري البحث عن أقرب كابتن شحن مناسب لموقعك." } });
                      }}
                      className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-elegant">
                      🚨 أرسل طلب إنقاذ فوري بالموقع المُثبَّت
                    </button>
                  )}
                </>
              )}
              {folderMerchants.length === 0 && (
                <div className="space-y-2">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="p-3 rounded-xl border border-dashed border-gold/30 bg-secondary/20 flex gap-3 animate-pulse">
                      <div className="w-14 h-14 rounded-lg bg-gold/10 shrink-0" />
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-3 rounded bg-gold/15 w-1/2" />
                        <div className="h-2 rounded bg-gold/10 w-3/4" />
                        <div className="h-2 rounded bg-gold/10 w-1/3" />
                      </div>
                    </div>
                  ))}
                  <div className="text-center text-xs text-muted-foreground py-4 px-3 rounded-xl border border-gold/20 bg-card">
                    لا توجد محلات نشطة بعد · سيتم إضافتها من شريك المنطقة
                  </div>
                </div>
              )}
              {folderMerchants.map((m, i) => {
                const seed = (m.id.charCodeAt(0) + i * 7) % 5;
                const minEta = 10 + seed * 3;
                const maxEta = minEta + 5;
                const hasOffer = (m.id.charCodeAt(1) % 3) === 0;
                const items = itemsForMerchant(activeFolder.id, m.name);
                return (
                  <div key={m.id} className="p-3 rounded-xl border bg-secondary/40 hover:border-gold transition-all space-y-2.5">
                    <div className="flex gap-3">
                      <div className="w-14 h-14 rounded-lg bg-gradient-royal grid place-items-center text-primary-foreground font-bold shrink-0 ring-1 ring-gold/40">
                        <StoreIcon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-bold truncate">{m.name}</div>
                          {hasOffer && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gold text-gold-foreground font-bold flex items-center gap-1 shrink-0">
                              <Tag className="w-2.5 h-2.5" /> عرض حصري للتطبيق
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{activeFolder.desc}</div>
                        <div className="text-[10px] text-success font-semibold mt-1.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> الوقت المتوقع للوصول: {minEta}-{maxEta} دقيقة
                        </div>
                      </div>
                    </div>
                    {/* Items list with Premium-Gold (+) and Sleek-Silver (−) quantity controls */}
                    <div className="space-y-1.5 pt-1 border-t border-gold/15">
                      {items.map((it) => {
                        const q = qtyOf(m.id, it.name);
                        return (
                          <div key={it.name} className="flex items-center gap-2 py-1">
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold truncate">{it.name}</div>
                              <div className="text-[10px] text-gold font-bold">{it.price} ج.م</div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => decFromCart(m.id, it.name)}
                                disabled={q === 0}
                                aria-label="إنقاص"
                                className="w-7 h-7 rounded-full grid place-items-center font-bold text-sm shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                style={{
                                  background: "linear-gradient(135deg, #d8dde3 0%, #a8b0bb 50%, #d8dde3 100%)",
                                  color: "#1f2937",
                                  border: "1px solid #9ca3af",
                                }}>
                                −
                              </button>
                              <span className="text-xs font-bold w-5 text-center tabular-nums">{q}</span>
                              <button
                                onClick={() => addToCart({ merchantId: m.id, merchantName: m.name, folderId: activeFolder.id, category: m.category, name: it.name, price: it.price })}
                                aria-label="إضافة"
                                className="w-7 h-7 rounded-full grid place-items-center font-bold text-sm shadow-sm transition-all hover:scale-105"
                                style={{
                                  background: "linear-gradient(135deg, #f4d35e 0%, #d4af37 50%, #b8860b 100%)",
                                  color: "#1f1300",
                                  border: "1px solid #b8860b",
                                }}>
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <div className="text-[10px] text-muted-foreground text-center pt-2 border-t border-gold/10">
                🛡️ لحماية التجار والعملاء — يتم إخفاء العنوان الدقيق والمسافة الفعلية
              </div>
            </div>
            {/* Sticky cart bar inside the mall sheet */}
            {cart.length > 0 && (
              <div className="sticky bottom-0 bg-card/95 backdrop-blur border-t border-gold/30 p-3 flex items-center gap-2">
                <button onClick={() => setShowCart(true)}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-royal text-primary-foreground font-bold text-sm shadow-royal flex items-center justify-center gap-2">
                  <Package className="w-4 h-4" /> عرض السلة ({cart.reduce((s, x) => s + x.qty, 0)}) · {cartTotal} ج.م
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cart drawer: Budget Tracker + Auto-Split Checkout */}
      {showCart && (
        <div className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center px-0 md:px-4" onClick={() => setShowCart(false)}>
          <div className="bg-card w-full md:max-w-md md:rounded-2xl rounded-t-3xl border-2 border-gold/40 shadow-royal max-h-[88vh] overflow-auto"
            onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-gold/20 p-4 flex items-center gap-3 z-10">
              <button onClick={() => setShowCart(false)} className="p-1.5 rounded-lg hover:bg-secondary"><X className="w-4 h-4" /></button>
              <div className="text-2xl">🛒</div>
              <div className="flex-1">
                <div className="text-sm font-bold">سلة المشتريات الذكية</div>
                <div className="text-[11px] text-muted-foreground">سيتم تقسيمها تلقائياً عند الدفع</div>
              </div>
            </div>
            <div className="p-4 space-y-4">
              {/* Budget Tracker */}
              <div className="p-3 rounded-xl border-2 border-gold/30 bg-gradient-to-br from-gold/5 to-transparent">
                <label className="text-xs font-bold mb-1.5 block flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-gold" /> ميزانية الشراء (اختياري)
                </label>
                <input
                  type="number" inputMode="numeric" min={0}
                  value={budget} onChange={(e) => setBudget(e.target.value)}
                  placeholder="مثال: 500"
                  className="w-full px-3 py-2 rounded-lg bg-background border text-sm outline-none focus:border-gold" />
                {budgetNum > 0 && (
                  <div className="mt-2 text-[11px]">
                    {overBudget ? (
                      <div className="p-2 rounded-lg bg-destructive/15 border border-destructive/40 text-destructive font-bold flex items-start gap-1.5">
                        ⚠️ تجاوزت ميزانيتك بـ <b>{cartTotal - budgetNum} ج.م</b>. يمكنك إتمام الشراء أو حذف بعض العناصر.
                      </div>
                    ) : (
                      <div className="p-2 rounded-lg bg-success/15 border border-success/30 text-success font-bold">
                        ✓ ضمن الميزانية — متبقي {budgetNum - cartTotal} ج.م
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* Grouped cart by category (so user sees the split before checkout) */}
              {(() => {
                const byFolder = new Map<MallFolderId, CartItem[]>();
                cart.forEach((it) => {
                  if (!byFolder.has(it.folderId)) byFolder.set(it.folderId, []);
                  byFolder.get(it.folderId)!.push(it);
                });
                return Array.from(byFolder.entries()).map(([fid, items]) => {
                  const folder = MALL_FOLDERS.find((f) => f.id === fid)!;
                  const sub = items.reduce((s, x) => s + x.price * x.qty, 0);
                  const delivery = deliveryFeeForFolder(fid);
                  return (
                    <div key={fid} className="p-3 rounded-xl border bg-secondary/40 space-y-1.5">
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <span className="text-lg">{folder.emoji}</span> {folder.title}
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gold/15 text-gold font-bold ms-auto">طلب مستقل</span>
                      </div>
                      {items.map((it) => (
                        <div key={it.merchantId + it.name} className="flex items-center gap-2 text-[11px]">
                          <span className="flex-1 truncate">{it.name} × {it.qty}</span>
                          <span className="font-bold">{it.price * it.qty} ج.م</span>
                          <button onClick={() => decFromCart(it.merchantId, it.name)} className="p-1 rounded hover:bg-destructive/20 text-destructive">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <div className="flex justify-between text-[10px] text-muted-foreground pt-1 border-t border-gold/10">
                        <span>توصيل مستقل</span><span>+{delivery} ج.م</span>
                      </div>
                      <div className="flex justify-between text-[11px] font-bold">
                        <span>إجمالي الطلب</span><span className="text-gold">{sub + delivery} ج.م</span>
                      </div>
                    </div>
                  );
                });
              })()}
              <div className="p-3 rounded-xl bg-gradient-royal text-primary-foreground shadow-royal">
                <div className="flex justify-between text-xs font-bold">
                  <span>الإجمالي قبل التوصيل</span><span>{cartTotal} ج.م</span>
                </div>
              </div>
              <CustomerPaymentMethods />
              <button onClick={() => gateAndRun(checkoutCart)}
                className="w-full py-3 rounded-xl bg-gradient-gold text-gold-foreground font-bold shadow-royal text-sm">
                إتمام الشراء وتقسيم الطلبات تلقائياً 🚚
              </button>
              <div className="text-[10px] text-muted-foreground text-center">
                كل تصنيف يُرسل في طلب مستقل مع رسوم توصيل خاصة به — حتى لا يختلط الأمر على الكباتن.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle booking modal */}
      {activeVehicle && (
        <VehicleModal
          vehicle={activeVehicle}
          motoSubChoice={motoSubChoice}
          setMotoSubChoice={setMotoSubChoice}
          // ride
          pickup={pickup} setPickup={setPickup}
          dropoff={dropoff} setDropoff={setDropoff}
          stops={stops} setStops={setStops}
          scheduled={scheduled} setScheduled={setScheduled}
          // courier
          courierItems={courierItems} setCourierItems={setCourierItems}
          courierBudget={courierBudget} setCourierBudget={setCourierBudget}
          courierPickup={courierPickup} setCourierPickup={setCourierPickup}
          courierDelivery={courierDelivery} setCourierDelivery={setCourierDelivery}
          // fetch
          fetchItems={fetchItems} setFetchItems={setFetchItems}
          fetchBudget={fetchBudget} setFetchBudget={setFetchBudget}
          fetchStore={fetchStore} setFetchStore={setFetchStore}
          onClose={() => { setActiveVehicle(null); setMotoSubChoice(null); }}
          onConfirmRide={() => gateAndRun(submitRide)}
          onConfirmCourier={() => gateAndRun(submitCourier)}
          onConfirmFetch={() => gateAndRun(submitFetch)}
        />
      )}

      {/* WhatsApp OTP + Profile registration */}
      {regStep && (
        <RegistrationModal
          step={regStep}
          otpPhone={otpPhone} setOtpPhone={setOtpPhone}
          otpCode={otpCode} setOtpCode={setOtpCode}
          otpSent={otpSent} resendIn={resendIn}
          onSend={sendOtp} onVerify={verifyOtp}
          regName={regName} setRegName={setRegName}
          regEmail={regEmail} setRegEmail={setRegEmail}
          regPromo={regPromo} setRegPromo={setRegPromo}
          onComplete={completeRegistration}
          onClose={() => { setRegStep(null); setPendingSubmit(null); }}
          center={profile.center || ""}
        />
      )}

      {/* RAVA Bookings modal */}
      {bookingService && (() => {
        const svc = BOOKING_SERVICES.find((s) => s.id === bookingService)!;
        const govs = Object.keys(EGYPT_CENTERS);
        const close = () => { setBookingService(null); setBookingProvider(""); setBookingDate(""); };
        // Real approved medical providers matching this service category
        const specMap: Record<string, "clinic" | "lab" | "salon" | null> = { clinics: "clinic", labs: "lab", salons: "salon", libraries: null };
        const wantSpec = specMap[svc.id];
        const realProviders = wantSpec
          ? state.medicalProviders.filter((p) => p.status === "approved" && p.specialty === wantSpec
              && (!bookingGov || p.branches.some((b) => b.governorate === bookingGov)))
          : [];
        const weekdayFromDate = (iso: string): "sat"|"sun"|"mon"|"tue"|"wed"|"thu"|"fri" | null => {
          if (!iso) return null;
          const d = new Date(iso).getDay(); // 0=Sun
          return (["sun","mon","tue","wed","thu","fri","sat"] as const)[d];
        };
        const selectedWd = weekdayFromDate(bookingDate);
        const matchedProvider = realProviders.find((p) => p.name === bookingProvider);
        const matchedBranch = matchedProvider && selectedWd
          ? matchedProvider.branches.find((b) =>
              matchedProvider.slots.some((s) => s.branchId === b.id && s.weekday === selectedWd)
              && (!bookingGov || b.governorate === bookingGov))
          : null;
        const confirm = () => {
          if (!bookingGov || !bookingProvider || !bookingDate) return;
          const isOutOfCity = !!profile.governorate && bookingGov !== profile.governorate;
          const branchLabel = matchedBranch ? ` · ${matchedBranch.label}` : "";
          const summary = `${svc.title} · ${bookingProvider}${branchLabel} · ${bookingGov} · ${bookingDate}`;
          setLastBookingSummary(summary);
          if (matchedProvider && matchedBranch) {
            dispatch({ type: "addMedicalBooking", b: {
              id: uid(), providerId: matchedProvider.id, branchId: matchedBranch.id,
              customerName: profile.name || "Guest", customerPhone: profile.phone,
              dateISO: bookingDate, service: svc.title, price: 250, paid: false, ts: Date.now(),
            }});
          }
          dispatch({ type: "addNotif", n: { id: uid(), ts: Date.now(), title: "تم تأكيد الحجز ✅", body: summary } });
          close();
          if (isOutOfCity) setShowVipTravel(true);
        };
        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center px-0 md:px-4" onClick={close}>
            <div className="bg-card w-full md:max-w-md md:rounded-2xl rounded-t-3xl border border-gold/40 shadow-royal max-h-[88vh] overflow-auto"
              onClick={(e) => e.stopPropagation()} dir="rtl">
              <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-gold/20 p-4 flex items-center gap-3 z-10">
                <button onClick={close} className="p-1.5 rounded-lg hover:bg-secondary"><X className="w-4 h-4" /></button>
                <div className="text-2xl">{svc.emoji}</div>
                <div className="flex-1">
                  <div className="text-sm font-bold">{svc.title}</div>
                  <div className="text-[11px] text-muted-foreground">{svc.sub}</div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="text-xs font-bold mb-1 block">المحافظة (بحث وطني)</label>
                  <select value={bookingGov} onChange={(e) => { setBookingGov(e.target.value); setBookingProvider(""); }}
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-gold/30 focus:border-gold outline-none text-sm">
                    <option value="">— اختر المحافظة —</option>
                    {govs.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <div className="text-[10px] text-muted-foreground mt-1">📍 موقعك الحالي: {profile.governorate} — يمكنك الحجز في أي محافظة</div>
                </div>
                <div>
                  <label className="text-xs font-bold mb-1 block">اختر مقدم الخدمة</label>
                  <div className="space-y-1.5">
                    {realProviders.map((p) => (
                      <button key={p.id} onClick={() => setBookingProvider(p.name)}
                        className={cn("w-full text-start p-2.5 rounded-lg border text-xs transition-all flex items-center gap-2",
                          bookingProvider === p.name ? "border-gold bg-gold/10 font-bold" : "bg-background hover:border-gold/60")}>
                        {p.promoImage && <img src={p.promoImage} alt={p.name} className="w-8 h-8 rounded object-cover" />}
                        <span className="flex-1">
                          <span className="block font-bold">{p.name}</span>
                          <span className="block text-[10px] text-muted-foreground">{p.specializationLabel}</span>
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-success/15 text-success text-[9px] font-bold">معتمد</span>
                      </button>
                    ))}
                    {svc.sampleProviders.map((p) => (
                      <button key={p} onClick={() => setBookingProvider(p)}
                        className={cn("w-full text-start p-2.5 rounded-lg border text-xs transition-all",
                          bookingProvider === p ? "border-gold bg-gold/10 font-bold" : "bg-background hover:border-gold/60")}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold mb-1 block">التاريخ والوقت</label>
                  {matchedProvider ? (
                    <>
                      <input type="date" value={bookingDate.slice(0, 10)}
                        onChange={(e) => setBookingDate(e.target.value ? `${e.target.value}T00:00` : "")}
                        className="w-full px-3 py-2 rounded-lg bg-background border text-sm outline-none focus:border-gold" />
                      {bookingDate && selectedWd && (() => {
                        const daySlots = matchedProvider.slots.filter((s) => s.weekday === selectedWd
                          && (!bookingGov || matchedProvider.branches.find((b) => b.id === s.branchId)?.governorate === bookingGov));
                        if (daySlots.length === 0) {
                          return (
                            <div className="mt-2 p-2 rounded-lg bg-destructive/10 border border-destructive/40 text-[11px] text-destructive">
                              لا يعمل مقدم الخدمة في هذا اليوم/المحافظة — اختر تاريخاً آخر.
                            </div>
                          );
                        }
                        const day = bookingDate.slice(0, 10);
                        const times: string[] = [];
                        for (const s of daySlots) {
                          const [fh, fm] = s.from.split(":").map(Number);
                          const [th, tm] = s.to.split(":").map(Number);
                          for (let m = fh * 60 + fm; m + 30 <= th * 60 + tm; m += 30) {
                            const t = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
                            if (!times.includes(t)) times.push(t);
                          }
                        }
                        times.sort();
                        const taken = new Set(state.medicalBookings
                          .filter((b) => b.providerId === matchedProvider.id && b.dateISO.slice(0, 10) === day)
                          .map((b) => b.dateISO.slice(11, 16)));
                        return (
                          <div className="mt-2">
                            <div className="text-[11px] font-bold mb-1">🕒 المواعيد المتاحة (يحددها مقدم الخدمة)</div>
                            <div className="grid grid-cols-4 gap-1.5">
                              {times.map((t) => {
                                const busy = taken.has(t);
                                const active = bookingDate.slice(11, 16) === t;
                                return (
                                  <button key={t} type="button" disabled={busy}
                                    onClick={() => setBookingDate(`${day}T${t}`)}
                                    className={cn("py-1.5 rounded-lg border text-[11px] font-mono",
                                      busy ? "opacity-35 line-through bg-secondary" :
                                      active ? "border-gold bg-gold/15 font-bold" : "bg-background hover:border-gold/60")}>
                                    {t}
                                  </button>
                                );
                              })}
                            </div>
                            {times.every((t) => taken.has(t)) && (
                              <div className="mt-1 text-[10px] text-destructive">كل مواعيد هذا اليوم محجوزة.</div>
                            )}
                          </div>
                        );
                      })()}
                    </>
                  ) : (
                    <input type="datetime-local" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border text-sm outline-none focus:border-gold" />
                  )}
                  {matchedProvider && matchedBranch && bookingDate && (
                    <div className="mt-2 p-2 rounded-lg bg-success/10 border border-success/40 text-[11px]">
                      📍 <b>الفرع لهذا الموعد:</b> {matchedBranch.label} — {matchedBranch.governorate}
                      {matchedBranch.mapUrl && <a href={matchedBranch.mapUrl} target="_blank" rel="noreferrer" className="text-gold underline ms-1">خريطة</a>}
                    </div>
                  )}
                  <div className="mt-1 text-[10px] text-muted-foreground">💰 الدفع كاش في الموقع</div>
                </div>
                <button onClick={confirm}
                  disabled={!bookingGov || !bookingProvider || !bookingDate || (!!matchedProvider && bookingDate.slice(11, 16) === "00:00")}
                  className="w-full py-3 rounded-xl bg-gradient-royal text-primary-foreground font-bold shadow-royal hover:opacity-90 disabled:opacity-40 text-sm">
                  تأكيد الحجز
                </button>

              </div>
            </div>
          </div>
        );
      })()}

      {/* Premium VIP intercity travel suggestion */}
      {showVipTravel && (
        <div className="fixed inset-0 z-[55] bg-black/70 backdrop-blur-sm grid place-items-center px-4" onClick={() => setShowVipTravel(false)}>
          <div className="bg-card w-full max-w-md rounded-2xl border-2 border-gold shadow-royal p-5 space-y-4 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="absolute -top-16 -end-16 w-48 h-48 rounded-full bg-gradient-gold opacity-25 blur-2xl pointer-events-none" />
            <div className="relative">
              <div className="text-3xl">🚘✨</div>
              <div className="text-base font-bold mt-2">سيارة فخمة مكيفة ومريحة للسفر البعيد</div>
              <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                حجزك خارج محافظتك — يمكننا تجهيز <b className="text-gold">رحلة VIP</b> مع كابتن من فئة
                <span className="font-mono mx-1 px-1.5 py-0.5 rounded bg-gold/15 text-gold font-bold">VIP-XXXX</span>
                لراحتك التامة طوال الطريق.
              </p>
              {lastBookingSummary && (
                <div className="mt-3 p-2.5 rounded-lg bg-secondary/60 text-[11px]">
                  <div className="font-bold mb-0.5">حجزك المؤكد:</div>
                  <div className="text-muted-foreground">{lastBookingSummary}</div>
                </div>
              )}
              <div className="mt-4 flex gap-2">
                <button onClick={() => {
                  dispatch({ type: "addNotif", n: { id: uid(), ts: Date.now(), title: "تم طلب رحلة VIP ✨", body: "سيتم تخصيص كابتن VIP-XXXX لرحلتك بين المدن" } });
                  setShowVipTravel(false);
                }}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-royal text-primary-foreground font-bold text-sm shadow-royal">
                  احجز رحلة VIP
                </button>
                <button onClick={() => setShowVipTravel(false)}
                  className="px-4 py-2.5 rounded-xl border text-xs font-bold hover:bg-secondary">
                  لاحقاً
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// First-time location picker overlay
// ============================================================
function LocationPicker({ onDone }: { onDone: (gov: string, center: string) => void }) {
  const [gov, setGov] = useState("");
  const [center, setCenter] = useState("");
  const govs = Object.keys(EGYPT_CENTERS);
  const centers = gov ? EGYPT_CENTERS[gov] || [] : [];
  return (
    <div className="fixed inset-0 z-[60] bg-gradient-to-br from-background via-background to-primary/20 grid place-items-center px-4" dir="rtl">
      <div className="max-w-md w-full bg-card border-2 border-gold rounded-3xl shadow-royal p-6 space-y-5 relative overflow-hidden">
        <div className="absolute -top-12 -end-12 w-40 h-40 rounded-full bg-gradient-gold opacity-20 blur-2xl pointer-events-none" />
        <div className="relative">
          <div className="text-3xl mb-2">🗺️</div>
          <h1 className="text-lg font-bold leading-relaxed">
            أهلاً بك في عائلة رافا 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            عرفنا مكانك دلوقتي عشان نخدمك بأسرع وأسهل طريقة ونظهرلك كل المحلات والكباتن اللي حواليك! 🗺️
          </p>
        </div>
        <div className="space-y-3 relative">
          <div>
            <label className="text-xs font-bold mb-1.5 block">اختر المحافظة</label>
            <select value={gov} onChange={(e) => { setGov(e.target.value); setCenter(""); }}
              className="w-full px-3 py-2.5 rounded-xl bg-background border border-gold/30 focus:border-gold outline-none text-sm">
              <option value="">— اختر —</option>
              {govs.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold mb-1.5 block">اختر المركز أو المدينة</label>
            <select value={center} onChange={(e) => setCenter(e.target.value)} disabled={!gov}
              className="w-full px-3 py-2.5 rounded-xl bg-background border border-gold/30 focus:border-gold outline-none text-sm disabled:opacity-50">
              <option value="">— اختر —</option>
              {centers.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <button
          onClick={() => gov && center && onDone(gov, center)}
          disabled={!gov || !center}
          className="w-full py-3 rounded-xl bg-gradient-royal text-primary-foreground font-bold shadow-royal hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-sm">
          🚀 دخول التطبيق
        </button>
        <div className="text-[10px] text-muted-foreground text-center">
          {govs.length} محافظة · {Object.values(EGYPT_CENTERS).reduce((s, a) => s + a.length, 0)}+ مركز ومدينة
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Section
// ============================================================
function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-2">
        <div className="text-sm font-bold">{title}</div>
        {subtitle && <div className="text-[10px] text-muted-foreground">· {subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

// ============================================================
// Triple-input location row
// ============================================================
function LocationRow({ icon, placeholder, value, onChange }: {
  icon: React.ReactNode; placeholder: string; value: string; onChange: (v: string) => void;
}) {
  const [mode, setMode] = useState<"text" | "link" | "map">("text");
  return (
    <div className="p-3 rounded-xl border bg-card space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold">
        {icon}
        <span>{placeholder}</span>
      </div>
      <div className="flex gap-1">
        {([
          ["text", "كتابة العنوان", MapPin],
          ["link", "لصق رابط الخريطة", Link2],
          ["map", "اختر من الخريطة", MapIcon],
        ] as const).map(([m, lbl, Ic]) => (
          <button key={m} onClick={() => setMode(m)}
            className={cn("flex-1 text-[10px] px-2 py-1 rounded-md border flex items-center justify-center gap-1",
              mode === m ? "bg-gradient-royal text-primary-foreground border-transparent" : "bg-background hover:border-gold")}>
            <Ic className="w-3 h-3" /> {lbl}
          </button>
        ))}
      </div>
      {mode === "map" ? (
        <button onClick={() => onChange("📍 موقع محدد من الخريطة")} className="w-full text-xs py-6 rounded-lg border-2 border-dashed border-gold/40 hover:bg-gold/5">
          {value || "اضغط لاختيار من الخريطة"}
        </button>
      ) : (
        <input
          value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={mode === "link" ? "https://maps.google.com/..." : "اكتب العنوان بالتفصيل"}
          className="w-full px-2.5 py-2 rounded-lg bg-background border text-xs outline-none focus:border-gold" />
      )}
    </div>
  );
}

// ============================================================
// Vehicle booking modal
// ============================================================
function VehicleModal(props: {
  vehicle: FleetOpt; motoSubChoice: "persons" | "fetch" | null;
  setMotoSubChoice: (v: "persons" | "fetch" | null) => void;
  pickup: string; setPickup: (v: string) => void;
  dropoff: string; setDropoff: (v: string) => void;
  stops: string[]; setStops: (s: string[]) => void;
  scheduled: string; setScheduled: (v: string) => void;
  courierItems: string; setCourierItems: (v: string) => void;
  courierBudget: string; setCourierBudget: (v: string) => void;
  courierPickup: string; setCourierPickup: (v: string) => void;
  courierDelivery: string; setCourierDelivery: (v: string) => void;
  fetchItems: string; setFetchItems: (v: string) => void;
  fetchBudget: string; setFetchBudget: (v: string) => void;
  fetchStore: string; setFetchStore: (v: string) => void;
  onClose: () => void;
  onConfirmRide: () => void;
  onConfirmCourier: () => void;
  onConfirmFetch: () => void;
}) {
  const v = props.vehicle;
  const isCourier = v.id === "courier";
  const isMoto = v.id === "motorbike";
  const showMotoChoice = isMoto && !props.motoSubChoice;
  const showFetchForm = isMoto && props.motoSubChoice === "fetch";
  const showRideForm = !isCourier && !showMotoChoice && !showFetchForm;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center px-0 md:px-4" onClick={props.onClose}>
      <div className="bg-card w-full md:max-w-lg md:rounded-2xl rounded-t-3xl border border-gold/40 shadow-royal max-h-[88vh] overflow-auto"
        onClick={(e) => e.stopPropagation()} dir="rtl">
        <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-gold/20 p-4 flex items-center gap-3 z-10">
          <button onClick={props.onClose} className="p-1.5 rounded-lg hover:bg-secondary"><X className="w-4 h-4" /></button>
          <div className="text-2xl">{v.emoji}</div>
          <div className="flex-1">
            <div className="text-sm font-bold">{v.label}</div>
            <div className="text-[11px] text-muted-foreground">{v.sub}</div>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {/* Courier flow */}
          {isCourier && (
            <>
              <div>
                <label className="text-xs font-bold mb-1 block">اكتب بالتفصيل الحاجات اللي محتاجها والمكان اللي نشتري منه</label>
                <textarea
                  value={props.courierItems} onChange={(e) => props.setCourierItems(e.target.value)}
                  rows={4}
                  placeholder="مثال: 2 كيلو طماطم من سوبر ماركت الفجر، علبة دواء بانادول من صيدلية النور..."
                  className="w-full px-3 py-2 rounded-lg bg-background border text-sm outline-none focus:border-gold resize-none" />
              </div>
              <div>
                <label className="text-xs font-bold mb-1 block">ميزانية المشتريات التقريبية</label>
                <div className="flex items-center gap-2">
                  <input type="number" inputMode="decimal" min={0}
                    value={props.courierBudget} onChange={(e) => props.setCourierBudget(e.target.value)}
                    placeholder="0"
                    className="flex-1 px-3 py-2 rounded-lg bg-background border text-sm outline-none focus:border-gold" />
                  <span className="text-xs text-muted-foreground">جنيه</span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">سيتم تنبيه المندوب بالمبلغ الكاش المطلوب</div>
              </div>
              <LocationRow icon={<MapPin className="w-3.5 h-3.5 text-gold" />} placeholder="موقع الاستلام (من أين سنشتري)" value={props.courierPickup} onChange={props.setCourierPickup} />
              <LocationRow icon={<Flag className="w-3.5 h-3.5 text-gold" />} placeholder="موقع التوصيل (السكن / المنزل)" value={props.courierDelivery} onChange={props.setCourierDelivery} />
              <button onClick={props.onConfirmCourier} className="w-full py-3 rounded-xl bg-gradient-royal text-primary-foreground font-bold shadow-royal hover:opacity-90 text-sm">
                تأكيد الطلب
              </button>
            </>
          )}

          {/* Moto sub-choice */}
          {showMotoChoice && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground text-center mb-2">اختر نوع خدمة الموتوسيكل</div>
              <button onClick={() => props.setMotoSubChoice("persons")}
                className="w-full p-4 rounded-xl border-2 border-gold/30 bg-card hover:border-gold text-start">
                <div className="text-base font-bold">🏍️ توصيل أفراد (مشوار شخصي)</div>
                <div className="text-[11px] text-muted-foreground mt-1">مشوار خاص من موقعك إلى وجهتك</div>
              </button>
              <button onClick={() => props.setMotoSubChoice("fetch")}
                className="w-full p-4 rounded-xl border-2 border-gold/30 bg-card hover:border-gold text-start">
                <div className="text-base font-bold">🛍️ رافا هاتلي (طلبات حرة)</div>
                <div className="text-[11px] text-muted-foreground mt-1">حدد المنتجات والميزانية والمحل وسنحضرها لك</div>
              </button>
            </div>
          )}

          {/* Fetch form (rafa hatli) */}
          {showFetchForm && (
            <>
              <button onClick={() => props.setMotoSubChoice(null)} className="text-[11px] text-gold underline">رجوع لاختيار الخدمة</button>
              <div>
                <label className="text-xs font-bold mb-1 block">الطلبات المطلوبة بالتفصيل</label>
                <textarea value={props.fetchItems} onChange={(e) => props.setFetchItems(e.target.value)} rows={3}
                  placeholder="اكتب ما تريد إحضاره..."
                  className="w-full px-3 py-2 rounded-lg bg-background border text-sm outline-none focus:border-gold resize-none" />
              </div>
              <div>
                <label className="text-xs font-bold mb-1 block">المحل / الموقع المقترح</label>
                <input value={props.fetchStore} onChange={(e) => props.setFetchStore(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border text-sm outline-none focus:border-gold" />
              </div>
              <div>
                <label className="text-xs font-bold mb-1 block">الميزانية التقريبية</label>
                <input type="number" min={0} value={props.fetchBudget} onChange={(e) => props.setFetchBudget(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border text-sm outline-none focus:border-gold" />
              </div>
              <button onClick={props.onConfirmFetch}
                className="w-full py-3 rounded-xl bg-gradient-royal text-primary-foreground font-bold shadow-royal hover:opacity-90 text-sm">
                تأكيد طلب رافا هاتلي
              </button>
            </>
          )}

          {/* Ride form (incl. winsh, car, tuktuk, tricycle, dababa, motorbike-persons) */}
          {showRideForm && (
            <>
              <LiveMap
                mode="customer"
                height={180}
                label="حدد موقع الاستلام أو الوجهة"
                onPick={(p) => {
                  const tag = `📍 ${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`;
                  if (!props.pickup) props.setPickup(tag);
                  else props.setDropoff(tag);
                }}
              />
              <LocationRow icon={<MapPin className="w-3.5 h-3.5 text-success" />} placeholder="📍 حدد موقع استلامك الحالي" value={props.pickup} onChange={props.setPickup} />
              <LocationRow icon={<Flag className="w-3.5 h-3.5 text-destructive" />} placeholder="🏁 الوجهة التي تريد الذهاب إليها" value={props.dropoff} onChange={props.setDropoff} />
              {props.stops.map((s, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <LocationRow icon={<MapPin className="w-3.5 h-3.5 text-gold" />} placeholder={`محطة ${i + 1}`} value={s}
                      onChange={(v) => props.setStops(props.stops.map((x, j) => j === i ? v : x))} />
                  </div>
                  <button onClick={() => props.setStops(props.stops.filter((_, j) => j !== i))} className="p-2 rounded-lg border hover:bg-destructive/10 hover:border-destructive mt-1">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button onClick={() => props.setStops([...props.stops, ""])}
                className="w-full py-2 rounded-lg border border-dashed border-gold/40 text-xs font-semibold hover:bg-gold/5 flex items-center justify-center gap-1">
                <Plus className="w-3.5 h-3.5" /> ➕ إضافة محطة توقف
              </button>

              <div className="p-3 rounded-xl border bg-secondary/30 space-y-2">
                <div className="text-xs font-bold flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-gold" /> احجز لوقت لاحق</div>
                <input type="datetime-local" value={props.scheduled} onChange={(e) => props.setScheduled(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border text-xs outline-none focus:border-gold" />
                <div className="text-[10px] text-muted-foreground">احجز مشوارك لتاريخ ووقت محدد</div>
              </div>

              <button onClick={props.onConfirmRide}
                className="w-full py-3 rounded-xl bg-gradient-royal text-primary-foreground font-bold shadow-royal hover:opacity-90 text-sm flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" /> تأكيد المشوار
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Registration modal (WhatsApp OTP + Profile)
// ============================================================
function RegistrationModal(props: {
  step: "otp" | "profile";
  otpPhone: string; setOtpPhone: (v: string) => void;
  otpCode: string; setOtpCode: (v: string) => void;
  otpSent: string | null; resendIn: number;
  onSend: () => void; onVerify: () => void;
  regName: string; setRegName: (v: string) => void;
  regEmail: string; setRegEmail: (v: string) => void;
  regPromo: string; setRegPromo: (v: string) => void;
  onComplete: () => void; onClose: () => void;
  center: string;
}) {
  return (
    <div className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm grid place-items-center px-4" onClick={props.onClose}>
      <div className="bg-card w-full max-w-md rounded-2xl border-2 border-gold shadow-royal p-5 space-y-4" onClick={(e) => e.stopPropagation()} dir="rtl">
        <div className="flex items-center justify-between">
          <div className="font-bold text-sm flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-success" />
            {props.step === "otp" ? "التحقق عبر الواتساب" : "إكمال البيانات"}
          </div>
          <button onClick={props.onClose} className="p-1 rounded hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>

        {props.step === "otp" && (
          <>
            <div className="text-[11px] text-muted-foreground">
              لاستكمال الطلب، نحتاج رقم واتساب مصري لإرسال رمز التحقق.
            </div>
            <div>
              <label className="text-xs font-bold mb-1 block">رقم الموبايل</label>
              <input
                value={props.otpPhone} onChange={(e) => props.setOtpPhone(e.target.value)}
                placeholder="01xxxxxxxxx" inputMode="tel" maxLength={13}
                className="w-full px-3 py-2.5 rounded-xl bg-background border text-sm outline-none focus:border-gold" />
            </div>
            {!props.otpSent ? (
              <button onClick={props.onSend}
                className="w-full py-2.5 rounded-xl bg-success text-success-foreground font-bold text-sm flex items-center justify-center gap-2">
                <MessageCircle className="w-4 h-4" /> ارسل رمز التحقق عبر الواتساب
              </button>
            ) : (
              <>
                <div className="text-[11px] text-success bg-success/10 border border-success/30 rounded-lg p-2">
                  ✅ تم إرسال رمز مكون من 4 أرقام عبر الواتساب (المحاكاة: <b>{props.otpSent}</b>)
                </div>
                <div>
                  <label className="text-xs font-bold mb-1 block">أدخل الرمز (4 أرقام)</label>
                  <input value={props.otpCode} onChange={(e) => props.setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    inputMode="numeric" maxLength={4}
                    className="w-full px-3 py-2.5 rounded-xl bg-background border text-center text-xl font-bold tracking-[0.5em] outline-none focus:border-gold" />
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <button onClick={props.onSend} disabled={props.resendIn > 0}
                    className="text-gold underline disabled:opacity-50 disabled:no-underline">
                    {props.resendIn > 0 ? `إعادة الإرسال خلال ${props.resendIn}ث` : "إعادة إرسال الرمز"}
                  </button>
                </div>
                <button onClick={props.onVerify} disabled={props.otpCode.length !== 4}
                  className="w-full py-2.5 rounded-xl bg-gradient-royal text-primary-foreground font-bold text-sm disabled:opacity-50">
                  تحقق ومتابعة
                </button>
              </>
            )}
          </>
        )}

        {props.step === "profile" && (
          <>
            <div className="text-[11px] text-muted-foreground">
              أكمل بياناتك لربط حسابك بمنطقة <b className="text-gold">{props.center}</b>
            </div>
            <div>
              <label className="text-xs font-bold mb-1 block">الاسم بالكامل</label>
              <input value={props.regName} onChange={(e) => props.setRegName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-background border text-sm outline-none focus:border-gold" />
            </div>
            <div>
              <label className="text-xs font-bold mb-1 block">البريد الإلكتروني <span className="text-muted-foreground font-normal">(اختياري)</span></label>
              <input value={props.regEmail} onChange={(e) => props.setRegEmail(e.target.value)} type="email"
                className="w-full px-3 py-2.5 rounded-xl bg-background border text-sm outline-none focus:border-gold" />
            </div>
            <div>
              <label className="text-xs font-bold mb-1 block">كود الدعوة / البروموكود <span className="text-muted-foreground font-normal">(اختياري)</span></label>
              <input value={props.regPromo} onChange={(e) => props.setRegPromo(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-background border text-sm outline-none focus:border-gold" />
            </div>
            <button onClick={props.onComplete} disabled={!props.regName.trim()}
              className="w-full py-2.5 rounded-xl bg-gradient-royal text-primary-foreground font-bold text-sm disabled:opacity-50">
              حفظ وإكمال الطلب
            </button>
          </>
        )}
      </div>
    </div>
  );
}



