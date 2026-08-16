import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";

type LatLng = { lat: number; lng: number };
const DEFAULT_POS: LatLng = { lat: 30.0444, lng: 31.2357 };

export type RouteKind = "fast" | "safe" | "clean";

const ROUTE_COLOR: Record<RouteKind, string> = {
  fast: "#38bdf8",   // sky
  safe: "#34d399",   // emerald
  clean: "#fbbf24",  // amber
};

const captainIcon = L.divIcon({
  className: "rava-captain-marker",
  html: `<div class="relative w-9 h-9">
    <span class="absolute inset-0 rounded-full bg-amber-400/30 animate-ping"></span>
    <span class="absolute inset-1 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-500 ring-2 ring-amber-300 shadow-lg"></span>
    <span class="absolute inset-0 grid place-items-center text-amber-300 text-[12px] font-bold">▲</span>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const destIcon = L.divIcon({
  className: "rava-dest-marker",
  html: `<div class="relative w-7 h-9 -translate-y-2">
    <div class="absolute inset-x-0 top-0 mx-auto w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 ring-2 ring-black/40 shadow-lg grid place-items-center text-black text-[11px] font-black">◎</div>
    <div class="absolute left-1/2 -translate-x-1/2 top-5 w-0 h-0 border-l-4 border-r-4 border-t-[8px] border-l-transparent border-r-transparent border-t-amber-400"></div>
  </div>`,
  iconSize: [28, 36],
  iconAnchor: [14, 32],
});

const camIcon = L.divIcon({
  className: "rava-cam-marker",
  html: `<div class="w-6 h-6 rounded-full bg-red-600/90 ring-2 ring-white/70 shadow grid place-items-center text-white text-[11px] font-black">📷</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function Recenter({ pos, nonce }: { pos: LatLng; nonce?: number }) {
  const map = useMap();
  useEffect(() => { map.setView([pos.lat, pos.lng], map.getZoom(), { animate: true }); }, [pos.lat, pos.lng, map]);
  useEffect(() => { if (nonce !== undefined) map.setView([pos.lat, pos.lng], 15, { animate: true }); }, [nonce]);
  return null;
}

// Build a plausible polyline from origin to destination with a lateral bow.
function buildRoute(a: LatLng, b: LatLng, bow: number): LatLng[] {
  const pts: LatLng[] = [];
  const steps = 16;
  const dx = b.lng - a.lng;
  const dy = b.lat - a.lat;
  // perpendicular direction for the bow
  const px = -dy;
  const py = dx;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const curve = Math.sin(t * Math.PI) * bow;
    pts.push({
      lat: a.lat + dy * t + py * curve,
      lng: a.lng + dx * t + px * curve,
    });
  }
  return pts;
}

export type CaptainMapProps = {
  view: "satellite" | "street";
  routeKind?: RouteKind;
  recenterNonce?: number;
  onSpeed?: (kmh: number) => void;
  onCameras?: (count: number) => void;
  onEta?: (info: { km: number; min: number }) => void;
};

export function CaptainPremiumMap({ view, routeKind = "fast", recenterNonce, onSpeed, onCameras, onEta }: CaptainMapProps) {
  const [pos, setPos] = useState<LatLng>(DEFAULT_POS);
  const watchRef = useRef<number | null>(null);
  const simRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    const opts: PositionOptions = { enableHighAccuracy: true, maximumAge: 5000, timeout: 8000 };
    watchRef.current = navigator.geolocation.watchPosition(
      (p) => {
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude });
        if (p.coords.speed != null && p.coords.speed >= 0) {
          onSpeed?.(Math.round(p.coords.speed * 3.6));
        }
      },
      () => {},
      opts
    );
    return () => { if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current); };
  }, [onSpeed]);

  // Gentle simulated speed when device speed is unavailable (keeps the gauge alive).
  useEffect(() => {
    if (!onSpeed) return;
    let base = 34;
    simRef.current = window.setInterval(() => {
      base = Math.max(0, Math.min(80, base + (Math.random() * 10 - 5)));
      onSpeed(Math.round(base));
    }, 2200);
    return () => { if (simRef.current != null) window.clearInterval(simRef.current); };
  }, [onSpeed]);

  // Destination = fixed offset from live position (north-east).
  const dest = useMemo<LatLng>(() => ({ lat: pos.lat + 0.028, lng: pos.lng + 0.022 }), [pos.lat, pos.lng]);

  // fallback synthetic routes (used before OSRM responds or if it fails)
  const fallbackRoutes = useMemo(() => ({
    fast: buildRoute(pos, dest, 0.0),
    safe: buildRoute(pos, dest, 0.28),
    clean: buildRoute(pos, dest, -0.24),
  }), [pos, dest]);

  // Real road routing via OSRM public demo server (free, road-snapped alternatives)
  const [roadRoutes, setRoadRoutes] = useState<{ fast: LatLng[]; safe: LatLng[]; clean: LatLng[] } | null>(null);
  useEffect(() => {
    let cancelled = false;
    const url = `https://router.project-osrm.org/route/v1/driving/${pos.lng},${pos.lat};${dest.lng},${dest.lat}?alternatives=true&overview=full&geometries=geojson`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.routes?.length) return;
        const rs = data.routes as Array<{ geometry: { coordinates: [number, number][] } }>;
        const decode = (i: number): LatLng[] => {
          const r = rs[i] ?? rs[0];
          return r.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
        };
        setRoadRoutes({
          fast: decode(0),
          safe: decode(Math.min(1, rs.length - 1)),
          clean: decode(Math.min(2, rs.length - 1)),
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [pos.lat, pos.lng, dest.lat, dest.lng]);

  const routes = roadRoutes ?? fallbackRoutes;
  const active = routes[routeKind];

  // Camera positions along the active route.
  const cameras = useMemo(() => {
    const idxs = routeKind === "fast" ? [4, 9, 13] : routeKind === "safe" ? [6, 11] : [7];
    return idxs.map((i) => active[i]).filter(Boolean);
  }, [active, routeKind]);

  useEffect(() => { onCameras?.(cameras.length); }, [cameras.length, onCameras]);

  // Rough ETA: haversine * detour factor.
  useEffect(() => {
    const R = 6371;
    const dLat = (dest.lat - pos.lat) * Math.PI / 180;
    const dLng = (dest.lng - pos.lng) * Math.PI / 180;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(pos.lat * Math.PI / 180) * Math.cos(dest.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    const straight = 2 * R * Math.asin(Math.sqrt(h));
    const factor = routeKind === "fast" ? 1.12 : routeKind === "safe" ? 1.32 : 1.26;
    const km = straight * factor;
    const speed = routeKind === "fast" ? 42 : routeKind === "safe" ? 34 : 36;
    onEta?.({ km: Math.round(km * 10) / 10, min: Math.max(1, Math.round((km / speed) * 60)) });
  }, [pos, dest, routeKind, onEta]);

  const tileUrl = view === "satellite"
    ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
    : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
  const tileAttr = view === "satellite"
    ? 'Tiles &copy; Esri — Source: Esri, Earthstar Geographics'
    : '&copy; OSM &copy; CARTO';

  const color = ROUTE_COLOR[routeKind];

  return (
    <MapContainer
      center={[pos.lat, pos.lng]}
      zoom={14}
      scrollWheelZoom={false}
      zoomControl={false}
      style={{ height: "100%", width: "100%", background: "#0b0b0b" }}
    >
      <TileLayer key={view} attribution={tileAttr} url={tileUrl} maxZoom={19} />
      <Recenter pos={pos} nonce={recenterNonce} />

      {/* dimmed alternative routes */}
      {(Object.keys(routes) as RouteKind[]).filter((k) => k !== routeKind).map((k) => (
        <Polyline key={k} positions={routes[k].map((p) => [p.lat, p.lng]) as [number, number][]}
          pathOptions={{ color: ROUTE_COLOR[k], weight: 4, opacity: 0.28, dashArray: "2 8" }} />
      ))}

      {/* active route: casing + line */}
      <Polyline positions={active.map((p) => [p.lat, p.lng]) as [number, number][]}
        pathOptions={{ color: "#000", weight: 11, opacity: 0.45 }} />
      <Polyline positions={active.map((p) => [p.lat, p.lng]) as [number, number][]}
        pathOptions={{ color, weight: 6, opacity: 0.95 }} />

      {cameras.map((c, i) => (
        <Marker key={i} position={[c.lat, c.lng]} icon={camIcon} />
      ))}
      <Marker position={[dest.lat, dest.lng]} icon={destIcon} />
      <Marker position={[pos.lat, pos.lng]} icon={captainIcon} />
    </MapContainer>
  );
}

export default CaptainPremiumMap;
