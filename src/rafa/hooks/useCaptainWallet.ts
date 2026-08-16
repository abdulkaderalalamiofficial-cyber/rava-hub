import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CaptainWallet = {
  balance: number;
  cashInHand: number;
  creditLimit: number;
  currency: string;
};

/** Seed values so the UI renders beautifully before a real session exists. */
const FALLBACK: CaptainWallet = { balance: 120, cashInHand: 132, creditLimit: 150, currency: "EGP" };

/**
 * Connects the captain wallet to the `wallets` table.
 * - Authenticated captain → live DB row (auto-provisioned on first load).
 * - No session → graceful seed values so the dashboard never shows a blank card.
 */
export function useCaptainWallet(actorId: string) {
  const [wallet, setWallet] = useState<CaptainWallet>(FALLBACK);
  const [userId, setUserId] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id ?? null;
      setUserId(uid);
      if (!uid) { setLive(false); setWallet(FALLBACK); setError(null); return; }

      const { data: rows, error: se } = await (supabase as any)
        .from("wallets")
        .select("balance, cash_in_hand, credit_limit, currency")
        .eq("owner_id", uid)
        .eq("actor_kind", "captain")
        .eq("actor_id", actorId)
        .limit(1);
      if (se) throw se;

      let row = rows?.[0];
      if (!row) {
        const { data: created, error: ie } = await (supabase as any)
          .from("wallets")
          .insert({ owner_id: uid, actor_kind: "captain", actor_id: actorId })
          .select("balance, cash_in_hand, credit_limit, currency")
          .single();
        if (ie) throw ie;
        row = created;
      }
      setWallet({
        balance: Number(row.balance ?? 0),
        cashInHand: Number(row.cash_in_hand ?? 0),
        creditLimit: Number(row.credit_limit ?? 150),
        currency: row.currency ?? "EGP",
      });
      setLive(true);
      setError(null);
    } catch (e) {
      setLive(false);
      setError(e instanceof Error ? e.message : "Failed to load wallet");
    } finally {
      setLoading(false);
    }
  }, [actorId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!userId) return;
    const ch = supabase
      .channel(`wallet-${userId}-${actorId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "wallets", filter: `owner_id=eq.${userId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId, actorId, load]);

  /** Settle debt: zero out the cash-on-hand. Persists when authenticated. */
  const settle = useCallback(async () => {
    setWallet((w) => ({ ...w, cashInHand: 0 }));
    if (!userId || !live) return;
    const { error } = await (supabase as any)
      .from("wallets")
      .update({ cash_in_hand: 0 })
      .eq("owner_id", userId)
      .eq("actor_kind", "captain")
      .eq("actor_id", actorId);
    if (error) setError(error.message);
  }, [userId, live, actorId]);

  return { wallet, live, loading, error, settle, refresh: load };
}
