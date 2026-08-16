import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { notify } from "@/lib/notify";


export interface CloudOrderRow {
  id: string;
  service: string;
  status: string;
  zone: string | null;
  dest_zone: string | null;
  fare_egp: number;
  customer: string;
  pickup: string;
  dropoff: string;
  created_at: string;
  updated_at: string;
}

export interface CloudOrdersState {
  orders: CloudOrderRow[];
  liveCount: number;
  lastEvent: { type: "INSERT" | "UPDATE" | "DELETE"; row: CloudOrderRow; at: number } | null;
  loaded: boolean;
}

/**
 * Subscribes to public.orders via Postgres realtime.
 * Filter is the user's zone (governorate + center format), enforced both
 * server-side by RLS and client-side as a hierarchical guard to prevent
 * data overlap between Egyptian zones.
 */
export function useCloudOrders(zoneFilter?: { governorate?: string; center?: string }): CloudOrdersState {
  const [state, setState] = useState<CloudOrdersState>({
    orders: [],
    liveCount: 0,
    lastEvent: null,
    loaded: false,
  });

  useEffect(() => {
    let cancelled = false;

    const inZone = (row: CloudOrderRow) => {
      if (!zoneFilter?.governorate) return true;
      const z = (row.zone ?? "").toLowerCase();
      if (!z.includes(zoneFilter.governorate.toLowerCase())) return false;
      if (zoneFilter.center && !z.includes(zoneFilter.center.toLowerCase())) return false;
      return true;
    };

    (async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, service, status, zone, dest_zone, fare_egp, customer, pickup, dropoff, created_at, updated_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (cancelled) return;
      const rows = ((data as CloudOrderRow[] | null) ?? []).filter(inZone);
      setState((s) => ({ ...s, orders: rows, liveCount: rows.filter((r) => r.status === "pending" || r.status === "accepted").length, loaded: true }));
    })();

    const channel = supabase
      .channel("cloud-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          const row = (payload.new ?? payload.old) as CloudOrderRow;
          if (!row || !inZone(row)) return;
          if (payload.eventType === "INSERT") {
            void notify(
              "طلب جديد على RAVA",
              `${row.service} · ${row.pickup} → ${row.dropoff} · ${row.fare_egp} ج.م`,
              `order-${row.id}`,
            );
          }
          setState((prev) => {
            let next = prev.orders;

            if (payload.eventType === "INSERT") next = [row, ...prev.orders].slice(0, 100);
            else if (payload.eventType === "UPDATE") next = prev.orders.map((o) => (o.id === row.id ? row : o));
            else if (payload.eventType === "DELETE") next = prev.orders.filter((o) => o.id !== row.id);
            return {
              orders: next,
              liveCount: next.filter((r) => r.status === "pending" || r.status === "accepted").length,
              lastEvent: { type: payload.eventType as "INSERT" | "UPDATE" | "DELETE", row, at: Date.now() },
              loaded: true,
            };
          });
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [zoneFilter?.governorate, zoneFilter?.center]);

  return state;
}