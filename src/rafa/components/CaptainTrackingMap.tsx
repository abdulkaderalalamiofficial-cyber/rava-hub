import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Navigation2, Users, Wifi, WifiOff, Bike, Satellite, Moon, MapPin } from "lucide-react";
import { EGYPT_CENTERS } from "../data/egyptCenters";
import { TILES, type MapStyle } from "./mapTiles";

export type TrackedCaptain = {
  id: string;
  name: string;
  vehicle: string;
  plate: string;
  zone: string;
  governorate: string;
  online: boolean;
};

type LatLng = { lat: number; lng: number };

// Governorate centroids (lat,lng) — used to seed captain positions country-wide.
export const GOV_COORDS: Record<string, LatLng> = {
  "القاهرة": { lat: 30.06, lng: 31.25 },
  "الجيزة": { lat: 29.99, lng: 31.13 },
  "الإسكندرية": { lat: 31.2, lng: 29.92 },
  "القليوبية": { lat: 30.42, lng: 31.21 },
  "الغربية": { lat: 30.87, lng: 31.03 },
  "الدقهلية": { lat: 31.04, lng: 31.38 },
  "الشرقية": { lat: 30.59, lng: 31.5 },
  "المنوفية": { lat: 30.55, lng: 30.99 },
  "البحيرة": { lat: 30.85, lng: 30.35 },
  "كفر الشيخ": { lat: 31.1, lng: 30.94 },
  "دمياط": { lat: 31.42, lng: 31.81 },
  "بورسعيد": { lat: 31.26, lng: 32.28 },
  "الإسماعيلية": { lat: 30.6, lng: 32.27 },
  "السويس": { lat: 29.97, lng: 32.53 },
  "شمال سيناء": { lat: 31.13, lng: 33.8 },
  "جنوب سيناء": { lat: 28.98, lng: 34.1 },
  "الفيوم": { lat: 29.31, lng: 30.84 },
  "بني سويف": { lat: 29.07, lng: 31.1 },
  "المنيا": { lat: 28.1, lng: 30.75 },
  "أسيوط": { lat: 27.18, lng: 31.18 },
  "سوهاج": { lat: 26.56, lng: 31.7 },
  "قنا": { lat: 26.16, lng: 32.72 },
  "الأقصر": { lat: 25.69, lng: 32.64 },
  "أسوان": { lat: 24.09, lng: 32.9 },
  "البحر الأحمر": { lat: 26.0, lng: 34.0 },
  "الوادي الجديد": { lat: 25.44, lng: 30.55 },
  "مطروح": { lat: 31.35, lng: 27.24 },
};

// Map legacy English demo zones to a governorate so old data still shows.
const ZONE_TO_GOV: Record<string, string> = {
  Shubra: "القاهرة",
  Maadi: "القاهرة",
  Cairo: "القاهرة",
  Heliopolis: "القاهرة",
  Giza: "الجيزة",
  Alexandria: "الإسكندرية",
};

export function resolveGov(zone: string, governorate?: string): string {
  if (governorate && GOV_COORDS[governorate]) return governorate;
  if (GOV_COORDS[zone]) return zone;
  return ZONE_TO_GOV[zone] ?? "القاهرة";
}

// Stable pseudo-random jitter per captain id so markers spread inside a zone.
function seededJitter(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  const a = ((h % 1000) / 1000 - 0.5) * 0.18;
  const b = (((h >> 5) % 1000) / 1000 - 0.5) * 0.18;
  return { dLat: a, dLng: b };
}

