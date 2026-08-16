import { useState } from "react";
import { MapPin, Loader2, Truck, AlertTriangle, Check } from "lucide-react";

/**
 * Phase 3 — Spare Parts "Breakdown Pin".
 * Customer taps "أنا متعطل هنا" → captures GPS → drops a map pin and
 * pre-fills a spare-parts errand routed exclusively to heavy/cargo vehicles
 * (Tricycle / Quarter-truck / Winch) regardless of cart weight.
 */
export function SparePartsBreakdownPin({
  onPinReady,
}: {
  onPinReady?: (pin: { lat: number; lng: number; vehicle: "tricycle" | "dababa" | "winsh" }) => void;
}) {
  const [status, setStatus] = useState<"idle" | "locating" | "ready" | "denied">("idle");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [vehicle, setVehicle] = useState<"tricycle" | "dababa" | "winsh">("dababa");

  const capture = () => {
    if (!navigator.geolocation) { setStatus("denied"); return; }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        setStatus("ready");
        onPinReady?.({ ...c, vehicle });
      },
      () => setStatus("denied"),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  return (
    <div className="p-3 rounded-xl border-2 border-amber-400/60 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/30 dark:to-card space-y-2.5">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600" />
        <div className="text-xs font-bold text-amber-900 dark:text-amber-200">سيارتي / معدتي متعطلة الآن</div>
      </div>
      <div className="text-[11px] text-muted-foreground">
        ثبّت موقعك الحالي على الخريطة، وسيتم توجيه طلب قطع الغيار بمركبة شحن مناسبة فقط.
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {([
          { id: "tricycle", label: "تروسيكل", hint: "خفيف" },
          { id: "dababa", label: "ربع نقل", hint: "متوسط" },
          { id: "winsh", label: "ونش", hint: "ثقيل" },
        ] as const).map((v) => (
          <button key={v.id} onClick={() => setVehicle(v.id)}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border-2 transition ${
              vehicle === v.id ? "border-amber-500 bg-amber-100 text-amber-900" : "border-amber-200 bg-white text-amber-700"
            }`}>
            <Truck className="w-3 h-3 inline -mt-0.5 me-1" />{v.label} · {v.hint}
          </button>
        ))}
      </div>

      {status === "idle" && (
        <button onClick={capture}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold flex items-center justify-center gap-1.5">
          <MapPin className="w-4 h-4" /> ثبّت موقعي الآن
        </button>
      )}
      {status === "locating" && (
        <div className="w-full py-2.5 rounded-xl bg-amber-100 text-amber-900 text-xs font-bold flex items-center justify-center gap-1.5">
          <Loader2 className="w-4 h-4 animate-spin" /> جاري تحديد موقعك...
        </div>
      )}
      {status === "ready" && coords && (
        <div className="space-y-1.5">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 text-[11px] text-emerald-800 dark:text-emerald-200 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" /> تم تثبيت دبوس العطل · {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </div>
          <button onClick={capture} className="w-full py-1.5 rounded-lg border border-amber-300 text-amber-700 text-[11px] font-bold">إعادة التثبيت</button>
        </div>
      )}
      {status === "denied" && (
        <div className="p-2 rounded-lg bg-red-50 border border-red-300 text-[11px] text-red-700">
          تعذر الوصول للموقع — فعّل صلاحية GPS من إعدادات الجهاز.
        </div>
      )}
    </div>
  );
}