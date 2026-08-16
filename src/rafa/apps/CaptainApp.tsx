import { useCallback, useEffect, useRef, useState } from "react";
import { CaptainPremiumMap } from "../components/CaptainPremiumMapLazy";
import type { RouteKind } from "../components/CaptainPremiumMap";
import type { CaptainFleet } from "../store";
import { useCaptainWallet, type CaptainWallet } from "../hooks/useCaptainWallet";
import { useCaptainShifts, type Shift } from "../hooks/useCaptainShifts";
import {
  Menu, Phone, Navigation, MessageCircle, Send, X, Satellite, Map as MapIcon,
  Camera, ShieldAlert, Star, Check, Wallet, Clock, Inbox, CalendarDays,
  ScrollText, ChevronRight, ChevronLeft, ChevronDown, User, Tag, ShieldCheck,
  Settings, ArrowRight, Repeat, Bike, Package, BadgeDollarSign, Headphones,
  AlertTriangle, Wrench, FileText, CreditCard, Smartphone, Trophy, CheckCircle2,
  Gauge, Zap, Leaf, CornerUpLeft, LocateFixed, Briefcase, Volume2, VolumeX,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useEgyptianVoice } from "../hooks/useEgyptianVoice";


/* ---------- helpers ---------- */
const AR_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
const toAr = (n: number | string) => String(n).replace(/[0-9]/g, (d) => AR_DIGITS[+d]);
const CAPTAIN_NAME = "ABDELKADER MOHAMED ABDELKADER";

/* ---------- mock data ---------- */
const QUICK_REPLIES = [
  "أنا في الطريق إليك يا فندم 🧭",
  "وصلت لموقع الاستلام 📍",
  "جاري تأمين الشحنة 📦",
];

type ChatMsg = { id: number; from: "me" | "them"; text: string };
const INITIAL_CHAT: ChatMsg[] = [
  { id: 1, from: "them", text: "السلام عليكم يا كابتن 👋" },
  { id: 2, from: "me", text: "وعليكم السلام يا فندم، جاهز لاستلام طلبك 🚀" },
  { id: 3, from: "them", text: "تمام، الشقة في الدور التالت بالعمارة الحمرا" },
];

const WEEK_DAYS = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
// indexed by JS Date.getDay() (0 = Sunday … 6 = Saturday)
const WEEK_DAYS_BY_GETDAY = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];


type Trip = { id: string; title: string; end: string; pay: "cash" | "wallet"; amount: number; zone: string; dist: string };
const TRIP_FEED: Trip[] = [
  { id: "t1", title: "طلب مطاعم #٤٥٢١", end: "٢٣:٥٤", pay: "cash", amount: 85, zone: "التجمع الخامس", dist: "٤.٢ كم" },
  { id: "t2", title: "طلب سوبر ماركت #٤٥١٠", end: "٢٢:١٧", pay: "wallet", amount: 60, zone: "وسط البلد", dist: "٢.٨ كم" },
  { id: "t3", title: "طلب صيدلية #٤٤٩٨", end: "٢٠:٤٠", pay: "cash", amount: 45, zone: "المعادي", dist: "٣.١ كم" },
  { id: "t4", title: "طلب مطاعم #٤٤٧٢", end: "١٩:٠٥", pay: "wallet", amount: 95, zone: "الزمالك", dist: "٥.٦ كم" },
];

const INBOX_MSGS = [
  { id: "i1", title: "🎉 مكافأة الأداء الأسبوعية", body: "مبروك يا بطل! حققت ٩٦٪ معدل قبول، استلم بونص إضافي ٥٠ جنيه.", time: "اليوم ١٠:٠٠" },
  { id: "i2", title: "📢 تحديث مناطق الذروة", body: "زون التجمع الخامس عليه طلب عالي النهاردة من الساعة ٦ مساءً.", time: "أمس ١٧:٣٠" },
  { id: "i3", title: "🛡️ تذكير السلامة", body: "البس الخوذة دايمًا والتزم بالسرعات المقررة، سلامتك أهم من أي طلب.", time: "الإثنين" },
];

const HELP_CATEGORIES = [
  { id: "sos", icon: "🆘", title: "إسعاف وطوارئ الطريق", desc: "حوادث أو إصابات أثناء العمل" },
  { id: "tech", icon: "⚙️", title: "مشاكل تقنية في التطبيق", desc: "التطبيق بيهنّج أو GPS مش شغال" },
  { id: "general", icon: "🧾", title: "شكاوى واستفسارات عامة", desc: "أي سؤال عن الطلبات أو الحساب" },
];

