import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Client-side GPS spoof heuristics (Phase 2 — anti-fraud).
 * Flags (soft-block only; written to audit_log):
 *   - mock-location flag from the platform (best-effort, browser-only check)
 *   - impossible jump (> ~250 m/s ≈ 900 km/h between samples)
 *   - perfectly static coords for > 5 minutes while marked online
 */
export interface SpoofState {
  flagged: boolean;
  reason: string | null;
  lastLat: number | null;
  lastLng: number | null;
}

export function useGpsSpoofGuard(opts: { active: boolean; captainUserId?: string | null }) {
  const [state, setState] = useState<SpoofState>({ flagged: false, reason: null, lastLat: null, lastLng: null });
  const lastSample = useRef<{ lat: number; lng: number; t: number } | null>(null);
  const staticSince = useRef<number | null>(null);

  useEffect(() => {
    if (!opts.active || typeof navigator === "undefined" || !navigator.geolocation) return;
    let watchId: number | null = null;

    const flag = async (reason: string, payload: Record<string, unknown>) => {
      setState((s) => ({ ...s, flagged: true, reason }));
      try {
        await (supabase as any).from("audit_log").insert({
          action_type: "gps_spoof_flag",
          details: JSON.stringify({ reason, captain: opts.captainUserId ?? null, ...payload }),
        });
      } catch { /* silent */ }
    };

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        const now = Date.now();
        setState((s) => ({ ...s, lastLat: lat, lastLng: lng }));
        // Some browsers expose a `mock` field on the Position object via extensions.
        if ((pos.coords as any).mock === true) flag("mock_location", { accuracy });
        const prev = lastSample.current;
        if (prev) {
          const dt = Math.max(1, (now - prev.t) / 1000);
          const dx = haversine(prev.lat, prev.lng, lat, lng);
          const speed = dx / dt;
          if (speed > 250) flag("impossible_jump", { speed_mps: speed, dx, dt });
          if (dx < 0.5) {
            if (!staticSince.current) staticSince.current = now;
            else if (now - staticSince.current > 5 * 60 * 1000) flag("static_too_long", { minutes: 5 });
          } else {
            staticSince.current = null;
          }
        }
        lastSample.current = { lat, lng, t: now };
      },
      undefined,
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => { if (watchId != null) navigator.geolocation.clearWatch(watchId); };
  }, [opts.active, opts.captainUserId]);

  return state;
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}