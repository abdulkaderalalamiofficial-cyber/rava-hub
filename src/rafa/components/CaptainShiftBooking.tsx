import { useState } from "react";
import { useCaptainShifts } from "../hooks/useCaptainShifts";
import { Calendar, Check, Clock, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function fmt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("ar-EG", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function CaptainShiftBooking({ fleet }: { fleet: string }) {
  const { available, mine, history, book, cancel, loading, error, userId, bookings } = useCaptainShifts({ fleet });
  const [busy, setBusy] = useState<string | null>(null);

  const handleBook = async (id: string) => {
    setBusy(id);
    try { await book(id); } catch (e) { alert(e instanceof Error ? e.message : "تعذر الحجز"); } finally { setBusy(null); }
  };
  const handleCancel = async (shiftId: string) => {
    const b = bookings.find((x) => x.shift_id === shiftId && x.status === "booked");
    if (!b) return;
    setBusy(shiftId);
    try { await cancel(b.id); } catch (e) { alert(e instanceof Error ? e.message : "تعذر الإلغاء"); } finally { setBusy(null); }
  };

  if (!userId) {
    return <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200">سجّل الدخول لعرض النوبات المتاحة وحجز شفت.</div>;
  }

  return (
    <div className="space-y-3">
      {error && <div className="text-xs text-destructive">{error}</div>}
      <Tabs defaultValue="available">
        <TabsList className="grid grid-cols-3 w-full bg-emerald-50 dark:bg-emerald-950/30">
          <TabsTrigger value="available">متاح ({available.length})</TabsTrigger>
          <TabsTrigger value="mine">نوبات عملي ({mine.length})</TabsTrigger>
          <TabsTrigger value="history">السجل ({history.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="available" className="space-y-2 mt-3">
          {loading && <div className="text-xs text-muted-foreground">جارٍ التحميل…</div>}
          {!loading && available.length === 0 && <EmptyShifts label="لا توجد نوبات متاحة الآن — تابع لاحقاً" />}
          {available.map((s) => (
            <ShiftCard key={s.id} title={fmt(s.starts_at) + " → " + new Date(s.ends_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
              note={s.notes ?? `${s.governorate ?? ""} ${s.center ?? ""}`.trim()}
              meta={`${s.booked_count}/${s.capacity}`}
              action={
                <button disabled={busy === s.id || s.booked_count >= s.capacity}
                  onClick={() => handleBook(s.id)}
                  className="px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1">
                  <Check className="w-3 h-3" /> احجز
                </button>
              } />
          ))}
        </TabsContent>
        <TabsContent value="mine" className="space-y-2 mt-3">
          {mine.length === 0 && <EmptyShifts label="لم تحجز أي نوبة قادمة" />}
          {mine.map((s) => (
            <ShiftCard key={s.id} title={fmt(s.starts_at)} note={s.notes ?? ""} meta="مؤكدة"
              action={
                <button disabled={busy === s.id} onClick={() => handleCancel(s.id)}
                  className="px-3 py-1.5 rounded-full bg-white border border-red-300 text-red-600 text-xs font-bold disabled:opacity-50 flex items-center gap-1">
                  <X className="w-3 h-3" /> إلغاء
                </button>
              } />
          ))}
        </TabsContent>
        <TabsContent value="history" className="space-y-2 mt-3">
          {history.length === 0 && <EmptyShifts label="لا يوجد سجل سابق" />}
          {history.slice(0, 20).map((s) => (
            <ShiftCard key={s.id} title={fmt(s.starts_at)} note={s.notes ?? ""} meta="منتهية" muted />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ShiftCard({ title, note, meta, action, muted }: { title: string; note?: string; meta?: string; action?: React.ReactNode; muted?: boolean }) {
  return (
    <div className={`p-3 rounded-xl bg-white dark:bg-card border ${muted ? "border-muted opacity-70" : "border-emerald-200 dark:border-emerald-900"} flex items-center gap-3`}>
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 grid place-items-center text-white">
        <Calendar className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold truncate">{title}</div>
        {note && <div className="text-[10px] text-muted-foreground truncate flex items-center gap-1"><Clock className="w-3 h-3" /> {note}</div>}
      </div>
      {meta && <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">{meta}</div>}
      {action}
    </div>
  );
}

function EmptyShifts({ label }: { label: string }) {
  return <div className="p-6 rounded-xl border-2 border-dashed border-emerald-200 dark:border-emerald-900 text-center text-xs text-muted-foreground">{label}</div>;
}