import { useState } from "react";
import { useI18n } from "../i18n";
import { useStore } from "../store";
import { X, ShieldAlert } from "lucide-react";

export function ConfirmDialog({
  open, title, body, affected, onConfirm, onClose,
}: {
  open: boolean; title: string; body: string; affected?: number;
  onConfirm: () => void; onClose: () => void;
}) {
  const { t } = useI18n();
  const { state } = useStore();
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");
  if (!open) return null;
  const submit = () => {
    if (pwd !== state.adminPassword) { setErr(t("wrongPwd")); return; }
    setErr(""); setPwd(""); onConfirm(); onClose();
  };
  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur grid place-items-center px-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-card border-2 border-gold rounded-2xl shadow-royal max-w-md w-full p-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-destructive/15 grid place-items-center"><ShieldAlert className="w-5 h-5 text-destructive" /></div>
          <div className="flex-1">
            <div className="font-bold text-base">{title}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{body}</div>
          </div>
          <button onClick={onClose}><X className="w-4 h-4" /></button>
        </div>
        {typeof affected === "number" && (
          <div className="mt-3 p-2.5 rounded-lg bg-secondary text-sm font-bold flex items-center justify-between">
            <span className="text-muted-foreground text-xs">{t("affected")}</span>
            <span className="text-gold">{affected}</span>
          </div>
        )}
        <input type="password" placeholder={t("adminPwd")} value={pwd} onChange={(e) => setPwd(e.target.value)}
          className="mt-3 w-full px-3 py-2 rounded-lg border bg-background text-sm font-mono" />
        {err && <div className="text-xs text-destructive mt-1">{err}</div>}
        <div className="mt-3 flex gap-2">
          <button onClick={onClose} className="flex-1 px-3 py-2 rounded-lg bg-secondary text-sm font-bold">{t("cancel")}</button>
          <button onClick={submit} className="flex-1 px-3 py-2 rounded-lg bg-gradient-royal text-primary-foreground text-sm font-bold">{t("confirm")}</button>
        </div>
        <div className="mt-2 text-[10px] text-muted-foreground text-center">Demo password: <span className="font-mono">RAVA-ADMIN-2026</span></div>
      </div>
    </div>
  );
}
