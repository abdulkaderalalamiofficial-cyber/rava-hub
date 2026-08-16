import { useMemo, useState, useDeferredValue, useEffect, useRef } from "react";
import { Search, Plus, Minus, Package, Filter, ChevronLeft, ChevronRight, X, Settings, Upload, AlertTriangle, FileText, BookOpen } from "lucide-react";
import { BOOK_CATEGORIES } from "../data/booksSeed";

// Strict block-list — forbidden content categories for digital uploads.
const FORBIDDEN_TERMS = ["إباح", "عاري", "مخدرات", "قنبلة", "إرهاب", "تحريض", "طائف", "porn", "nude", "drugs", "bomb", "terror"];
export function isForbiddenContent(text: string): boolean {
  const t = (text || "").toLowerCase();
  return FORBIDDEN_TERMS.some((w) => t.includes(w.toLowerCase()));
}

export type CatalogItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  sku?: string;
  family?: string;
  author?: string;
  image?: string;
  discountPrice?: number;
  discountActive?: boolean;
  // Digital (publisher) fields
  digital?: boolean;
  pdfFull?: string;
  pdfSample?: string;
};

const PAGE_SIZE = 50;

/** Merchant account kinds: general store, spare-parts dealer, digital publisher. */
export type MerchantType = "store" | "spare" | "publisher";

