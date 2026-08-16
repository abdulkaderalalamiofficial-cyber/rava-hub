import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CustomerBlock {
  customer_user_id: string;
  reason: string;
  ghost_cancel_count: number;
  blocked_until: string | null;
}

/** Reads the current user's auto-block record (Phase 2 anti-fraud). */
export function useCustomerBlock() {
  const [block, setBlock] = useState<CustomerBlock | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) { setLoaded(true); return; }
      const { data } = await (supabase as any).from("customer_blocks").select("*").eq("customer_user_id", uid).maybeSingle();
      if (cancelled) return;
      setBlock((data as CustomerBlock) ?? null);
      setLoaded(true);
      const ch = supabase.channel(`blocks-${uid}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "customer_blocks", filter: `customer_user_id=eq.${uid}` },
          (payload) => setBlock((payload.new as CustomerBlock) ?? null))
        .subscribe();
      return () => { supabase.removeChannel(ch); };
    })();
    return () => { cancelled = true; };
  }, []);

  const now = Date.now();
  const activeBlock = block && block.blocked_until && new Date(block.blocked_until).getTime() > now ? block : null;
  return { block, activeBlock, loaded };
}

/** Logs a customer-initiated cancellation. The DB trigger auto-blocks at 3 ghost cancels in 7 days. */
export async function logCustomerCancellation(opts: { orderId?: string; reason?: string; afterSeconds: number; captainWasEnroute: boolean }) {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) return { logged: false };
  const { error } = await (supabase as any).from("customer_cancellations").insert({
    customer_user_id: uid,
    order_id: opts.orderId ?? null,
    reason: opts.reason ?? null,
    after_seconds: opts.afterSeconds,
    captain_was_enroute: opts.captainWasEnroute,
  });
  return { logged: !error, error: error?.message };
}