import { useRef, useState } from "react";
import { Image as ImageIcon, Film, Upload, Clock, CheckCircle2, XCircle, Trash2, Megaphone, Info } from "lucide-react";

export type MediaKind = "banner" | "reel";
export type MediaStatus = "pending" | "approved" | "rejected";
export type MediaItem = {
  id: string;
  kind: MediaKind;
  title: string;
  url: string;
  status: MediaStatus;
  createdAt: number;
};

export function MerchantMedia() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<MediaKind>("banner");
  const fileRef = useRef<HTMLInputElement>(null);

  const readAsDataURL = (file: File): Promise<string> =>
    new Promise((res) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.readAsDataURL(file); });

  const onPick = async (file: File) => {
    const url = await readAsDataURL(file);
    setItems((prev) => [
      { id: "med-" + Math.random().toString(36).slice(2, 8), kind, title: title.trim() || (kind === "banner" ? "بنر جديد" : "ريلز جديد"), url, status: "pending", createdAt: Date.now() },
      ...prev,
    ]);
    setTitle("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const remove = (id: string) => setItems((prev) => prev.filter((x) => x.id !== id));

  const pending = items.filter((x) => x.status === "pending").length;
  const approved = items.filter((x) => x.status === "approved").length;

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center gap-2">
        <Megaphone className="w-4 h-4 text-gold" />
        <div className="text-sm font-bold">الحملات الإعلانية والميديا</div>
        <span className="ms-auto text-[11px] text-muted-foreground">
          قيد المراجعة: <b className="text-amber-600">{pending}</b> · منشور: <b className="text-emerald-700">{approved}</b>
        </span>
      </div>

      <div className="p-2.5 rounded-xl bg-amber-50 border-2 border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
        <Info className="w-3.5 h-3.5 mt-0.5" />
        <span>كل المواد الدعائية تخضع لمراجعة غرفة التحكم قبل النشر. ستصبح ميزة مدفوعة لاحقًا لضمان جودة المحتوى.</span>
      </div>

      <div className="p-3 rounded-xl border-2 border-emerald-200 bg-emerald-50/40 space-y-2.5">
        <div className="flex gap-2">
          <button onClick={() => setKind("banner")}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold border-2 flex items-center justify-center gap-1.5 ${
              kind === "banner" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white border-emerald-200 text-emerald-800"
            }`}>
            <ImageIcon className="w-3.5 h-3.5" /> بنر إعلاني
          </button>
          <button onClick={() => setKind("reel")}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold border-2 flex items-center justify-center gap-1.5 ${
              kind === "reel" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white border-emerald-200 text-emerald-800"
            }`}>
            <Film className="w-3.5 h-3.5" /> فيديو قصير / ريلز
          </button>
        </div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان أو وصف قصير"
          className="w-full px-3 py-2 rounded-lg border-2 border-emerald-200 focus:border-emerald-500 outline-none text-sm" />
        <input ref={fileRef} type="file"
          accept={kind === "banner" ? "image/*" : "video/*"}
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); }} />
        <button onClick={() => fileRef.current?.click()}
          className="w-full py-3 rounded-xl border-2 border-dashed border-emerald-400 text-xs font-bold text-emerald-800 hover:bg-emerald-50 flex items-center justify-center gap-1.5">
          <Upload className="w-4 h-4" /> {kind === "banner" ? "رفع بنر (سيظهر في السلايدر العلوي للعميل)" : "رفع فيديو ترويجي قصير"}
        </button>
      </div>

      <div className="space-y-2">
        {items.length === 0 && (
          <div className="p-6 text-center text-xs text-muted-foreground border-2 border-dashed rounded-xl">
            لم تقم برفع أي مواد دعائية بعد
          </div>
        )}
        {items.map((m) => (
          <div key={m.id} className="p-2.5 rounded-xl border bg-card flex items-center gap-2.5">
            {m.kind === "banner" ? (
              <img src={m.url} alt="" className="w-16 h-12 rounded-lg object-cover border" />
            ) : (
              <video src={m.url} className="w-16 h-12 rounded-lg object-cover border bg-black" muted />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold truncate">{m.title}</div>
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                {m.kind === "banner" ? "بنر" : "ريلز"} · {new Date(m.createdAt).toLocaleDateString("ar-EG")}
              </div>
            </div>
            <StatusPill status={m.status} />
            <button onClick={() => remove(m.id)} aria-label="حذف"
              className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 text-red-600 grid place-items-center hover:bg-red-100">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: MediaStatus }) {
  if (status === "pending") return (
    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
      <Clock className="w-3 h-3" /> قيد المراجعة
    </span>
  );
  if (status === "approved") return (
    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
      <CheckCircle2 className="w-3 h-3" /> منشور
    </span>
  );
  return (
    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-red-100 text-red-800 border border-red-300 flex items-center gap-1">
      <XCircle className="w-3 h-3" /> مرفوض
    </span>
  );
}
