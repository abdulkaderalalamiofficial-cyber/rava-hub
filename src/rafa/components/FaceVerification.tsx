import { useEffect, useRef, useState } from "react";
import { useI18n } from "../i18n";
import { useStore } from "../store";
import { Camera, ScanFace, CheckCircle2, XCircle } from "lucide-react";

export function FaceVerification({ driverId, onPass }: { driverId: string; onPass: () => void }) {
  const { t } = useI18n();
  const { dispatch } = useStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [result, setResult] = useState<null | "ok" | "fail">(null);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      setStreaming(true);
    } catch {
      setStreaming(true); // proceed in simulation mode
    }
  };
  useEffect(() => () => {
    const s = videoRef.current?.srcObject as MediaStream | null;
    s?.getTracks().forEach((tr) => tr.stop());
  }, []);

  const capture = () => {
    const ok = Math.random() > 0.2; // 80% match rate simulation
    setResult(ok ? "ok" : "fail");
    dispatch({ type: "setFaceVerified", driverId, ok });
    if (ok) setTimeout(onPass, 900);
  };

  return (
    <div className="p-5 rounded-2xl border-2 border-gold bg-card shadow-royal max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-3">
        <ScanFace className="w-5 h-5 text-gold" />
        <div className="font-bold">{t("faceVerification")}</div>
      </div>
      <div className="relative aspect-square rounded-xl overflow-hidden bg-secondary border-2 border-dashed border-gold/50 grid place-items-center">
        {streaming ? (
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
        ) : (
          <Camera className="w-10 h-10 text-muted-foreground" />
        )}
        <div className="absolute inset-6 rounded-full border-2 border-gold/70 pointer-events-none" />
        {result === "ok" && <div className="absolute inset-0 bg-success/30 grid place-items-center"><CheckCircle2 className="w-16 h-16 text-success" /></div>}
        {result === "fail" && <div className="absolute inset-0 bg-destructive/40 grid place-items-center flash-alert"><XCircle className="w-16 h-16 text-destructive-foreground" /></div>}
      </div>
      <div className="mt-3 flex gap-2">
        {!streaming && <button onClick={start} className="flex-1 px-3 py-2 rounded-lg bg-secondary text-sm font-bold">{t("startCamera")}</button>}
        {streaming && !result && <button onClick={capture} className="flex-1 px-3 py-2 rounded-lg bg-gradient-royal text-primary-foreground text-sm font-bold">{t("faceCapture")}</button>}
      </div>
      {result === "ok" && <div className="mt-2 text-success text-sm font-bold text-center">{t("faceMatch")}</div>}
      {result === "fail" && <div className="mt-2 text-destructive text-sm font-bold text-center">{t("faceFail")}</div>}
    </div>
  );
}
