import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import { MapPin, Navigation, Satellite, Moon } from "lucide-react";
import { TILES, type MapStyle } from "./mapTiles";

type LatLng = { lat: number; lng: number };

// Cairo default fallback
const DEFAULT_POS: LatLng = { lat: 30.0444, lng: 31.2357 };

// Custom royal-gold divIcon (no external image assets needed)
const captainIcon = L.divIcon({
  className: "rava-captain-marker",
  html: `<div class="relative w-8 h-8">
    <span class="absolute inset-0 rounded-full bg-[color:var(--color-gold)]/30 animate-ping"></span>
    <span class="absolute inset-1 rounded-full bg-gradient-royal ring-2 ring-[color:var(--color-gold)] shadow-elegant"></span>
    <span class="absolute inset-0 grid place-items-center text-[color:var(--color-gold)] text-[10px] font-bold">★</span>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const pinIcon = L.divIcon({
  className: "rava-pin-marker",
  html: `<div class="relative w-7 h-9 -translate-y-2">
    <div class="absolute inset-x-0 top-0 mx-auto w-6 h-6 rounded-full bg-gradient-gold ring-2 ring-[color:var(--color-primary)] shadow-elegant grid place-items-center text-[color:var(--color-primary)] text-[10px] font-bold">●</div>
    <div class="absolute left-1/2 -translate-x-1/2 top-5 w-0 h-0 border-l-4 border-r-4 border-t-[8px] border-l-transparent border-r-transparent border-t-[color:var(--color-gold)]"></div>
  </div>`,
  iconSize: [28, 36],
  iconAnchor: [14, 32],
});

function Recenter({ pos }: { pos: LatLng }) {
  const map = useMap();
  useEffect(() => { map.setView([pos.lat, pos.lng], map.getZoom(), { animate: true }); }, [pos.lat, pos.lng, map]);
  return null;
}

function ClickPicker({ onPick }: { onPick: (p: LatLng) => void }) {
  useMapEvents({ click(e) { onPick({ lat: e.latlng.lat, lng: e.latlng.lng }); } });
  return null;
}

export type LiveMapProps = {
  mode: "captain" | "customer";
  label?: string;
  height?: number;
  initial?: LatLng;
  onPick?: (p: LatLng) => void; // customer pickup/dropoff picker
  tileStyle?: "dark" | "standard" | "satellite"; // default satellite; user can toggle to dark
  fullScreen?: boolean; // remove rounded border, fill parent absolutely
};

export function LiveMap({ mode, label, height = 220, initial, onPick, tileStyle = "satellite", fullScreen = false }: LiveMapProps) {
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<LatLng>(initial ?? DEFAULT_POS);
  const [picked, setPicked] = useState<LatLng | null>(null);
  const [style, setStyle] = useState<MapStyle>(tileStyle === "dark" ? "dark" : "satellite");
  const watchRef = useRef<number | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    const opts: PositionOptions = { enableHighAccuracy: true, maximumAge: 5000, timeout: 8000 };
    const ok = (p: GeolocationPosition) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude });
    const fail = () => {};
    if (mode === "captain") {
      watchRef.current = navigator.geolocation.watchPosition(ok, fail, opts);
    } else {
      navigator.geolocation.getCurrentPosition(ok, fail, opts);
    }
    return () => { if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current); };
  }, [mounted, mode]);

  if (!mounted) {
    return <div style={fullScreen ? { position: "absolute", inset: 0 } : { height }} className={fullScreen ? "bg-secondary/40 animate-pulse" : "rounded-xl bg-secondary/40 border border-gold/30 animate-pulse"} />;
  }

  const markerPos = mode === "customer" && picked ? picked : pos;
  const tile = TILES[style];

  return (
    <div className={fullScreen ? "absolute inset-0 overflow-hidden" : "relative rounded-xl overflow-hidden border border-gold/30 shadow-card"} style={fullScreen ? undefined : { height }}>
      <MapContainer
        center={[pos.lat, pos.lng]}
        zoom={14}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%", background: "var(--color-background)" }}
      >
        <TileLayer key={style} attribution={tile.attr} url={tile.url} maxZoom={tile.maxZoom} />
        <Recenter pos={pos} />
        <Marker position={[markerPos.lat, markerPos.lng]} icon={mode === "captain" ? captainIcon : pinIcon} />
        {mode === "customer" && onPick && (
          <ClickPicker onPick={(p) => { setPicked(p); onPick(p); }} />
        )}
      </MapContainer>

      <button
        onClick={() => setStyle((s) => (s === "satellite" ? "dark" : "satellite"))}
        className="absolute top-2 end-2 z-[500] text-[10px] px-2 py-1 rounded-md glass font-bold text-gold flex items-center gap-1"
        aria-label="toggle map style"
      >
        {style === "satellite" ? <><Moon className="w-3 h-3" />داكن</> : <><Satellite className="w-3 h-3" />قمر صناعي</>}
      </button>

      {label && (
        <div className="absolute top-2 start-2 z-[500] text-[10px] px-2 py-1 rounded-md glass font-semibold text-gold flex items-center gap-1">
          {mode === "captain" ? <Navigation className="w-3 h-3" /> : <MapPin className="w-3 h-3" />} {label}
        </div>
      )}
      {mode === "customer" && (
        <div className="absolute bottom-2 end-2 z-[500] text-[10px] px-2 py-1 rounded-md glass font-semibold text-gold">
          {picked ? `${picked.lat.toFixed(4)}, ${picked.lng.toFixed(4)}` : "اضغط على الخريطة لتحديد الموقع"}
        </div>
      )}
    </div>
  );
}

export default LiveMap;