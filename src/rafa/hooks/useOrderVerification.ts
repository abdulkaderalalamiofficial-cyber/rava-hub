import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CaptainRole = "delivery" | "transport" | "rescue";

export interface OrderVerification {
  id: string;
  order_id: string;
  captain_user_id: string | null;
  captain_role: string | null;
  pickup_photo_url: string | null;
  pickup_at: string | null;
  delivery_photo_url: string | null;
  delivered_at: string | null;
  otp_code_hash: string | null;
  otp_verified_at: string | null;
  otp_attempts: number;
  weight_kg: number | null;
  cargo_only: boolean;
  bypass_reason: string | null;
  meta: Record<string, unknown>;
}

async function sha256(input: string) {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const bytes = new TextEncoder().encode(input);
    const hash = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return input;
}

/** Local helper — generates a 4-digit OTP from the customer side. */
export function generateOtp() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function useOrderVerification(orderId: string | null, captainRole: CaptainRole = "delivery") {
  const [row, setRow] = useState<OrderVerification | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null)); }, []);

  const load = useCallback(async () => {
    if (!orderId) { setRow(null); return; }
    setLoading(true);
    const { data, error } = await (supabase as any).from("order_verifications").select("*").eq("order_id", orderId).maybeSingle();
    if (error) setError(error.message); else setRow((data as OrderVerification) ?? null);
    setLoading(false);
  }, [orderId]);

  useEffect(() => { load(); }, [load]);

  const upsert = useCallback(async (patch: Partial<OrderVerification>) => {
    if (!orderId || !userId) return null;
    const payload: any = { order_id: orderId, captain_user_id: userId, captain_role: captainRole, ...patch };
    const { data, error } = await (supabase as any).from("order_verifications").upsert(payload, { onConflict: "order_id" }).select("*").single();
    if (error) { setError(error.message); return null; }
    setRow(data as OrderVerification);
    return data as OrderVerification;
  }, [orderId, userId, captainRole]);

  const submitPickupPhoto = useCallback(async (dataUrl: string) => {
    return upsert({ pickup_photo_url: dataUrl, pickup_at: new Date().toISOString() });
  }, [upsert]);

  const verifyDeliveryOtp = useCallback(async (code: string) => {
    if (!orderId || !userId || !row) return { ok: false, reason: "not_loaded" as const };
    const expectedHash = row.otp_code_hash;
    if (!expectedHash) return { ok: false, reason: "no_otp_set" as const };
    const provided = await sha256(`${orderId}:${code.trim()}`);
    const ok = provided === expectedHash;
    await upsert({
      otp_attempts: (row.otp_attempts ?? 0) + 1,
      otp_verified_at: ok ? new Date().toISOString() : row.otp_verified_at,
    });
    return { ok, reason: ok ? "verified" : "mismatch" } as const;
  }, [orderId, userId, row, upsert]);

  const submitDeliveryPhoto = useCallback(async (dataUrl: string) => {
    return upsert({ delivery_photo_url: dataUrl, delivered_at: new Date().toISOString() });
  }, [upsert]);

  const bypassDelivery = useCallback(async (reason: string) => {
    return upsert({
      bypass_reason: reason,
      delivered_at: new Date().toISOString(),
      meta: { ...(row?.meta ?? {}), bypass: { role: captainRole, at: new Date().toISOString() } },
    });
  }, [upsert, row, captainRole]);

  /** Customer side — generate OTP for this order and store the hash. */
  const seedOtp = useCallback(async (code: string, opts?: { weightKg?: number; cargoOnly?: boolean }) => {
    if (!orderId) return null;
    const hash = await sha256(`${orderId}:${code.trim()}`);
    return upsert({ otp_code_hash: hash, weight_kg: opts?.weightKg ?? null, cargo_only: !!opts?.cargoOnly });
  }, [orderId, upsert]);

  return { row, loading, error, userId, refresh: load, submitPickupPhoto, verifyDeliveryOtp, submitDeliveryPhoto, bypassDelivery, seedOtp };
}