import { useState } from "react";
import { usePlatformConfig, applyDynamicPricing, type PromoBanner } from "../platformConfig";
import { CreditCard, ToggleLeft, Sliders, Megaphone, Plus, Trash2, RotateCcw, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "gateways" | "features" | "pricing" | "banners";

export function PlatformControlCenter({ readOnly = false }: { readOnly?: boolean }) {
  const [tab, setTab] = useState<Tab>("gateways");
  const { cfg, toggleGateway, patchGateway, toggleFeature, patchPricing, addBanner, patchBanner, removeBanner, resetAll } = usePlatformConfig();

  const enabledCount = cfg.gateways.filter((g) => g.enabled).length;
  const activeFeatures = cfg.features.filter((f) => f.enabled).length;

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryPill emoji="💳" label="بوابات مفعّلة" value={`${enabledCount} / ${cfg.gateways.length}`} />
        <SummaryPill emoji="🎛️" label="خدمات شغّالة" value={`${activeFeatures} / ${cfg.features.length}`} />
        <SummaryPill emoji="📈" label="التسعير الديناميكي" value={cfg.pricing.enabled ? `مفعّل ×${cfg.pricing.surgeMultiplier.toFixed(1)}` : "متوقف"} tone={cfg.pricing.enabled ? "gold" : "muted"} />
        <SummaryPill emoji="📣" label="بانرات نشطة" value={String(cfg.banners.filter((b) => b.enabled).length)} />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gold/20 pb-2">
        {([
          { id: "gateways", label: "بوابات الدفع", icon: CreditCard },
          { id: "features", label: "تشغيل/إيقاف الخدمات", icon: ToggleLeft },
          { id: "pricing",  label: "التسعير الديناميكي", icon: Sliders },
          { id: "banners",  label: "بانرات العميل", icon: Megaphone },
        ] as { id: Tab; label: string; icon: any }[]).map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn("px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors",
              tab === t.id ? "bg-gradient-royal text-primary-foreground shadow-royal" : "bg-secondary hover:bg-gold/15")}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
        <button onClick={() => { if (confirm("إعادة كل الإعدادات للوضع الافتراضي؟")) resetAll(); }}
          disabled={readOnly}
          className="ms-auto px-3 py-2 rounded-xl text-xs font-bold bg-destructive/10 text-destructive hover:bg-destructive/20 flex items-center gap-1.5 disabled:opacity-40">
          <RotateCcw className="w-3.5 h-3.5" /> استعادة الافتراضي
        </button>
      </div>

      {tab === "gateways" && (
        <div className="space-y-2">
          <p className="text-[11px] text-muted-foreground">
            التفعيل هنا ينعكس فوراً على شاشة العميل عند إتمام الشراء — يظهر فقط ما هو مفعّل.
          </p>
          <div className="grid md:grid-cols-2 gap-2">
            {cfg.gateways.map((g) => (
              <div key={g.id} className={cn("p-3 rounded-2xl border-2 bg-card transition-all",
                g.enabled ? "border-success/60 shadow-card" : "border-border opacity-80")}>
                <div className="flex items-start gap-2">
                  <div className="text-2xl leading-none">{g.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold">{g.nameAr}</div>
                    <div className="text-[10px] text-muted-foreground">{g.nameEn}</div>
                  </div>
                  <button disabled={readOnly} onClick={() => toggleGateway(g.id)}
                    className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold border-2 transition-all",
                      g.enabled ? "bg-success/15 border-success text-success" : "bg-secondary border-border text-muted-foreground",
                      readOnly && "opacity-40")}>
                    {g.enabled ? <span className="flex items-center gap-1"><Check className="w-3 h-3" />مفعّل</span> : <span className="flex items-center gap-1"><X className="w-3 h-3" />متوقف</span>}
                  </button>
                </div>
                {g.enabled && (
                  <>
                    <div className="mt-2 grid grid-cols-3 gap-1.5 text-[10px]">
                      <NumInput label="رسوم %" value={g.feePct} onChange={(v) => patchGateway(g.id, { feePct: v })} disabled={readOnly} step={0.1} />
                      <NumInput label="حد أدنى" value={g.minEgp} onChange={(v) => patchGateway(g.id, { minEgp: v })} disabled={readOnly} />
                      <NumInput label="حد أقصى (0=بدون)" value={g.maxEgp} onChange={(v) => patchGateway(g.id, { maxEgp: v })} disabled={readOnly} />
                    </div>
                    <div className="mt-1.5 grid gap-1.5">
                      <TxtInput label="رابط الدفع (إنستا باي / لينك)" placeholder="https://ipn.eg/S/..." value={g.payUrl ?? ""} onChange={(v) => patchGateway(g.id, { payUrl: v })} disabled={readOnly} />
                      <TxtInput label="رقم المحفظة / الحساب" placeholder="01xxxxxxxxx أو رقم حساب بنكي" value={g.payNumber ?? ""} onChange={(v) => patchGateway(g.id, { payNumber: v })} disabled={readOnly} />
                      <TxtInput label="تعليمات للعميل" placeholder="حوّل المبلغ وأرسل صورة الإيصال" value={g.payNote ?? ""} onChange={(v) => patchGateway(g.id, { payNote: v })} disabled={readOnly} />
                    </div>
                  </>
                )}

              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "features" && (
        <div className="space-y-2">
          <p className="text-[11px] text-muted-foreground">
            إيقاف خدمة يخفيها فوراً عن العميل والكابتن والتاجر — استخدمها للصيانة أو إطلاق تدريجي.
          </p>
          <div className="grid md:grid-cols-2 gap-2">
            {cfg.features.map((f) => (
              <button key={f.id} disabled={readOnly} onClick={() => toggleFeature(f.id)}
                className={cn("p-3 rounded-2xl border-2 text-start transition-all flex items-center gap-3",
                  f.enabled ? "bg-success/5 border-success/60" : "bg-secondary border-border opacity-80",
                  readOnly && "opacity-40 cursor-not-allowed")}>
                <div className="text-2xl">{f.emoji}</div>
                <div className="flex-1">
                  <div className="text-sm font-bold">{f.nameAr}</div>
                  <div className="text-[10px] text-muted-foreground">{f.nameEn}</div>
                </div>
                <span className={cn("px-2 py-1 rounded-lg text-[10px] font-bold border-2",
                  f.enabled ? "bg-success/15 border-success text-success" : "bg-card border-border text-muted-foreground")}>
                  {f.enabled ? "شغّال" : "متوقف"}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === "pricing" && (
        <div className="space-y-3">
          <div className="p-3 rounded-2xl border-2 border-gold/40 bg-card">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" disabled={readOnly} checked={cfg.pricing.enabled}
                onChange={(e) => patchPricing({ enabled: e.target.checked })}
                className="w-5 h-5 accent-[var(--color-gold)]" />
              <span className="font-bold text-sm">تفعيل التسعير الديناميكي</span>
              <span className="ms-auto text-[10px] text-muted-foreground">لو متوقف — التسعير الثابت المعتاد شغال</span>
            </label>
          </div>

          <div className={cn("grid md:grid-cols-2 gap-3 transition-opacity", !cfg.pricing.enabled && "opacity-50 pointer-events-none")}>
            <SliderField label="ضاعف ذروة الطلب" hint="×1.0 عادي · ×2.5 مطر/حدث كبير"
              value={cfg.pricing.surgeMultiplier} min={1} max={3} step={0.1}
              onChange={(v) => patchPricing({ surgeMultiplier: v })} disabled={readOnly} suffix={`×${cfg.pricing.surgeMultiplier.toFixed(1)}`} />
            <SliderField label="تعرفة ليلية (00:00-05:00)" hint="نسبة إضافية على السعر الأساسي"
              value={cfg.pricing.nightSurchargePct} min={0} max={80} step={5}
              onChange={(v) => patchPricing({ nightSurchargePct: v })} disabled={readOnly} suffix={`+${cfg.pricing.nightSurchargePct}%`} />
            <SliderField label="ساعات الذروة (17-20)" hint="نسبة إضافية أوقات الزحمة"
              value={cfg.pricing.peakSurchargePct} min={0} max={60} step={5}
              onChange={(v) => patchPricing({ peakSurchargePct: v })} disabled={readOnly} suffix={`+${cfg.pricing.peakSurchargePct}%`} />
            <SliderField label="خصم عمولة الكابتن الذهبي" hint="يُخصم من نسبة العمولة للكباتن الأعلى تقييماً"
              value={cfg.pricing.loyaltyCommissionCut} min={0} max={20} step={1}
              onChange={(v) => patchPricing({ loyaltyCommissionCut: v })} disabled={readOnly} suffix={`-${cfg.pricing.loyaltyCommissionCut}%`} />
          </div>

          <div className="p-3 rounded-2xl border-2 border-gold/30 bg-gradient-to-br from-card to-gold/5">
            <div className="text-[11px] font-bold mb-2">معاينة على طلب أساسي 100 ج.م الآن:</div>
            {(() => {
              const p = applyDynamicPricing(100, cfg.pricing);
              return (
                <div className="space-y-1">
                  {p.breakdown.map((b, i) => (
                    <div key={i} className="flex justify-between text-[11px]">
                      <span>{b.label}</span><span className="font-mono">{b.amount.toFixed(0)} ج.م</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-black text-gold pt-1 border-t border-gold/20">
                    <span>الإجمالي</span><span>{p.total} ج.م</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {tab === "banners" && (
        <BannerEditor
          banners={cfg.banners}
          onAdd={addBanner}
          onPatch={patchBanner}
          onRemove={removeBanner}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}

function SummaryPill({ emoji, label, value, tone = "royal" }: { emoji: string; label: string; value: string; tone?: "royal" | "gold" | "muted" }) {
  return (
    <div className={cn("p-3 rounded-2xl border-2 bg-card shadow-card",
      tone === "royal" && "border-primary/30",
      tone === "gold" && "border-gold shadow-royal",
      tone === "muted" && "border-border opacity-80")}>
      <div className="flex items-center gap-2">
        <span className="text-xl">{emoji}</span>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{label}</div>
          <div className="text-sm font-black">{value}</div>
        </div>
      </div>
    </div>
  );
}

function NumInput({ label, value, onChange, disabled, step = 1 }: { label: string; value: number; onChange: (v: number) => void; disabled?: boolean; step?: number }) {
  return (
    <label className="block">
      <span className="block text-[9px] font-bold text-muted-foreground mb-0.5">{label}</span>
      <input type="number" step={step} disabled={disabled} value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-full px-2 py-1 rounded-lg border bg-background text-[11px] font-mono focus:border-gold outline-none disabled:opacity-40" />
    </label>
  );
}
function TxtInput({ label, placeholder, value, onChange, disabled }: { label: string; placeholder?: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <label className="block">
      <span className="block text-[9px] font-bold text-muted-foreground mb-0.5">{label}</span>
      <input type="text" dir="ltr" disabled={disabled} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1 rounded-lg border bg-background text-[11px] focus:border-gold outline-none disabled:opacity-40" />
    </label>
  );
}


function SliderField({ label, hint, value, min, max, step, onChange, disabled, suffix }:
  { label: string; hint: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; disabled?: boolean; suffix: string }) {
  return (
    <div className="p-3 rounded-2xl border bg-card">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold">{label}</span>
        <span className="text-xs font-black text-gold">{suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--color-gold)]" />
      <div className="text-[10px] text-muted-foreground mt-1">{hint}</div>
    </div>
  );
}

function BannerEditor({ banners, onAdd, onPatch, onRemove, readOnly }:
  { banners: PromoBanner[]; onAdd: (b: Omit<PromoBanner, "id">) => void; onPatch: (id: string, p: Partial<PromoBanner>) => void; onRemove: (id: string) => void; readOnly?: boolean }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tone, setTone] = useState<PromoBanner["tone"]>("gold");

  const add = () => {
    if (!title.trim()) return;
    onAdd({ titleAr: title.trim(), bodyAr: body.trim(), enabled: true, tone });
    setTitle(""); setBody("");
  };

  return (
    <div className="space-y-3">
      <div className="p-3 rounded-2xl border-2 border-gold/30 bg-card space-y-2">
        <div className="text-xs font-bold">إنشاء بانر جديد للعميل</div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} disabled={readOnly}
          placeholder="العنوان (يظهر بالخط العريض)"
          className="w-full px-3 py-2 rounded-xl border bg-background text-xs focus:border-gold outline-none" dir="rtl" />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} disabled={readOnly}
          placeholder="النص التوضيحي (اختياري)"
          rows={2}
          className="w-full px-3 py-2 rounded-xl border bg-background text-xs focus:border-gold outline-none resize-none" dir="rtl" />
        <div className="flex items-center gap-2">
          <select value={tone} onChange={(e) => setTone(e.target.value as PromoBanner["tone"])} disabled={readOnly}
            className="px-2 py-1.5 rounded-lg border bg-background text-xs">
            <option value="gold">ذهبي</option>
            <option value="royal">أخضر ملكي</option>
            <option value="info">أزرق معلوماتي</option>
          </select>
          <button onClick={add} disabled={readOnly || !title.trim()}
            className="ms-auto px-3 py-1.5 rounded-lg bg-gradient-royal text-primary-foreground text-xs font-bold shadow-elegant flex items-center gap-1 disabled:opacity-40">
            <Plus className="w-3.5 h-3.5" /> إضافة
          </button>
        </div>
      </div>

      {banners.length === 0 && <div className="text-center py-6 text-xs text-muted-foreground">لا توجد بانرات بعد.</div>}

      <div className="space-y-2">
        {banners.map((b) => (
          <div key={b.id} className={cn("p-3 rounded-2xl border-2 bg-card flex items-start gap-2",
            b.enabled ? "border-gold/50" : "border-border opacity-70")}>
            <div className={cn("w-2 h-full min-h-[3rem] rounded-full",
              b.tone === "gold" && "bg-gold",
              b.tone === "royal" && "bg-primary",
              b.tone === "info" && "bg-blue-500")} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold">{b.titleAr}</div>
              {b.bodyAr && <div className="text-[11px] text-muted-foreground mt-0.5">{b.bodyAr}</div>}
            </div>
            <div className="flex flex-col gap-1">
              <button disabled={readOnly} onClick={() => onPatch(b.id, { enabled: !b.enabled })}
                className={cn("px-2 py-1 rounded-lg text-[10px] font-bold border",
                  b.enabled ? "bg-success/15 border-success text-success" : "bg-secondary border-border text-muted-foreground")}>
                {b.enabled ? "مفعّل" : "متوقف"}
              </button>
              <button disabled={readOnly} onClick={() => onRemove(b.id)}
                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-destructive/10 text-destructive hover:bg-destructive/20 flex items-center gap-1">
                <Trash2 className="w-3 h-3" /> حذف
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