export function CaptainApp({ lockedFleet }: { lockedFleet?: CaptainFleet } = {}) {
  const actorId = lockedFleet ?? "captain";
  const { wallet, live: walletLive, settle: settleWallet } = useCaptainWallet(actorId);
  const voice = useEgyptianVoice();
  const [mapView, setMapView] = useState<"satellite" | "street">("satellite");
  const [online, setOnline] = useState(false);
  const [recenterNonce, setRecenterNonce] = useState(0);
  const [sheetTab, setSheetTab] = useState<"shift" | "trip" | "wallet" | "safety">("shift");

  // Egyptian voice welcome once
  const welcomedRef = useRef(false);
  useEffect(() => {
    if (welcomedRef.current) return;
    welcomedRef.current = true;
    voice.speak("welcome");
  }, [voice]);

  /* shift lifecycle — start requires a selfie; end is auto by booked time (no manual end button) */
  const [shiftStarted, setShiftStarted] = useState(false);
  const [shiftEndsAt, setShiftEndsAt] = useState<number | null>(null);
  const [selfieOpen, setSelfieOpen] = useState(false);
  const shiftEndsLabel = shiftEndsAt
    ? new Date(shiftEndsAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
    : null;
  // Auto-close the shift when the booked window ends
  useEffect(() => {
    if (!shiftStarted || !shiftEndsAt) return;
    const remain = shiftEndsAt - Date.now();
    if (remain <= 0) { setShiftStarted(false); setShiftEndsAt(null); setOnline(false); return; }
    const id = window.setTimeout(() => { setShiftStarted(false); setShiftEndsAt(null); setOnline(false); }, remain);
    return () => window.clearTimeout(id);
  }, [shiftStarted, shiftEndsAt]);


  /* navigation / routing */
  const [routeKind, setRouteKind] = useState<RouteKind>("fast");
  const [speed, setSpeed] = useState(0);
  const [camCount, setCamCount] = useState(0);
  const [eta, setEta] = useState<{ km: number; min: number }>({ km: 0, min: 0 });
  const onSpeed = useCallback((v: number) => setSpeed(v), []);
  const onCameras = useCallback((v: number) => setCamCount(v), []);
  const onEta = useCallback((v: { km: number; min: number }) => setEta(v), []);

  const [drawerOpen, setDrawerOpen] = useState(false);

  /* draggable bottom sheet */
  const [sheetOpen, setSheetOpen] = useState(true);
  const sheetDragStart = useRef<number | null>(null);
  const sheetDragged = useRef(false);

  /* chat */
  const [chatOpen, setChatOpen] = useState(false);
  const [chat, setChat] = useState<ChatMsg[]>(INITIAL_CHAT);
  const [draft, setDraft] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pushMsg = useCallback((text: string) => {
    if (!text.trim()) return;
    setChat((c) => [...c, { id: Date.now(), from: "me", text: text.trim() }]);
    setDraft("");
  }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat, chatOpen]);

  /* incoming request */
  const [incoming, setIncoming] = useState(true);
  const [reqLeft, setReqLeft] = useState(30);
  useEffect(() => {
    if (!incoming) return;
    setReqLeft(30);
    const id = setInterval(() => setReqLeft((s) => (s <= 1 ? (clearInterval(id), 0) : s - 1)), 1000);
    return () => clearInterval(id);
  }, [incoming]);
  const reqPct = (reqLeft / 30) * 100;

  /* active trip readiness clock */
  const [accepted, setAccepted] = useState(false);
  const [readyLeft, setReadyLeft] = useState(300);
  useEffect(() => {
    if (!accepted) return;
    const id = setInterval(() => setReadyLeft((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(id);
  }, [accepted]);
  const mm = String(Math.floor(readyLeft / 60));
  const ss = String(readyLeft % 60).padStart(2, "0");

  /* anti-fraud */
  const [doorDelivery, setDoorDelivery] = useState(false);
  const [doorNotice, setDoorNotice] = useState(false);
  const [photoTaken, setPhotoTaken] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [code, setCode] = useState("");
  const completeReady = photoTaken && code.length === 4;

  /* SOS long-press */
  const [sosProgress, setSosProgress] = useState(0);
  const [sosFired, setSosFired] = useState(false);
  const sosTimer = useRef<number | null>(null);
  const sosStart = () => {
    setSosFired(false);
    const started = Date.now();
    sosTimer.current = window.setInterval(() => {
      const p = Math.min(100, ((Date.now() - started) / 3000) * 100);
      setSosProgress(p);
      if (p >= 100) { sosEnd(true); }
    }, 30);
  };
  const sosEnd = (fire = false) => {
    if (sosTimer.current) { clearInterval(sosTimer.current); sosTimer.current = null; }
    if (fire) { setSosFired(true); voice.speak("sos"); }
    setSosProgress(0);
  };

  // Voice cues on incoming order
  useEffect(() => { if (incoming) voice.speak("newOrder"); }, [incoming, voice]);

  const balance = wallet.balance;
  /* show floating shortcuts ONLY when an order is active/accepted */
  const showShortcuts = incoming || accepted;

  const SHEET_TABS: { id: typeof sheetTab; label: string; icon: React.ReactNode }[] = [
    { id: "shift", label: "الوردية", icon: <Briefcase className="w-3.5 h-3.5" /> },
    { id: "trip", label: "الطلب", icon: <Package className="w-3.5 h-3.5" /> },
    { id: "wallet", label: "المحفظة", icon: <Wallet className="w-3.5 h-3.5" /> },
    { id: "safety", label: "الأمان", icon: <ShieldAlert className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="fixed inset-0 z-40 bg-black overflow-hidden" dir="rtl" style={{ fontFamily: "inherit" }}>

      {/* ===== MAP BACKGROUND (fullscreen, empty) ===== */}
      <div className="absolute inset-0">
        <CaptainPremiumMap view={mapView} routeKind={routeKind} recenterNonce={recenterNonce}
          onSpeed={onSpeed} onCameras={onCameras} onEta={onEta} />
      </div>
      <div className="absolute inset-0 pointer-events-none z-[400]"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 18%, transparent 55%, rgba(0,0,0,0.65) 100%)" }} />

      {/* ===== MINIMAL TOP ROW: menu + help only ===== */}
      <div className="absolute top-3 inset-x-3 z-[600] flex items-center gap-2">
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetTrigger asChild>
            <button aria-label="القائمة" className="w-11 h-11 shrink-0 rounded-2xl bg-black/60 backdrop-blur-xl ring-1 ring-amber-400/30 grid place-items-center text-amber-300 active:scale-95 transition">
              <Menu className="w-5 h-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="p-0 w-[90vw] sm:w-[420px] border-l border-amber-500/20 bg-neutral-950 text-neutral-100 overflow-hidden [&>button]:hidden" dir="rtl">
            <DrawerBody onClose={() => setDrawerOpen(false)} wallet={wallet} settle={settleWallet} live={walletLive} fleet={actorId} voiceEnabled={voice.enabled} onToggleVoice={voice.toggle} />
          </SheetContent>
        </Sheet>
        <div className="flex-1" />
        <HelpButton />
      </div>

      {/* ===== FLOATING MAP CONTROLS (bottom-right, above sheet) ===== */}
      <div className="absolute z-[550] right-3 flex flex-col gap-2 transition-all duration-300" style={{ bottom: sheetOpen ? "20rem" : "9rem" }}>
        <button onClick={() => setRecenterNonce((n) => n + 1)} aria-label="توسيط موقعي"
          className="w-11 h-11 rounded-2xl bg-black/70 backdrop-blur-xl ring-1 ring-amber-400/40 grid place-items-center text-amber-300 active:scale-95 shadow-xl">
          <LocateFixed className="w-5 h-5" />
        </button>
        <button onClick={() => setMapView((v) => v === "satellite" ? "street" : "satellite")} aria-label="تبديل الخريطة"
          className="w-11 h-11 rounded-2xl bg-black/70 backdrop-blur-xl ring-1 ring-amber-400/40 grid place-items-center text-amber-300 active:scale-95 shadow-xl">
          {mapView === "satellite" ? <MapIcon className="w-5 h-5" /> : <Satellite className="w-5 h-5" />}
        </button>
      </div>

      {/* ===== INCOMING REQUEST CARD ===== */}
      {incoming && !accepted && (
        <div className="absolute z-[620] inset-x-4 top-1/2 -translate-y-1/2 animate-scale-in">
          <div className="relative rounded-3xl p-5 text-amber-50 shadow-2xl ring-1 ring-amber-400/40 overflow-hidden"
            style={{ background: "radial-gradient(120% 140% at 0% 0%, #3a2d10 0%, #1a1408 55%, #0c0a05 100%)" }}>
            <div className="absolute top-4 left-4 w-12 h-12">
              <svg viewBox="0 0 44 44" className="w-12 h-12 -rotate-90">
                <circle cx="22" cy="22" r="19" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="4" />
                <circle cx="22" cy="22" r="19" fill="none" strokeWidth="4" strokeLinecap="round"
                  stroke={reqLeft > 10 ? "#34d399" : "#fbbf24"}
                  strokeDasharray={2 * Math.PI * 19}
                  strokeDashoffset={(2 * Math.PI * 19) * (1 - reqPct / 100)}
                  style={{ transition: "stroke-dashoffset 1s linear, stroke 0.4s" }} />
              </svg>
              <div className="absolute inset-0 grid place-items-center text-sm font-black text-white">{toAr(reqLeft)}</div>
            </div>

            <div className="text-center mt-1">
              <div className="text-[11px] text-amber-300/80 font-bold">طلب جديد قُرب منك</div>
              <div className="text-4xl font-black text-amber-300 mt-1 tracking-tight">85 <span className="text-xl">EGP</span></div>
              <div className="text-sm text-amber-100/80 mt-1">المسافة ٤.٢ كم · توصيل سريع</div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button onClick={() => { setIncoming(false); }}
                className="py-3 rounded-2xl bg-white/5 ring-1 ring-white/15 text-amber-100/80 font-bold text-sm active:scale-95 transition">
                بعدين ❌
              </button>
              <button onClick={() => { setAccepted(true); setIncoming(false); setReadyLeft(300); setSheetTab("trip"); setSheetOpen(true); voice.speak("accepted"); }}
                className="py-3 rounded-2xl bg-gradient-to-l from-emerald-500 to-emerald-600 text-white font-black text-sm shadow-lg active:scale-95 transition">
                يا مسهل ✅
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== BOTTOM SHEET WITH TABS ===== */}
      <div className="absolute z-[540] inset-x-0 bottom-0 p-3">
        <div className="rounded-3xl bg-black/75 backdrop-blur-2xl ring-1 ring-amber-400/25 shadow-2xl overflow-hidden">
          {/* grab handle */}
          <div
            role="button"
            aria-label={sheetOpen ? "إخفاء التفاصيل" : "عرض التفاصيل"}
            onClick={() => sheetDragged.current ? (sheetDragged.current = false) : setSheetOpen((o) => !o)}
            onPointerDown={(e) => { sheetDragStart.current = e.clientY; sheetDragged.current = false; }}
            onPointerMove={(e) => {
              if (sheetDragStart.current == null) return;
              const dy = e.clientY - sheetDragStart.current;
              if (Math.abs(dy) > 24) {
                sheetDragged.current = true;
                setSheetOpen(dy < 0);
                sheetDragStart.current = null;
              }
            }}
            onPointerUp={() => { sheetDragStart.current = null; }}
            className="pt-2.5 pb-1.5 flex flex-col items-center cursor-grab active:cursor-grabbing select-none touch-none"
          >
            <span className="w-11 h-1.5 rounded-full bg-white/30" />
          </div>

          <div className="px-3.5 pb-4">
            {/* status row + captain chip — always visible */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 grid place-items-center text-black text-[11px] font-black">A</div>
                <div className="min-w-0 leading-tight">
                  <div className={cn("text-[12px] font-bold flex items-center gap-1.5", online ? "text-emerald-300" : "text-neutral-400")}>
                    <span className={cn("w-2 h-2 rounded-full", online ? "bg-emerald-400 animate-pulse" : "bg-neutral-500")} />
                    {online ? "مستعد لتلقي الطلبات" : "غير متصل"}
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-0.5 flex items-center gap-1.5">
                    <Gauge className="w-3 h-3" /> {toAr(speed)} كم/س · ETA {toAr(eta.min)}د
                  </div>
                </div>
              </div>
              {shiftStarted && shiftEndsLabel && (
                <div className="h-9 px-3 rounded-xl bg-emerald-500/15 ring-1 ring-emerald-400/30 text-emerald-200 text-[11px] font-bold flex items-center gap-1.5 shrink-0">
                  <Clock className="w-3.5 h-3.5" /> تنتهي {toAr(shiftEndsLabel)}
                </div>
              )}
            </div>

            {/* tabs bar */}
            <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-white/[0.04] ring-1 ring-white/10 mb-3">
              {SHEET_TABS.map((tt) => (
                <button key={tt.id} onClick={() => { setSheetTab(tt.id); setSheetOpen(true); }}
                  className={cn("py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition",
                    sheetTab === tt.id ? "bg-gradient-to-l from-amber-500 to-amber-600 text-black shadow" : "text-neutral-300")}>
                  {tt.icon}{tt.label}
                </button>
              ))}
            </div>

            {/* tab content (collapsible) */}
            <div className={cn("space-y-3 overflow-hidden transition-all duration-300", sheetOpen ? "max-h-[60vh] opacity-100" : "max-h-0 opacity-0")}>

              {/* --- SHIFT TAB --- */}
              {sheetTab === "shift" && (
                <>
                  {!shiftStarted ? (
                    <button onClick={() => setSelfieOpen(true)}
                      className="w-full py-3 rounded-2xl bg-gradient-to-l from-amber-400 to-amber-600 text-black font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]">
                      <Camera className="w-4 h-4" /> ابدأ الوردية (سيلفي مطلوب)
                    </button>
                  ) : (
                    <div className="rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-400/30 px-3 py-2.5 text-[12px] text-emerald-200 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      الوردية شغّالة — تنتهي تلقائياً {shiftEndsLabel && `الساعة ${toAr(shiftEndsLabel)}`}
                    </div>
                  )}
                  <div className="rounded-2xl bg-white/[0.04] ring-1 ring-white/10 p-3 text-[11.5px] text-neutral-300 leading-relaxed">
                    ⏱️ ٣.٥ س من القيادة اليوم · التغيير من داخل «الجدول» في القائمة الجانبية.
                  </div>
                </>
              )}

              {/* --- TRIP TAB --- */}
              {sheetTab === "trip" && (
                <>
                  {/* turn-by-turn compact */}
                  {online && (
                    <div className="px-3 py-2.5 rounded-2xl bg-sky-500/10 ring-1 ring-sky-400/30 text-white flex items-center gap-2.5">
                      <div className="w-9 h-9 shrink-0 rounded-xl bg-sky-500/20 ring-1 ring-sky-400/40 grid place-items-center text-sky-300">
                        <CornerUpLeft className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[12px] font-bold truncate">خُد يسار بعد ٣٠٠ م · شارع التسعين</div>
                        <div className="text-[10px] text-neutral-300 mt-0.5">{toAr(eta.min)} دقيقة · {toAr(eta.km)} كم</div>
                      </div>
                      {camCount > 0 && (
                        <div className="shrink-0 text-[10px] font-bold text-red-300 bg-red-600/20 ring-1 ring-red-500/40 rounded-lg px-2 py-1">📷 {toAr(camCount)}</div>
                      )}
                    </div>
                  )}

                  {/* route chooser */}
                  <div className="flex items-center gap-2">
                    <RoutePill active={routeKind === "fast"} onClick={() => setRouteKind("fast")} icon={<Zap className="w-3.5 h-3.5" />} label="الأقرب" tone="sky" />
                    <RoutePill active={routeKind === "safe"} onClick={() => setRouteKind("safe")} icon={<ShieldCheck className="w-3.5 h-3.5" />} label="الأأمن" tone="emerald" />
                    <RoutePill active={routeKind === "clean"} onClick={() => setRouteKind("clean")} icon={<Leaf className="w-3.5 h-3.5" />} label="الأنظف" tone="amber" />
                  </div>

                  {/* readiness clock */}
                  {accepted && (
                    <div className="rounded-2xl p-3 bg-emerald-500/10 ring-1 ring-emerald-400/30 text-white">
                      <div className="flex items-center gap-2 text-emerald-300 text-[12px] font-bold">
                        <Clock className="w-4 h-4" /> متبقي على جاهزية الطلب: {toAr(`${mm}:${ss}`)}
                      </div>
                      <div className="text-[10px] text-amber-200/80 mt-1">ارتاح واشرب شاي بروقان يا بطل</div>
                    </div>
                  )}

                  {/* action shortcuts */}
                  {showShortcuts && (
                    <div className="grid grid-cols-3 gap-2">
                      <button onClick={() => { window.location.href = "tel:+201000000000"; }}
                        className="py-2.5 rounded-xl bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 active:scale-95">
                        <Phone className="w-4 h-4" /> اتصال
                      </button>
                      <button onClick={() => window.open("https://www.google.com/maps/dir/?api=1&destination=30.0444,31.2357", "_blank")}
                        className="py-2.5 rounded-xl bg-sky-600 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 active:scale-95">
                        <Navigation className="w-4 h-4" /> ملاحة
                      </button>
                      <button onClick={() => setChatOpen(true)}
                        className="py-2.5 rounded-xl bg-amber-500 text-black text-[11px] font-bold flex items-center justify-center gap-1.5 active:scale-95">
                        <MessageCircle className="w-4 h-4" /> دردشة
                      </button>
                    </div>
                  )}

                  {/* verification controls when accepted */}
                  {accepted && (
                    <div className="rounded-2xl bg-white/[0.04] ring-1 ring-white/10 p-3 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12px] font-bold text-neutral-100">🚪 تسليم عند الباب</span>
                        <Switch checked={doorDelivery} onCheckedChange={(v) => { setDoorDelivery(v); setDoorNotice(v); }} />
                      </div>
                      {doorNotice && (
                        <div className="text-[10px] text-emerald-300 bg-emerald-500/10 rounded-lg px-2.5 py-1.5">
                          ✅ تم إخطار العميل + IVR
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setCameraOpen(true)}
                          className={cn("py-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition active:scale-95",
                            photoTaken ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40" : "bg-white/5 text-neutral-200 ring-1 ring-white/15")}>
                          {photoTaken ? <Check className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                          {photoTaken ? "تم التصوير" : "تصوير الشحنة"}
                        </button>
                        <input value={code}
                          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          inputMode="numeric" placeholder="🔢 رمز الأمان"
                          className="py-2.5 rounded-xl bg-white/5 ring-1 ring-white/15 text-center text-sm font-black tracking-[0.4em] text-amber-300 placeholder:text-[11px] placeholder:tracking-normal placeholder:text-neutral-400 placeholder:font-normal focus:outline-none focus:ring-amber-400/50" />
                      </div>
                      <button disabled={!completeReady}
                        onClick={() => { setAccepted(false); setPhotoTaken(false); setCode(""); setDoorDelivery(false); setDoorNotice(false); voice.speak("delivered"); }}
                        className={cn("w-full py-3 rounded-2xl font-black text-sm transition active:scale-95",
                          completeReady ? "bg-gradient-to-l from-emerald-500 to-emerald-600 text-white shadow-lg" : "bg-white/5 text-neutral-500 cursor-not-allowed")}>
                        {completeReady ? "إتمام التسليم بأمان ✅" : "أكمل التحقق"}
                      </button>
                    </div>
                  )}

                  {!accepted && !incoming && (
                    <div className="rounded-2xl border-2 border-dashed border-white/10 p-5 text-center text-[11.5px] text-neutral-400">
                      لا يوجد طلب نشط الآن — إحنا في انتظار الرزق يا بطل 🚀
                    </div>
                  )}
                </>
              )}

              {/* --- WALLET TAB --- */}
              {sheetTab === "wallet" && (
                <div className="rounded-2xl bg-gradient-to-l from-amber-500/15 to-emerald-500/15 ring-1 ring-amber-400/25 px-4 py-4 space-y-2">
                  <div className="text-[11px] text-amber-100/80 font-bold flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-amber-300" /> رصيدك الصافي
                  </div>
                  <div className="text-3xl font-black text-white">{toAr(balance)} <span className="text-base text-amber-300">EGP</span></div>
                  <div className="text-[11px] text-emerald-200/80">💵 كاش باليد: {toAr(wallet.cashInHand)} · حد التسليم: {toAr(wallet.creditLimit || 150)}</div>
                  <button onClick={() => { setDrawerOpen(true); }}
                    className="w-full mt-2 py-2.5 rounded-xl bg-white/5 ring-1 ring-white/15 text-[12px] font-bold text-neutral-100 active:scale-95">
                    فتح تفاصيل المحفظة الكاملة
                  </button>
                </div>
              )}

              {/* --- SAFETY TAB --- */}
              {sheetTab === "safety" && (
                <>
                  <button
                    onMouseDown={sosStart} onMouseUp={() => sosEnd()} onMouseLeave={() => sosEnd()}
                    onTouchStart={sosStart} onTouchEnd={() => sosEnd()}
                    className="relative w-full py-4 rounded-2xl bg-red-600/90 text-white font-black text-sm overflow-hidden active:scale-[0.99] transition select-none"
                  >
                    <span className="absolute inset-y-0 right-0 bg-red-800/70" style={{ width: `${sosProgress}%`, transition: "width 30ms linear" }} />
                    <span className="relative flex items-center justify-center gap-2">
                      <ShieldAlert className="w-4 h-4" />
                      {sosFired ? "🆘 تم إرسال نداء الطوارئ!" : sosProgress > 0 ? `استمر بالضغط… ${toAr(Math.ceil(3 - (sosProgress / 100) * 3))}` : "🆘 طوارئ (اضغط مطولاً ٣ ثوانٍ)"}
                    </span>
                  </button>
                  <div className="rounded-2xl bg-white/[0.04] ring-1 ring-white/10 p-3 text-[11px] text-neutral-300 leading-relaxed">
                    عند الضغط ٣ ثوانٍ سيتم إرسال موقعك للطوارئ + المدير المناوب + مركز الأمان بالمنطقة.
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>



      {/* ===== CHAT PANEL ===== */}
      {chatOpen && (
        <>
          <div className="absolute inset-0 z-[680] bg-black/40 animate-fade-in" onClick={() => setChatOpen(false)} />
          <div className="absolute z-[700] inset-x-0 bottom-0" style={{ animation: "slide-up 0.3s ease-out" }}>
            <div className="rounded-t-3xl bg-neutral-950/95 backdrop-blur-2xl ring-1 ring-amber-400/25 flex flex-col" style={{ height: "70%" }}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 grid place-items-center text-white font-bold">ع</div>
                  <div className="leading-tight">
                    <div className="text-sm font-bold text-white">العميل · طلب #١٢٤٥</div>
                    <div className="text-[10px] text-emerald-400">متصل الآن</div>
                  </div>
                </div>
                <button onClick={() => setChatOpen(false)} className="w-9 h-9 rounded-full bg-white/5 grid place-items-center text-neutral-300">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
                {chat.map((m) => (
                  <div key={m.id} className={cn("flex", m.from === "me" ? "justify-start" : "justify-end")}>
                    <div className={cn("max-w-[78%] px-3.5 py-2 rounded-2xl text-[13px] leading-relaxed",
                      m.from === "me"
                        ? "bg-gradient-to-l from-amber-500 to-amber-600 text-black rounded-bl-md"
                        : "bg-white/10 text-neutral-100 rounded-br-md")}>
                      {m.text}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="px-3 py-2 flex gap-2 overflow-x-auto border-t border-white/10">
                {QUICK_REPLIES.map((q) => (
                  <button key={q} onClick={() => pushMsg(q)}
                    className="shrink-0 px-3 py-1.5 rounded-full bg-amber-500/15 ring-1 ring-amber-400/30 text-amber-300 text-[11px] font-bold active:scale-95 transition">
                    {q}
                  </button>
                ))}
              </div>

              <div className="px-3 pb-4 pt-1 flex items-center gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && pushMsg(draft)}
                  placeholder="اكتب رسالة…"
                  className="flex-1 h-11 px-4 rounded-2xl bg-white/5 ring-1 ring-white/15 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-amber-400/50"
                />
                <button onClick={() => pushMsg(draft)} className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 grid place-items-center text-black active:scale-95 transition">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ===== LIVE CAMERA CAPTURE — package proof ===== */}
      {cameraOpen && (
        <CameraCapture
          onClose={() => setCameraOpen(false)}
          onCapture={() => { setPhotoTaken(true); setCameraOpen(false); }}
        />
      )}

      {/* ===== SHIFT START SELFIE (Face check-in) ===== */}
      {selfieOpen && (
        <CameraCapture
          facingMode="user"
          title="سيلفي بداية الوردية"
          buttonLabel="📸 التقط السيلفي وابدأ الوردية"
          frameHint="ضع وجهك داخل الإطار في إضاءة جيدة"
          onClose={() => setSelfieOpen(false)}
          onCapture={() => {
            setSelfieOpen(false);
            setShiftStarted(true);
            // Demo: shift lasts 8 hours from start (real value = booking.ends_at)
            setShiftEndsAt(Date.now() + 8 * 60 * 60 * 1000);
            setOnline(true);
            voice.speak("shiftStart");
          }}
        />
      )}

    </div>
  );
}

/* ---------- Live camera capture (HTML5 getUserMedia) ---------- */
function CameraCapture({ onClose, onCapture, facingMode = "environment", title = "تصوير الشحنة حماية", buttonLabel = "📸 التقاط صورة الشحنة", frameHint }: { onClose: () => void; onCapture: () => void; facingMode?: "user" | "environment"; title?: string; buttonLabel?: string; frameHint?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: false });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play().catch(() => {}); }
      } catch {
        if (!cancelled) setErr("تعذّر الوصول للكاميرا، تأكد من السماح بالإذن 📷");
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  return (
    <div className="absolute inset-0 z-[760] bg-black flex flex-col" dir="rtl">
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 text-white">
        <div className="text-[14px] font-black flex items-center gap-2"><Camera className="w-5 h-5 text-amber-300" /> {title}</div>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 grid place-items-center"><X className="w-5 h-5" /></button>
      </div>
      <div className="flex-1 relative grid place-items-center overflow-hidden">
        {err ? (
          <div className="text-center text-neutral-300 text-[13px] px-8 leading-relaxed">{err}</div>
        ) : (
          <>
            <video ref={videoRef} playsInline muted className={cn("absolute inset-0 w-full h-full object-cover", facingMode === "user" && "scale-x-[-1]")} />
            <div className={cn("absolute pointer-events-none ring-2 ring-amber-300/70", facingMode === "user" ? "inset-x-10 top-16 bottom-24 rounded-[50%]" : "inset-6 rounded-3xl")} />
            {frameHint && <div className="absolute bottom-3 inset-x-6 text-center text-[11px] font-bold text-amber-200 bg-black/60 rounded-lg py-1.5">{frameHint}</div>}
          </>
        )}
      </div>
      <div className="px-4 py-4 bg-black/80 flex items-center justify-center">
        <button onClick={onCapture} disabled={!!err}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-l from-amber-500 to-amber-600 text-black font-black text-sm active:scale-95 transition disabled:opacity-40">
          {buttonLabel}
        </button>

      </div>
    </div>
  );
}

/* ---------- FAB ---------- */
function Fab({ children, label, onClick, className }: { children: React.ReactNode; label: string; onClick: () => void; className?: string }) {
  return (
    <button onClick={onClick} aria-label={label}
      className={cn("w-12 h-12 rounded-full shadow-xl ring-1 ring-white/20 grid place-items-center text-white active:scale-90 transition", className)}>
      {children}
    </button>
  );
}

/* ---------- Route chooser pill ---------- */
function RoutePill({ active, onClick, icon, label, tone }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; tone: "sky" | "emerald" | "amber" }) {
  const toneRing = tone === "sky" ? "ring-sky-400/50 text-sky-300" : tone === "emerald" ? "ring-emerald-400/50 text-emerald-300" : "ring-amber-400/50 text-amber-300";
  const toneActive = tone === "sky" ? "bg-sky-500/25 ring-sky-400/70 text-sky-200" : tone === "emerald" ? "bg-emerald-500/25 ring-emerald-400/70 text-emerald-200" : "bg-amber-500/25 ring-amber-400/70 text-amber-200";
  return (
    <button onClick={onClick}
      className={cn("flex-1 h-9 rounded-xl backdrop-blur-xl ring-1 flex items-center justify-center gap-1.5 text-[11px] font-bold active:scale-95 transition",
        active ? toneActive : cn("bg-black/55", toneRing))}>
      {icon} {label}
    </button>
  );
}


/* ================= HELP CENTER ================= */
function HelpButton() {
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState<string | null>(null);
  return (
    <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) setCat(null); }}>
      <SheetTrigger asChild>
        <button aria-label="مركز المساعدة" className="h-11 w-11 shrink-0 rounded-2xl bg-black/55 backdrop-blur-xl ring-1 ring-amber-400/30 grid place-items-center text-amber-300 active:scale-95 transition">
          <Headphones className="w-5 h-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="p-0 h-[80vh] rounded-t-3xl border-t border-amber-500/20 bg-neutral-950 text-neutral-100 overflow-hidden [&>button]:hidden" dir="rtl">
        {cat ? (
          <HelpChat category={HELP_CATEGORIES.find((c) => c.id === cat)!} onBack={() => setCat(null)} />
        ) : (
          <div className="flex flex-col h-full">
            <div className="p-5 bg-gradient-to-l from-amber-500 to-amber-600 text-black">
              <div className="text-lg font-black flex items-center gap-2"><Headphones className="w-5 h-5" /> مركز المساعدة</div>
              <div className="text-[12px] font-bold opacity-80 mt-0.5">إحنا معاك ٢٤ ساعة يا بطل، اختار نوع المساعدة</div>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto">
              {HELP_CATEGORIES.map((c) => (
                <button key={c.id} onClick={() => setCat(c.id)}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white/[0.04] ring-1 ring-white/10 active:scale-[0.99] transition text-right">
                  <span className="text-2xl">{c.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-bold text-white">{c.title}</div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">{c.desc}</div>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-amber-300 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function HelpChat({ category, onBack }: { category: { icon: string; title: string }; onBack: () => void }) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    { id: 1, from: "them", text: `أهلاً كابتن 👋 معاك دعم RAVA في قسم "${category.title}"، احكيلي المشكلة وأنا تحت أمرك.` },
  ]);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);
  const send = (text: string) => {
    if (!text.trim()) return;
    setMsgs((m) => [...m, { id: Date.now(), from: "me", text: text.trim() }]);
    setDraft("");
    setTimeout(() => setMsgs((m) => [...m, { id: Date.now() + 1, from: "them", text: "تمام يا بطل، استلمنا طلبك وهنتواصل معاك حالًا ✅" }]), 900);
  };
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-l from-amber-500 to-amber-600 text-black">
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-black/15 grid place-items-center"><ArrowRight className="w-5 h-5" /></button>
        <span className="text-xl">{category.icon}</span>
        <div className="text-[14px] font-black">{category.title}</div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
        {msgs.map((m) => (
          <div key={m.id} className={cn("flex", m.from === "me" ? "justify-start" : "justify-end")}>
            <div className={cn("max-w-[78%] px-3.5 py-2 rounded-2xl text-[13px] leading-relaxed",
              m.from === "me" ? "bg-gradient-to-l from-amber-500 to-amber-600 text-black rounded-bl-md" : "bg-white/10 text-neutral-100 rounded-br-md")}>
              {m.text}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="px-3 py-2 flex gap-2 overflow-x-auto border-t border-white/10">
        <button onClick={() => send("📷 رفع صورة المشكلة")} className="shrink-0 px-3 py-1.5 rounded-full bg-amber-500/15 ring-1 ring-amber-400/30 text-amber-300 text-[11px] font-bold">📷 إرفاق صورة</button>
        <button onClick={() => send("محتاج مساعدة عاجلة 🆘")} className="shrink-0 px-3 py-1.5 rounded-full bg-amber-500/15 ring-1 ring-amber-400/30 text-amber-300 text-[11px] font-bold">🆘 عاجل</button>
      </div>
      <div className="px-3 pb-4 pt-1 flex items-center gap-2">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send(draft)}
          placeholder="اكتب مشكلتك…" className="flex-1 h-11 px-4 rounded-2xl bg-white/5 ring-1 ring-white/15 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-amber-400/50" />
        <button onClick={() => send(draft)} className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 grid place-items-center text-black active:scale-95 transition">
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

/* ================= DRAWER ================= */
type DrawerView = "menu" | "inbox" | "schedule" | "wallet" | "history" | "profile";

function DrawerBody({ onClose, wallet, settle, live, fleet, voiceEnabled, onToggleVoice }: { onClose: () => void; wallet: CaptainWallet; settle: () => void | Promise<void>; live: boolean; fleet: CaptainFleet; voiceEnabled?: boolean; onToggleVoice?: () => void }) {
  const [view, setView] = useState<DrawerView>("menu");

  const QUICK = [
    { id: "inbox" as const, icon: <Inbox className="w-6 h-6" />, title: "علبة الوارد", tone: "from-sky-500/20 text-sky-300 ring-sky-500/30" },
    { id: "schedule" as const, icon: <CalendarDays className="w-6 h-6" />, title: "الجدول", tone: "from-amber-500/20 text-amber-300 ring-amber-500/30" },
    { id: "wallet" as const, icon: <Wallet className="w-6 h-6" />, title: "المحفظة", tone: "from-emerald-500/20 text-emerald-300 ring-emerald-500/30" },
    { id: "history" as const, icon: <ScrollText className="w-6 h-6" />, title: "سجل الطلبات", tone: "from-violet-500/20 text-violet-300 ring-violet-500/30" },
  ];

  const SETTINGS_ROWS: { icon: string; title: string; badge?: string; danger?: boolean; action: () => void }[] = [
    { icon: "🧍", title: "الملف الشخصي", action: () => setView("profile") },
    { icon: "🏷️", title: "العروض والخصومات", action: () => {} },
    { icon: "🛡️", title: "سلامة المندوبين", badge: "جديد", action: () => {} },
    ...(onToggleVoice ? [{ icon: voiceEnabled ? "🔊" : "🔈", title: voiceEnabled ? "الصوت المصري: مُفعّل" : "الصوت المصري: مغلق", badge: voiceEnabled ? "ON" : "OFF", action: onToggleVoice }] : []),
    { icon: "⚙️", title: "الإعدادات", action: () => {} },
  ];

  if (view !== "menu") {
    const titles: Record<DrawerView, string> = {
      menu: "", inbox: "علبة الوارد", schedule: "الجدول", wallet: "المحفظة", history: "سجل الطلبات", profile: "الملف الشخصي",
    };
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 px-4 py-3.5 bg-gradient-to-l from-orange-500 to-orange-600 text-white shrink-0">
          <button onClick={() => setView("menu")} className="w-9 h-9 rounded-full bg-black/15 grid place-items-center active:scale-95"><ArrowRight className="w-5 h-5" /></button>
          <div className="text-[15px] font-black">{titles[view]}</div>
          <button onClick={onClose} className="ms-auto w-9 h-9 rounded-full bg-black/15 grid place-items-center active:scale-95"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {view === "inbox" && <InboxView />}
          {view === "schedule" && <ScheduleView fleet={fleet} />}
          {view === "wallet" && <WalletView wallet={wallet} settle={settle} live={live} />}
          {view === "history" && <HistoryView />}
          {view === "profile" && <ProfileView />}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* orange header */}
      <div className="p-5 bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 text-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-white/95 text-orange-600 grid place-items-center font-black text-xl ring-2 ring-white/40 shrink-0">A</div>
          <div className="min-w-0 leading-tight">
            <div className="text-[15px] font-black truncate">{CAPTAIN_NAME}</div>
            <div className="text-[12px] font-bold flex items-center gap-1.5 mt-0.5">
              <span className="px-1.5 py-0.5 rounded bg-black/20 flex items-center gap-1"><Bike className="w-3 h-3" /> MOTO</span>
              <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-white" /> ٤.٩</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* 4-box grid */}
        <div className="grid grid-cols-2 gap-3">
          {QUICK.map((q) => (
            <button key={q.id} onClick={() => setView(q.id)}
              className={cn("aspect-square rounded-2xl bg-gradient-to-br ring-1 flex flex-col items-center justify-center gap-2.5 active:scale-95 transition", q.tone)}>
              {q.icon}
              <span className="text-[13px] font-bold text-white">{q.title}</span>
            </button>
          ))}
        </div>

        {/* settings list */}
        <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/10 divide-y divide-white/5 overflow-hidden">
          {SETTINGS_ROWS.map((r) => (
            <button key={r.title} onClick={r.action}
              className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-white/5 transition text-right">
              <span className="text-lg w-6 text-center">{r.icon}</span>
              <span className="flex-1 text-[13px] font-bold text-neutral-100">{r.title}</span>
              {r.badge && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">{r.badge}</span>}
              <ChevronLeft className="w-4 h-4 text-neutral-500" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Inbox ---------- */
function InboxView() {
  return (
    <div className="p-4 space-y-3">
      {INBOX_MSGS.map((m) => (
        <div key={m.id} className="rounded-2xl bg-white/[0.04] ring-1 ring-white/10 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[13px] font-black text-amber-300">{m.title}</div>
            <div className="text-[10px] text-neutral-500 shrink-0">{m.time}</div>
          </div>
          <div className="text-[12px] text-neutral-300 mt-1.5 leading-relaxed">{m.body}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Date strip ---------- */
function DateStrip({ active, onPick }: { active?: number; onPick?: (i: number) => void } = {}) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
  const current = active ?? 0;
  return (
    <div dir="rtl" className="flex flex-nowrap gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ WebkitOverflowScrolling: "touch" }}>
      {days.map((d, i) => {
        const isActive = i === current;
        return (
          <button key={i} onClick={() => onPick?.(i)} type="button"
            className={cn("shrink-0 w-14 rounded-2xl py-2.5 text-center ring-1 transition active:scale-95",
              isActive ? "bg-gradient-to-b from-orange-500 to-orange-600 text-white ring-orange-400 shadow-lg" : "bg-white/[0.04] text-neutral-300 ring-white/10")}>
            <div className="text-[10px] font-bold opacity-80 whitespace-nowrap">{i === 0 ? "اليوم" : WEEK_DAYS_BY_GETDAY[d.getDay()]}</div>
            <div className="text-lg font-black mt-0.5">{toAr(d.getDate())}</div>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Schedule (Supabase-backed 4h slots) ---------- */
const CAIRO_TZ = "Africa/Cairo";
function fmtHM(iso: string) {
  const t = new Date(iso).toLocaleTimeString("en-GB", { timeZone: CAIRO_TZ, hour: "2-digit", minute: "2-digit", hour12: false });
  return toAr(t);
}
function slotDayIndex(iso: string, todayMid: number) {
  const d = new Date(iso);
  const dayStr = d.toLocaleDateString("en-CA", { timeZone: CAIRO_TZ });
  return Math.round((new Date(dayStr + "T00:00:00").getTime() - todayMid) / 86400000);
}
function toSlot(s: Shift) {
  return {
    id: s.id,
    dur: "4h 00m",
    time: `${fmtHM(s.starts_at)} - ${fmtHM(s.ends_at)}`,
    zone: s.center ?? "المركز الجغرافي الحالي",
    bonus: s.booked_count >= s.capacity ? "مكتمل ⛔" : `${toAr(s.capacity - s.booked_count)} مقعد متاح`,
    starts_at: s.starts_at,
    full: s.booked_count >= s.capacity,
  };
}

function ScheduleView({ fleet }: { fleet: CaptainFleet }) {
  const { available, mine, history, book, cancel, loading, error, userId, bookings } = useCaptainShifts({ fleet });
  const [tab, setTab] = useState<"available" | "mine" | "past">("available");
  const [dayOffset, setDayOffset] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const todayMid = new Date(new Date().toLocaleDateString("en-CA", { timeZone: CAIRO_TZ }) + "T00:00:00").getTime();

  const TABS = [
    { id: "available" as const, label: "الشفتات المتاحة" },
    { id: "mine" as const, label: "نوبات عملي" },
    { id: "past" as const, label: "السجل السابق" },
  ];

  const src = tab === "available" ? available : tab === "mine" ? mine : history;
  const filtered = src
    .filter((s) => tab === "past" || slotDayIndex(s.starts_at, todayMid) === dayOffset)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());

  const handleBook = async (id: string) => {
    setBusy(id);
    try { await book(id); } catch (e) { alert(e instanceof Error ? e.message : "تعذر الحجز"); } finally { setBusy(null); }
  };
  const handleCancel = async (shiftId: string) => {
    const b = bookings.find((x) => x.shift_id === shiftId && x.status === "booked");
    if (!b) return;
    setBusy(shiftId);
    try { await cancel(b.id); } catch (e) { alert(e instanceof Error ? e.message : "تعذر الإلغاء"); } finally { setBusy(null); }
  };

  return (
    <div className="p-4 space-y-4">
      <DateStrip active={dayOffset} onPick={setDayOffset} />
      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-white/[0.04] ring-1 ring-white/10">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn("py-2 rounded-xl text-[11.5px] font-bold transition",
              tab === t.id ? "bg-gradient-to-l from-orange-500 to-orange-600 text-white shadow" : "text-neutral-400")}>
            {t.label}
          </button>
        ))}
      </div>

      {error && <div className="text-[11px] text-red-300">{error}</div>}
      {!userId && tab !== "past" && (
        <div className="rounded-xl bg-amber-500/10 ring-1 ring-amber-500/30 p-3 text-[11px] font-bold text-amber-200 leading-relaxed">
          سجّل الدخول كي تتمكن من حجز الشفتات — المواعيد معروضة للاطلاع.
        </div>
      )}

      <div className="space-y-2.5">
        {loading && <div className="text-[11px] text-neutral-400">جارٍ تحميل الشفتات…</div>}
        {!loading && filtered.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-white/10 p-6 text-center text-[11.5px] text-neutral-400">
            {tab === "past" ? "لا يوجد سجل سابق بعد" : "لا توجد شفتات في هذا اليوم"}
          </div>
        )}
        {!loading && tab === "available" && filtered.map((s) => (
          <ShiftCard key={s.id} s={toSlot(s)} cta={busy === s.id ? "جارٍ الحجز…" : "حجز الشفت ✅"}
            disabled={busy === s.id || s.booked_count >= s.capacity} onCta={() => handleBook(s.id)} />
        ))}
        {!loading && tab === "mine" && filtered.map((s) => (
          <ShiftCard key={s.id} s={toSlot(s)} mine disabled={busy === s.id} onSwap={() => handleCancel(s.id)} swapLabel="إلغاء الحجز" />
        ))}
        {!loading && tab === "past" && filtered.slice(0, 20).map((s) => (
          <ShiftCard key={s.id} s={toSlot(s)} muted />
        ))}
      </div>
    </div>
  );
}

function ShiftCard({ s, mine, muted, cta, swapped, onSwap, onCta, disabled, swapLabel }: {
  s: { id: string; dur: string; time: string; zone: string; bonus: string };
  mine?: boolean; muted?: boolean; cta?: string; swapped?: boolean; onSwap?: () => void;
  onCta?: () => void; disabled?: boolean; swapLabel?: string;
}) {
  return (
    <div className={cn("rounded-2xl p-3.5 ring-1", muted ? "bg-white/[0.02] ring-white/5 opacity-70" : "bg-white/[0.04] ring-white/10")}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[13px] font-black text-white flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-amber-300">({s.dur})</span> {s.time}
          </div>
          <div className="text-[12px] text-neutral-300 mt-1 flex items-center gap-1.5">📍 {s.zone}</div>
        </div>
        {s.bonus ? <div className="text-[11px] font-bold text-emerald-300 shrink-0">{s.bonus}</div> : null}
      </div>
      {mine && (
        <button onClick={onSwap} disabled={disabled ?? swapped}
          className={cn("mt-3 w-full py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50",
            "bg-white/5 text-neutral-100 ring-1 ring-white/15")}>
          <Repeat className="w-4 h-4" /> {swapLabel ?? "🔄 عرض الشفت لزميل"}
        </button>
      )}
      {cta && (
        <button onClick={onCta} disabled={disabled}
          className="mt-3 w-full py-2.5 rounded-xl text-[12px] font-bold bg-gradient-to-l from-emerald-500 to-emerald-600 text-white active:scale-95 transition disabled:opacity-50">
          {cta}
        </button>
      )}
    </div>
  );
}

/* ---------- History ---------- */
function HistoryView() {
  const [openId, setOpenId] = useState<string | null>("t1");
  const SUMMARY = [
    { icon: "🏍️", label: "المسافة الإجمالية", value: "99.4 كم" },
    { icon: "🛍️", label: "عمليات التسليم الناجحة", value: "12 طلب" },
    { icon: "💵", label: "شقاك الصافي", value: "450 EGP" },
  ];
  return (
    <div className="p-4 space-y-4">
      <DateStrip />
      <div className="grid grid-cols-3 gap-2">
        {SUMMARY.map((m) => (
          <div key={m.label} className="rounded-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] ring-1 ring-white/10 p-3 text-center">
            <div className="text-xl">{m.icon}</div>
            <div className="text-[13px] font-black text-amber-300 mt-1">{m.value}</div>
            <div className="text-[9.5px] text-neutral-400 mt-0.5 leading-tight">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="space-y-2.5">
        {TRIP_FEED.map((t) => {
          const open = openId === t.id;
          return (
            <div key={t.id} className="rounded-2xl bg-white/[0.04] ring-1 ring-white/10 overflow-hidden">
              <button onClick={() => setOpenId(open ? null : t.id)} className="w-full flex items-center gap-3 p-3.5 text-right">
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-white truncate">{t.title}</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">انتهت في {t.end}</div>
                </div>
                <span className={cn("text-[10px] font-bold px-2 py-1 rounded-full shrink-0",
                  t.pay === "cash" ? "bg-emerald-500/15 text-emerald-300" : "bg-sky-500/15 text-sky-300")}>
                  {t.pay === "cash" ? "🟢 كاش في جيبك" : "🔵 محفظة رقمية"}
                </span>
                <ChevronDown className={cn("w-4 h-4 text-neutral-500 shrink-0 transition-transform", open && "rotate-180")} />
              </button>
              {open && (
                <div className="px-3.5 pb-3.5 pt-1 grid grid-cols-3 gap-2 text-center border-t border-white/5">
                  <div><div className="text-[11px] text-neutral-400">القيمة</div><div className="text-[13px] font-black text-amber-300">{t.amount} EGP</div></div>
                  <div><div className="text-[11px] text-neutral-400">المسافة</div><div className="text-[13px] font-bold text-white">{t.dist}</div></div>
                  <div><div className="text-[11px] text-neutral-400">المنطقة</div><div className="text-[12px] font-bold text-white">{t.zone}</div></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Wallet ---------- */
function WalletView({ wallet, settle, live }: { wallet: CaptainWallet; settle: () => void | Promise<void>; live: boolean }) {
  const [settled, setSettled] = useState(false);
  const cash = settled ? 0 : wallet.cashInHand;
  const LIMIT = wallet.creditLimit || 150;
  const pct = Math.min(100, (cash / LIMIT) * 100);
  const blocked = cash >= LIMIT - 20;
  const doSettle = () => { setSettled(true); void settle(); };
  return (
    <div className="p-4 space-y-4">
      {/* balance */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-600/30 to-amber-500/15 ring-1 ring-emerald-400/25 p-5 text-center">
        <div className="text-[12px] font-bold text-emerald-200 flex items-center justify-center gap-2">
          رصيدك الحالي بالمحفظة
          <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-black", live ? "bg-emerald-500/25 text-emerald-200" : "bg-neutral-500/25 text-neutral-300")}>
            {live ? "متصل مباشر" : "وضع العرض"}
          </span>
        </div>
        <div className="text-4xl font-black text-white mt-1">{toAr(wallet.balance)} <span className="text-lg text-amber-300">{wallet.currency}</span></div>
        <div className="text-[11px] text-neutral-300 mt-1">الله يباركلك فيه يا بطل 🤍</div>
      </div>


      {/* credit limit */}
      <div className="rounded-2xl bg-white/[0.04] ring-1 ring-white/10 p-4">
        <div className="flex items-center justify-between text-[12px] font-bold">
          <span className="text-neutral-200">💵 الكاش في جيبك</span>
          <span className={cn(blocked ? "text-rose-300" : "text-amber-300")}>{toAr(cash)} / {toAr(LIMIT)} EGP</span>
        </div>
        <div className="h-3 rounded-full bg-black/40 overflow-hidden ring-1 ring-white/10 mt-2">
          <div className={cn("h-full rounded-full transition-all duration-700", blocked ? "bg-gradient-to-l from-rose-500 to-rose-400" : "bg-gradient-to-l from-emerald-400 to-amber-400")}
            style={{ width: `${pct}%` }} />
        </div>
        <div className="text-[10px] text-neutral-500 mt-1.5 text-center">الحد الأقصى للمبالغ النقدية {toAr(LIMIT)} جنيه</div>
      </div>

      {blocked && (
        <div className="rounded-2xl p-4 space-y-3" style={{ background: "rgba(244,114,114,0.12)", border: "1px solid rgba(244,114,114,0.4)" }}>
          <div className="flex items-start gap-2 text-[12.5px] font-bold text-rose-200 leading-relaxed">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-300" />
            ⚠️ لقد وصلت إلى الحد الأقصى للمبالغ النقدية.. يرجى تسوية الحساب المالي
          </div>
          <button onClick={doSettle} className="w-full py-3 rounded-xl bg-rose-500 text-white font-bold text-[13px] flex items-center justify-center gap-2 active:scale-95 transition">
            <Smartphone className="w-4 h-4" /> 💸 سدد مديونيتك بـ فودافون كاش
          </button>
          <button onClick={doSettle} className="w-full py-3 rounded-xl bg-sky-500 text-white font-bold text-[13px] flex items-center justify-center gap-2 active:scale-95 transition">
            <CreditCard className="w-4 h-4" /> 🏦 سدد عبر إنستا باي الفوري
          </button>
        </div>
      )}

      {settled && (
        <div className="rounded-2xl p-4 bg-emerald-500/12 ring-1 ring-emerald-500/40 flex items-center gap-2 text-[12.5px] font-bold text-emerald-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-300" /> تم تسوية الحساب بنجاح، حسابك اتفك واشتغل تاني يا بطل ✅
        </div>
      )}
    </div>
  );
}

/* ---------- Profile ---------- */
function ProfileView() {
  return (
    <div className="p-4 space-y-4">
      <div className="rounded-3xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 ring-1 ring-orange-400/25 p-5 text-center">
        <div className="w-20 h-20 rounded-full mx-auto bg-gradient-to-br from-orange-500 to-amber-600 grid place-items-center text-white text-3xl font-black ring-4 ring-orange-400/20">A</div>
        <div className="text-[15px] font-black text-white mt-3 px-2 leading-tight">{CAPTAIN_NAME}</div>
        <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[12px] font-black">
          <Trophy className="w-3.5 h-3.5" /> 🥇 الفئة الأولى - ذهبي
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white/[0.04] ring-1 ring-white/10 p-4 text-center">
          <div className="text-2xl font-black text-emerald-300">96%</div>
          <div className="text-[11px] text-neutral-400 mt-1">معدل قبول الطلبات</div>
        </div>
        <div className="rounded-2xl bg-white/[0.04] ring-1 ring-white/10 p-4 text-center">
          <div className="text-2xl font-black text-amber-300 flex items-center justify-center gap-1"><Star className="w-5 h-5 fill-amber-300" /> ٤.٩</div>
          <div className="text-[11px] text-neutral-400 mt-1">تقييم العملاء</div>
        </div>
      </div>

      <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/10 divide-y divide-white/5 overflow-hidden">
        {[
          { icon: <User className="w-4 h-4" />, label: "بيانات الحساب" },
          { icon: <Tag className="w-4 h-4" />, label: "العروض والخصومات" },
          { icon: <ShieldCheck className="w-4 h-4" />, label: "وثائق ومستندات" },
          { icon: <Settings className="w-4 h-4" />, label: "الإعدادات" },
        ].map((r) => (
          <button key={r.label} className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-white/5 transition text-right">
            <span className="text-amber-300">{r.icon}</span>
            <span className="flex-1 text-[13px] font-bold text-neutral-100">{r.label}</span>
            <ChevronLeft className="w-4 h-4 text-neutral-500" />
          </button>
        ))}
      </div>
    </div>
  );
}
