import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Shift = {
  id: string;
  fleet: string;
  governorate: string | null;
  center: string | null;
  starts_at: string;
  ends_at: string;
  capacity: number;
  booked_count: number;
  notes: string | null;
};

export type Booking = {
  id: string;
  shift_id: string;
  captain_user_id: string;
  status: string;
  created_at: string;
};

export function useCaptainShifts(opts: { fleet?: string; governorate?: string }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id ?? null;
      setUserId(uid);
      let q = (supabase as any).from("shifts").select("*").order("starts_at", { ascending: true });
      if (opts.fleet) q = (q as any).eq("fleet", opts.fleet);
      const { data: s, error: se } = await (q as any);
      if (se) throw se;
      setShifts((s ?? []) as Shift[]);
      if (uid) {
        const { data: b } = await (supabase as any).from("shift_bookings").select("*").eq("captain_user_id", uid as any);
        setBookings((b ?? []) as Booking[]);
      } else {
        setBookings([]);
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load shifts");
    } finally {
      setLoading(false);
    }
  }, [opts.fleet, opts.governorate]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const ch = supabase
      .channel("shifts-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "shifts" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "shift_bookings" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const book = useCallback(async (shiftId: string) => {
    if (!userId) throw new Error("Sign in required to book a shift");
    const { error } = await (supabase as any).from("shift_bookings").insert({ shift_id: shiftId, captain_user_id: userId } as any);
    if (error) throw error;
    await load();
  }, [userId, load]);

  const cancel = useCallback(async (bookingId: string) => {
    const { error } = await (supabase as any).from("shift_bookings").update({ status: "cancelled" } as any).eq("id", bookingId as any);
    if (error) throw error;
    await load();
  }, [load]);

  const now = Date.now();
  const myActiveIds = new Set(bookings.filter((b) => b.status === "booked").map((b) => b.shift_id));
  const available = shifts.filter((s) => !myActiveIds.has(s.id) && new Date(s.ends_at).getTime() > now);
  const mine = shifts.filter((s) => myActiveIds.has(s.id) && new Date(s.ends_at).getTime() > now);
  const history = shifts.filter((s) => new Date(s.ends_at).getTime() <= now);

  return { loading, error, userId, available, mine, history, bookings, book, cancel, refresh: load };
}