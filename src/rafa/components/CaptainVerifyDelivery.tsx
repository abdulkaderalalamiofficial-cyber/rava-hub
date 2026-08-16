import { useRef, useState } from "react";
import { Camera, Check, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { useOrderVerification, type CaptainRole } from "../hooks/useOrderVerification";

/**
 * Phase 2 — delivery verification.
 * For role="delivery": requires OTP (4 digits) + door photo.
 * For role="transport"/"rescue": OTP bypass with a stored reason (transport-role bypass).
 */
export function CaptainVerifyDelivery({ orderId, role, onDone }: { orderId: string; role: CaptainRole; onDone: () => void }) {
  const { row, verifyDeliveryOtp, submitDeliveryPhoto, bypassDelivery } = useOrderVerification(orderId, role);
  const [code, setCode] = useState("");
  const [otpStatus, setOtpStatus] = useState<"idle" | "ok" | "mismatch" | "no_otp">("idle");
  const [preview, setPreview] = useState<string | null>(row?.delivery_photo_url ?? null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const bypass = role !== "delivery";

  const onFile = (f: File) => {
    const r = new FileReader();
    r.onload = () => setPreview(typeof r.result === "string" ? r.result : null);
    r.readAsDataURL(f);
  };

  const verify = async () => {
    if (code.length < 4) return;
    const res = await verifyDeliveryOtp(code);
    setOtpStatus(res.reason === "no_otp_set" ? "no_otp" : res.ok ? "ok" : "mismatch");
  };

  const submit = async () => {
    setBusy(true);
    try {
      if (bypass) {
        await bypassDelivery(`captain_role:${role}`);
      } else {
        if (otpStatus !== "ok" && otpStatus !== "no_otp") return;
        if (!preview) return;
        await submitDeliveryPhoto(preview);
      }
      onDone();
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-3">
      {bypass ? (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-600 mt-0.5" />
          <div className="text-[11px] text-amber-900 dark:text-amber-200">
            <div className="font-bold">تجاوز كود التسليم — نقل/إنقاذ</div>
            <div>يُسجَّل تجاوز إلزامي لسبب: {role}. لا حاجة لكود تسليم.</div>
          </div>
        </div>
      ) : (
        <>
          <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5"><KeyRound className="w-3.5 h-3.5" /> كود التسليم (4 أرقام)</div>
          <div className="flex gap-2">
            <input
              value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
              inputMode="numeric" maxLength={4} placeholder="••••"
              className="flex-1 px-3 py-2 rounded-xl border-2 border-emerald-200 dark:border-emerald-900 bg-white dark:bg-card text-center text-lg font-bold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button onClick={verify} className="px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold">تحقق</button>
          </div>
          {otpStatus === "ok" && <div className="text-[11px] text-emerald-700 font-bold">✓ كود صحيح</div>}
          {otpStatus === "mismatch" && <div className="text-[11px] text-red-600 font-bold">كود غير صحيح — حاول مجدداً</div>}
          {otpStatus === "no_otp" && <div className="text-[11px] text-amber-700 font-bold">⚠ لم يصدر كود لهذا الطلب — يمكن المتابعة بصورة الباب فقط</div>}

          <div className="text-xs font-bold text-emerald-700 mt-2">صورة الباب / المكان</div>
          <div className="aspect-video rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border-2 border-dashed border-emerald-300 dark:border-emerald-800 grid place-items-center overflow-hidden">
            {preview ? <img src={preview} alt="door" className="w-full h-full object-cover" /> : <Camera className="w-8 h-8 text-emerald-400" />}
          </div>
          <input ref={inputRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          <button onClick={() => inputRef.current?.click()} className="w-full py-2 rounded-xl bg-white dark:bg-card border-2 border-emerald-300 text-emerald-700 text-xs font-bold flex items-center justify-center gap-1.5">
            <Camera className="w-4 h-4" /> {preview ? "إعادة التقاط" : "التقط صورة الباب"}
          </button>
        </>
      )}
      <button
        disabled={busy || (!bypass && (!preview || (otpStatus !== "ok" && otpStatus !== "no_otp")))}
        onClick={submit}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-amber-400 text-white text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-40"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} تأكيد التسليم
      </button>
    </div>
  );
}