export function MerchantCatalog({
  items, onQtyChange, onItemUpdate, merchantType = "store",

}: {
  items: CatalogItem[];
  onQtyChange: (id: string, delta: 1 | -1) => void;
  onItemUpdate?: (id: string, patch: Partial<CatalogItem>) => void;
  merchantType?: MerchantType;
}) {
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const [family, setFamily] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);

  const indexed = useMemo(() => items.map((it) => ({
    it, low: it.name.toLowerCase(), sku: (it.sku ?? "").toLowerCase(),
    fam: (it.family ?? it.name.split(" ")[0]).toLowerCase(),
  })), [items]);

  const families = useMemo(() => {
    const set = new Set<string>();
    for (const r of indexed) set.add(r.fam);
    return Array.from(set).slice(0, 24);
  }, [indexed]);

  const filtered = useMemo(() => {
    const q = deferred.trim().toLowerCase();
    const mn = minPrice ? Number(minPrice) : -Infinity;
    const mx = maxPrice ? Number(maxPrice) : Infinity;
    const fam = family.toLowerCase();
    const out: typeof indexed = [];
    for (let i = 0; i < indexed.length; i++) {
      const r = indexed[i];
      if (q && !r.low.includes(q) && !r.sku.includes(q)) continue;
      if (fam && r.fam !== fam) continue;
      if (r.it.price < mn || r.it.price > mx) continue;
      if (inStockOnly && !r.it.digital && r.it.qty <= 0) continue;
      out.push(r);
    }
    return out;
  }, [indexed, deferred, family, minPrice, maxPrice, inStockOnly]);

  useEffect(() => { setPage(0); }, [deferred, family, minPrice, maxPrice, inStockOnly]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const activeFilterCount = (family ? 1 : 0) + (minPrice ? 1 : 0) + (maxPrice ? 1 : 0) + (inStockOnly ? 1 : 0);
  const editingItem = editingId ? items.find((x) => x.id === editingId) ?? null : null;
  const outOfStockCount = useMemo(() => items.filter((i) => !i.digital && i.qty === 0).length, [items]);

  return (
    <div className="space-y-3" dir="rtl">
      <div className="flex items-center gap-2">
        <Package className="w-4 h-4 text-emerald-700" />
        <div className="text-sm font-bold">
          {merchantType === "publisher" ? "مكتبة الكتب الرقمية" : "كتالوج المخزون الذكي"}
        </div>
        <span className="ms-auto text-[11px] text-muted-foreground">
          {items.length.toLocaleString()} صنف
        </span>
      </div>

      {outOfStockCount > 0 && merchantType !== "publisher" && (
        <div className="p-2.5 rounded-xl bg-red-50 border-2 border-red-300 text-[11px] font-bold text-red-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{outOfStockCount} صنف نفدت كميته — يظهر للعميل "نفذت الكمية"</span>
        </div>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground" />
          <input
            value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث بالاسم أو الكود SKU..."
            className="w-full ps-9 pe-3 py-2.5 rounded-xl bg-card border-2 border-emerald-200 focus:border-emerald-500 outline-none text-sm"
          />
        </div>
        <button onClick={() => setShowFilters((s) => !s)}
          className={`px-3 rounded-xl border-2 text-xs font-bold flex items-center gap-1.5 transition ${
            showFilters || activeFilterCount > 0 ? "bg-emerald-600 text-white border-emerald-600" : "bg-card border-emerald-200"
          }`}>
          <Filter className="w-3.5 h-3.5" /> فلاتر
          {activeFilterCount > 0 && <span className="bg-amber-400 text-amber-950 rounded-full px-1.5 text-[10px]">{activeFilterCount}</span>}
        </button>
      </div>

      {showFilters && (
        <div className="p-3 rounded-xl border-2 border-emerald-200 bg-emerald-50/40 space-y-2.5">
          <div>
            <div className="text-[11px] font-bold text-emerald-900 mb-1.5">الفئة</div>
            <div className="flex gap-1.5 flex-wrap max-h-24 overflow-auto">
              {families.map((f) => (
                <button key={f} onClick={() => setFamily(family === f ? "" : f)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border-2 transition ${
                    family === f ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-emerald-800 border-emerald-200"
                  }`}>{f}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <div className="text-[11px] font-bold text-emerald-900 mb-1">سعر من</div>
              <input value={minPrice} onChange={(e) => setMinPrice(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric" placeholder="0"
                className="w-full px-2 py-1.5 rounded-lg border border-emerald-200 text-xs outline-none focus:border-emerald-500" />
            </div>
            <div className="flex-1">
              <div className="text-[11px] font-bold text-emerald-900 mb-1">سعر إلى</div>
              <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric" placeholder="∞"
                className="w-full px-2 py-1.5 rounded-lg border border-emerald-200 text-xs outline-none focus:border-emerald-500" />
            </div>
            {merchantType !== "publisher" && (
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-900 pb-1.5">
                <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} />
                متاح فقط
              </label>
            )}
          </div>
          {activeFilterCount > 0 && (
            <button onClick={() => { setFamily(""); setMinPrice(""); setMaxPrice(""); setInStockOnly(false); }}
              className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
              <X className="w-3 h-3" /> مسح الفلاتر
            </button>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{filtered.length.toLocaleString()} نتيجة</span>
        <span>صفحة {page + 1} من {totalPages.toLocaleString()}</span>
      </div>

      <div className="space-y-1.5 max-h-[55vh] overflow-auto pe-1">
        {pageItems.length === 0 && (
          <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
            لا توجد نتائج
          </div>
        )}
        {pageItems.map(({ it }) => {
          const isDigital = it.digital || merchantType === "publisher";
          const displayPrice = it.discountActive && it.discountPrice ? it.discountPrice : it.price;
          return (
            <div key={it.id} className="p-2.5 rounded-xl border bg-card flex items-center gap-2.5">
              {it.image ? (
                <img src={it.image} alt="" className="w-11 h-11 rounded-lg object-cover border" />
              ) : (
                <div className="w-11 h-11 rounded-lg bg-emerald-50 border border-emerald-200 grid place-items-center">
                  {isDigital ? <BookOpen className="w-4 h-4 text-emerald-700" /> : <Package className="w-4 h-4 text-emerald-700" />}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold truncate">{it.name}</div>
                {isDigital && it.author && <div className="text-[10px] text-emerald-700 truncate">✍️ {it.author}{it.family ? ` · ${it.family}` : ""}</div>}
                <div className="text-[10px] text-muted-foreground flex gap-2 flex-wrap">
                  {it.sku && <span>SKU: {it.sku}</span>}
                  <span>
                    {it.discountActive && it.discountPrice ? (
                      <>
                        <span className="line-through opacity-60">{it.price}</span>{" "}
                        <b className="text-red-600">{displayPrice}</b>
                      </>
                    ) : displayPrice}{" "}EGP
                  </span>
                  {!isDigital && (
                    <span className={it.qty > 0 ? "text-emerald-700" : "text-red-600 font-bold"}>
                      {it.qty > 0 ? `متوفر: ${it.qty}` : "نفدت الكمية"}
                    </span>
                  )}
                  {isDigital && it.pdfFull && <span className="text-emerald-700">📘 PDF</span>}
                  {isDigital && it.pdfSample && <span className="text-amber-600">🎁 عينة</span>}
                </div>
              </div>
              {onItemUpdate && (
                <button onClick={() => setEditingId(it.id)} aria-label="تعديل"
                  className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 grid place-items-center hover:bg-emerald-100">
                  <Settings className="w-3.5 h-3.5" />
                </button>
              )}
              {!isDigital && (
                <>
                  <button onClick={() => onQtyChange(it.id, -1)} aria-label="نقص"
                    className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900 grid place-items-center shadow-sm hover:opacity-90">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-9 text-center text-sm font-bold tabular-nums">{it.qty}</div>
                  <button onClick={() => onQtyChange(it.id, 1)} aria-label="زيادة"
                    className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 grid place-items-center shadow-sm hover:opacity-90">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-2">
        <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
          className="px-3 py-1.5 rounded-lg border-2 border-emerald-200 text-xs font-bold flex items-center gap-1 disabled:opacity-40">
          <ChevronRight className="w-3.5 h-3.5" /> السابق
        </button>
        <div className="flex gap-1">
          {pageWindow(page, totalPages).map((p, i) => (
            p === -1 ? (
              <span key={i} className="px-2 text-xs text-muted-foreground">…</span>
            ) : (
              <button key={i} onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-xs font-bold border-2 ${
                  p === page ? "bg-emerald-600 text-white border-emerald-600" : "bg-card border-emerald-200"
                }`}>{p + 1}</button>
            )
          ))}
        </div>
        <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
          className="px-3 py-1.5 rounded-lg border-2 border-emerald-200 text-xs font-bold flex items-center gap-1 disabled:opacity-40">
          التالي <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      {editingItem && onItemUpdate && (
        <EditItemModal
          item={editingItem}
          merchantType={merchantType}
          onClose={() => setEditingId(null)}
          onSave={(patch) => { onItemUpdate(editingItem.id, patch); setEditingId(null); }}
        />
      )}
    </div>
  );
}

function EditItemModal({
  item, merchantType, onClose, onSave,
}: {
  item: CatalogItem;
  merchantType: MerchantType;
  onClose: () => void;
  onSave: (patch: Partial<CatalogItem>) => void;
}) {
  const [name, setName] = useState(item.name);
  const [author, setAuthor] = useState(item.author ?? "");
  const [category, setCategory] = useState<string>(item.family ?? (merchantType === "publisher" ? BOOK_CATEGORIES[0] : ""));
  const [price, setPrice] = useState(String(item.price));
  const [discountActive, setDiscountActive] = useState(!!item.discountActive);
  const [discountPrice, setDiscountPrice] = useState(item.discountPrice ? String(item.discountPrice) : "");
  const [qty, setQty] = useState(String(item.qty));
  const [image, setImage] = useState(item.image);
  const [pdfFull, setPdfFull] = useState(item.pdfFull);
  const [pdfSample, setPdfSample] = useState(item.pdfSample);
  const [err, setErr] = useState<string | null>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const pdfFullRef = useRef<HTMLInputElement>(null);
  const pdfSampleRef = useRef<HTMLInputElement>(null);
  const isDigital = item.digital || merchantType === "publisher";

  const readAsDataURL = (file: File, cb: (v: string) => void) => {
    const r = new FileReader();
    r.onload = () => cb(String(r.result));
    r.readAsDataURL(file);
  };
  const readFileName = (file: File, cb: (v: string) => void) => cb(file.name);

  const save = () => {
    // Strict block: reject any forbidden content in title/author before persisting.
    if (isDigital && (isForbiddenContent(name) || isForbiddenContent(author))) {
      setErr("⛔ تم رفض المحتوى: مخالف لسياسة النشر (محتوى غير شرعي).");
      return;
    }
    const p = Number(price) || 0;
    const dp = discountPrice ? Number(discountPrice) : undefined;
    onSave({
      name: name.trim() || item.name,
      author: isDigital ? author.trim() : undefined,
      family: category || item.family,
      price: p,
      discountActive,
      discountPrice: dp,
      qty: isDigital ? item.qty : Math.max(0, Number(qty) || 0),
      image,
      digital: isDigital,
      pdfFull, pdfSample,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center px-4" onClick={onClose}>
      <div className="bg-card w-full max-w-md rounded-2xl border-2 border-emerald-400 shadow-xl p-5 space-y-3 max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()} dir="rtl">
        <div className="flex items-center justify-between">
          <div className="font-bold text-sm flex items-center gap-2">
            <Settings className="w-4 h-4 text-emerald-700" /> تعديل الصنف
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>

        <div>
          <label className="text-[11px] font-bold mb-1 block">{isDigital ? "عنوان الكتاب" : "الاسم"}</label>
          <input value={name} onChange={(e) => { setName(e.target.value); setErr(null); }}
            className="w-full px-3 py-2 rounded-lg border-2 border-emerald-200 focus:border-emerald-500 outline-none text-sm" />
        </div>

        {isDigital && (
          <>
            <div>
              <label className="text-[11px] font-bold mb-1 block">اسم المؤلف</label>
              <input value={author} onChange={(e) => { setAuthor(e.target.value); setErr(null); }}
                placeholder="مثال: نجيب محفوظ"
                className="w-full px-3 py-2 rounded-lg border-2 border-emerald-200 focus:border-emerald-500 outline-none text-sm" />
            </div>
            <div>
              <label className="text-[11px] font-bold mb-1 block">القسم / التصنيف</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border-2 border-emerald-200 focus:border-emerald-500 outline-none text-sm bg-white">
                {BOOK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {err && (
              <div className="p-2 rounded-lg bg-red-50 border-2 border-red-300 text-[11px] font-bold text-red-700 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> {err}
              </div>
            )}
          </>
        )}


        <div>
          <label className="text-[11px] font-bold mb-1 block">صورة الصنف</label>
          <div className="flex items-center gap-2">
            {image ? (
              <img src={image} alt="" className="w-14 h-14 rounded-lg object-cover border" />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-emerald-50 border border-emerald-200 grid place-items-center">
                <Package className="w-5 h-5 text-emerald-700" />
              </div>
            )}
            <input ref={imgRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) readAsDataURL(f, setImage); }} />
            <button onClick={() => imgRef.current?.click()}
              className="px-3 py-2 rounded-lg border-2 border-emerald-300 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-50">
              <Upload className="w-3.5 h-3.5" /> رفع صورة
            </button>
            {image && (
              <button onClick={() => setImage(undefined)} className="text-[11px] text-red-600 font-bold">إزالة</button>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[11px] font-bold mb-1 block">السعر الحالي (EGP)</label>
            <input value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              className="w-full px-3 py-2 rounded-lg border-2 border-emerald-200 focus:border-emerald-500 outline-none text-sm" />
          </div>
          {!isDigital && (
            <div className="flex-1">
              <label className="text-[11px] font-bold mb-1 block">الكمية</label>
              <input value={qty} onChange={(e) => setQty(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                className={`w-full px-3 py-2 rounded-lg border-2 outline-none text-sm ${
                  Number(qty) === 0 ? "border-red-400 focus:border-red-500 bg-red-50" : "border-emerald-200 focus:border-emerald-500"
                }`} />
              {Number(qty) === 0 && (
                <div className="text-[10px] text-red-600 font-bold mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> سيظهر للعميل: نفذت الكمية
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-3 rounded-lg border-2 border-amber-200 bg-amber-50/60 space-y-2">
          <label className="flex items-center gap-2 text-xs font-bold text-amber-900">
            <input type="checkbox" checked={discountActive} onChange={(e) => setDiscountActive(e.target.checked)} />
            تفعيل سعر خصم ترويجي
          </label>
          {discountActive && (
            <input value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric" placeholder="سعر الخصم"
              className="w-full px-3 py-2 rounded-lg border-2 border-amber-300 focus:border-amber-500 outline-none text-sm" />
          )}
        </div>

        {isDigital && (
          <div className="space-y-2 p-3 rounded-lg border-2 border-emerald-200 bg-emerald-50/40">
            <div className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" /> ملفات الكتاب الرقمي
            </div>
            <div className="flex items-center gap-2">
              <input ref={pdfFullRef} type="file" accept="application/pdf" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) readFileName(f, setPdfFull); }} />
              <button onClick={() => pdfFullRef.current?.click()}
                className="flex-1 px-3 py-2 rounded-lg border-2 border-emerald-300 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-50">
                <FileText className="w-3.5 h-3.5" /> {pdfFull ?? "رفع الكتاب الكامل (PDF)"}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input ref={pdfSampleRef} type="file" accept="application/pdf" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) readFileName(f, setPdfSample); }} />
              <button onClick={() => pdfSampleRef.current?.click()}
                className="flex-1 px-3 py-2 rounded-lg border-2 border-amber-300 text-xs font-bold flex items-center gap-1.5 hover:bg-amber-50">
                <FileText className="w-3.5 h-3.5" /> {pdfSample ?? "رفع العينة المجانية (PDF)"}
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border-2 border-emerald-200 text-xs font-bold hover:bg-emerald-50">
            إلغاء
          </button>
          <button onClick={save} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700">
            حفظ التغييرات
          </button>
        </div>
      </div>
    </div>
  );
}

function pageWindow(current: number, total: number): number[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  const out: number[] = [0];
  const start = Math.max(1, current - 1);
  const end = Math.min(total - 2, current + 1);
  if (start > 1) out.push(-1);
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 2) out.push(-1);
  out.push(total - 1);
  return out;
}
