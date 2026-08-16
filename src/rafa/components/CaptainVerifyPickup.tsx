import { useRef, useState } from "react";
import { Camera, Loader2, Check } from "lucide-react";
import { useOrderVerification, type CaptainRole } from "../hooks/useOrderVerification";

export function CaptainVerifyPickup({ orderId, role, onDone }: { orderId: string; role: CaptainRole; onDone: () => void }) {
  const { row, submitPickupPhoto } = useOrderVerification(orderId, role);
  const [preview, setPreview] = useState<string | null>(row?.pickup_photo_url ?? null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = (f: File) => {
    const r = new FileReader();
    r.onload = () => setPreview(typeof r.result === "string" ? r.result : null);
    r.readAsDataURL(f);
  };

  const submit = async () => {
    if (!preview) return;
    setBusy(true);
    try { await submitPickupPhoto(preview); onDone(); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-3">
      <div className="text-xs font-bold text-emerald-700">صورة الطرد قبل التسليم</div>
      <div className="aspect-video rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border-2 border-dashed border-emerald-300 dark:border-emerald-800 grid place-items-center overflow-hidden">
        {preview ? <img src={preview} alt="pickup" className="w-full h-full object-cover" /> : <Camera className="w-8 h-8 text-emerald-400" />}
      </div>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      <div className="flex gap-2">
        <button onClick={() => inputRef.current?.click()} className="flex-1 py-2 rounded-xl bg-white dark:bg-card border-2 border-emerald-300 text-emerald-700 text-xs font-bold flex items-center justify-center gap-1.5">
          <Camera className="w-4 h-4" /> {preview ? "إعادة التقاط" : "التقط صورة"}
        </button>
        <button disabled={!preview || busy} onClick={submit} className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-40">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} تأكيد الاستلام
        </button>
      </div>
    </div>
  );
}