function makeIcon(online: boolean) {
  const ring = online ? "var(--color-success)" : "var(--color-muted-foreground)";
  return L.divIcon({
    className: "rava-cap-track",
    html: `<div class="relative w-7 h-7">
      ${online ? `<span class="absolute inset-0 rounded-full animate-ping" style="background:${ring};opacity:.35"></span>` : ""}
      <span class="absolute inset-0.5 rounded-full bg-gradient-royal ring-2 shadow-elegant grid place-items-center text-[color:var(--color-gold)] text-[11px] font-bold" style="border-color:${ring}">★</span>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}
const onlineIcon = makeIcon(true);
const offlineIcon = makeIcon(false);

// Recenter/zoom based on active filter.
function ViewController({ target }: { target: { center: LatLng; zoom: number } }) {
  const map = useMap();
  useEffect(() => {
    map.setView([target.center.lat, target.center.lng], target.zoom, { animate: true });
  }, [target.center.lat, target.center.lng, target.zoom, map]);
  return null;
}

export function CaptainTrackingMap({
  captains,
  height = 420,
}: {
  captains: TrackedCaptain[];
  height?: number;
}) {
  const [mounted, setMounted] = useState(false);
  const [tick, setTick] = useState(0);
  const [style, setStyle] = useState<MapStyle>("satellite");
  const [gov, setGov] = useState<string>("");
  const [center, setCenter] = useState<string>("");
  const [status, setStatus] = useState<"all" | "online" | "offline">("all");
  const drift = useRef<Record<string, LatLng>>({});

  useEffect(() => setMounted(true), []);

  // Simulated live movement for online captains.
  useEffect(() => {
    if (!mounted) return;
    const iv = setInterval(() => {
      const d = drift.current;
      captains.forEach((c) => {
        if (!c.online) return;
        const cur = d[c.id] ?? { lat: 0, lng: 0 };
        d[c.id] = {
          lat: Math.max(-0.06, Math.min(0.06, cur.lat + (Math.random() - 0.5) * 0.012)),
          lng: Math.max(-0.06, Math.min(0.06, cur.lng + (Math.random() - 0.5) * 0.012)),
        };
      });
      setTick((t) => t + 1);
    }, 3000);
    return () => clearInterval(iv);
  }, [mounted, captains]);

  const positioned = useMemo(() => {
    return captains.map((c) => {
      const g = resolveGov(c.zone, c.governorate);
      const base = GOV_COORDS[g] ?? GOV_COORDS["القاهرة"];
      const j = seededJitter(c.id);
      const dr = drift.current[c.id] ?? { lat: 0, lng: 0 };
      return { ...c, gov: g, lat: base.lat + j.dLat + dr.lat, lng: base.lng + j.dLng + dr.lng };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captains, tick]);

  // Apply the live filter (governorate + center + status).
  const filtered = useMemo(() => {
    return positioned.filter((c) => {
      if (gov && c.gov !== gov) return false;
      if (center && c.zone !== center) return false;
      if (status === "online" && !c.online) return false;
      if (status === "offline" && c.online) return false;
      return true;
    });
  }, [positioned, gov, center, status]);

  const onlineCount = filtered.filter((c) => c.online).length;
  const govCount = new Set(filtered.map((c) => c.gov)).size;

  // Move/zoom the map to the active filter.
  const viewTarget = useMemo(() => {
    if (gov && GOV_COORDS[gov]) return { center: GOV_COORDS[gov], zoom: center ? 11 : 9 };
    return { center: { lat: 26.8, lng: 30.8 }, zoom: 6 };
  }, [gov, center]);

  const govOptions = Object.keys(GOV_COORDS);
  const centerOptions = gov ? EGYPT_CENTERS[gov] ?? [] : [];

  if (!mounted) {
    return <div style={{ height }} className="rounded-2xl bg-secondary/40 border border-gold/30 animate-pulse" />;
  }

  const tile = TILES[style];

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={gov}
          onChange={(e) => { setGov(e.target.value); setCenter(""); }}
          className="px-3 py-2 rounded-xl border-2 border-border bg-background text-xs font-bold focus:border-gold focus:outline-none"
        >
          <option value="">كل المحافظات</option>
          {govOptions.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <select
          value={center}
          onChange={(e) => setCenter(e.target.value)}
          disabled={!gov}
          className="px-3 py-2 rounded-xl border-2 border-border bg-background text-xs font-bold focus:border-gold focus:outline-none disabled:opacity-40"
        >
          <option value="">كل المراكز</option>
          {centerOptions.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="flex items-center rounded-xl border-2 border-border bg-secondary p-0.5 text-[11px] font-bold">
          {(["all", "online", "offline"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-2.5 py-1.5 rounded-lg ${status === s ? "bg-gradient-royal text-primary-foreground" : ""}`}
            >
              {s === "all" ? "الكل" : s === "online" ? "متصل" : "غير متصل"}
            </button>
          ))}
        </div>
        {(gov || center || status !== "all") && (
          <button
            onClick={() => { setGov(""); setCenter(""); setStatus("all"); }}
            className="px-3 py-2 rounded-xl bg-secondary text-xs font-bold"
          >
            إعادة تعيين
          </button>
        )}
        <button
          onClick={() => setStyle((s) => (s === "satellite" ? "dark" : "satellite"))}
          className="ms-auto px-3 py-2 rounded-xl bg-gold text-gold-foreground text-xs font-bold flex items-center gap-1.5 shadow-elegant"
        >
          {style === "satellite" ? <><Moon className="w-3.5 h-3.5" />الوضع الداكن</> : <><Satellite className="w-3.5 h-3.5" />قمر صناعي</>}
        </button>
      </div>

      <div className="relative rounded-2xl overflow-hidden border-2 border-gold/40 shadow-card" style={{ height }}>
        <MapContainer
          center={[26.8, 30.8]}
          zoom={6}
          scrollWheelZoom
          style={{ height: "100%", width: "100%", background: "var(--color-background)" }}
        >
          <TileLayer key={style} attribution={tile.attr} url={tile.url} maxZoom={tile.maxZoom} />
          <ViewController target={viewTarget} />
          {filtered.map((c) => (
            <Marker key={c.id} position={[c.lat, c.lng]} icon={c.online ? onlineIcon : offlineIcon}>
              <Popup>
                <div className="text-xs font-sans space-y-0.5">
                  <div className="font-bold flex items-center gap-1"><Bike className="w-3 h-3" />{c.name}</div>
                  <div>{c.vehicle} · {c.plate}</div>
                  <div className="text-muted-foreground">{c.gov}{c.zone ? ` · ${c.zone}` : ""}</div>
                  <div className={c.online ? "text-success font-bold" : "text-muted-foreground"}>
                    {c.online ? "متصل الآن" : "غير متصل"}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Live stats overlay */}
        <div className="absolute top-2 start-2 z-[500] flex flex-col gap-1.5">
          <div className="px-2.5 py-1.5 rounded-lg glass text-[11px] font-bold flex items-center gap-1.5 text-gold">
            <Navigation2 className="w-3.5 h-3.5" /> {gov || "الجمهورية"}{center ? ` · ${center}` : ""}
          </div>
          <div className="px-2.5 py-1 rounded-lg glass text-[11px] font-semibold flex items-center gap-1.5 text-success">
            <Wifi className="w-3 h-3" /> {onlineCount} متصل
          </div>
          <div className="px-2.5 py-1 rounded-lg glass text-[11px] font-semibold flex items-center gap-1.5">
            <WifiOff className="w-3 h-3" /> {filtered.length - onlineCount} غير متصل
          </div>
          <div className="px-2.5 py-1 rounded-lg glass text-[11px] font-semibold flex items-center gap-1.5">
            <Users className="w-3 h-3" /> {govCount} محافظة نشطة
          </div>
        </div>
      </div>

      {/* Results list — updates instantly with the filter */}
      <div className="rounded-2xl border-2 border-border bg-card overflow-hidden">
        <div className="px-3 py-2 bg-secondary/50 text-xs font-bold flex items-center justify-between">
          <span>النتائج ({filtered.length})</span>
          <span className="text-[11px] text-muted-foreground">{onlineCount} متصل الآن</span>
        </div>
        <div className="max-h-56 overflow-y-auto divide-y divide-border/50">
          {filtered.length === 0 && (
            <div className="py-6 text-center text-[11px] text-muted-foreground">لا يوجد كباتن مطابقون للفلتر الحالي</div>
          )}
          {filtered.map((c) => (
            <div key={c.id} className="px-3 py-2 flex items-center gap-2 text-xs">
              <span className={`h-2 w-2 rounded-full shrink-0 ${c.online ? "bg-success" : "bg-muted-foreground"}`} />
              <span className="font-bold">{c.name}</span>
              <span className="text-muted-foreground">· {c.vehicle}</span>
              <span className="ms-auto text-[11px] text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />{c.gov}{c.zone ? ` · ${c.zone}` : ""}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CaptainTrackingMap;
