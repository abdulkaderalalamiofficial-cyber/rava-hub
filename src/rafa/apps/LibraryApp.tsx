import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Search, Link2, Check, Share2, X } from "lucide-react";
import { ALL_BOOKS, LIBRARY_CATEGORIES, booksInCategory } from "../data/libraryCatalog";

type Book = { title: string; author: string; category: string; price: number };

export const bookSlug = (b: Book) =>
  `${b.category}-${b.title}`.trim().replace(/\s+/g, "-").replace(/[^\p{L}\p{N}-]/gu, "");

export function promoLink(b: Book) {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://rava-hub.lovable.app";
  const p = new URLSearchParams({ book: bookSlug(b), cat: b.category, ref: "customer-promo" });
  return `${origin}/library?${p.toString()}`;
}

export function LibraryApp() {
  const [open, setOpen] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState<Book | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (b: Book) => {
    const url = promoLink(b);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      el.remove();
    }
    setCopied(bookSlug(b));
    setTimeout(() => setCopied(null), 2000);
  };

  const books = useMemo(() => {
    const base = open ? booksInCategory(open) : ALL_BOOKS;
    const term = q.trim();
    if (!term) return base;
    return base.filter((b) => b.title.includes(term) || b.author.includes(term));
  }, [open, q]);

  return (
    <div dir="rtl" className="space-y-5">
      <div className="p-5 rounded-2xl border border-gold/40 bg-card shadow-card relative overflow-hidden">
        <div className="absolute -end-6 -top-6 text-8xl opacity-10">📚</div>
        <div className="relative flex items-center gap-3 flex-wrap">
          <Link to="/app/customer" className="p-2 rounded-xl border hover:border-gold transition-colors" aria-label="رجوع">
            <ArrowRight className="w-4 h-4" />
          </Link>
          <div className="text-4xl">📚</div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold leading-tight">مكتبة RAVA الرقمية</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Open Zone — متاحة عالمياً بدون موقع أو توصيل · {ALL_BOOKS.length} كتاب في {LIBRARY_CATEGORIES.length} أقسام
            </p>
          </div>
          <span className="text-[10px] px-2 py-1 rounded-full font-bold bg-success/20 text-success">مفتوحة</span>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث عن كتاب أو مؤلف..."
          dir="rtl"
          className="w-full ps-9 pe-3 py-3 rounded-2xl bg-card border border-gold/30 focus:border-gold outline-none text-sm shadow-card"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <button
          onClick={() => setOpen(null)}
          className={`p-3 rounded-xl border bg-card text-start transition-all ${open === null ? "border-gold" : "hover:border-gold"}`}>
          <div className="text-2xl mb-1">🗂️</div>
          <div className="text-xs font-bold leading-tight">كل الأقسام</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">{ALL_BOOKS.length} كتاب</div>
        </button>
        {LIBRARY_CATEGORIES.map((c) => (
          <button key={c.id} onClick={() => setOpen(c.id)}
            className={`group p-3 rounded-xl border bg-card text-start relative overflow-hidden transition-all ${open === c.id ? "border-gold" : "hover:border-gold"}`}>
            <div className="absolute -end-4 -top-4 text-5xl opacity-10 group-hover:opacity-20 transition-opacity">{c.icon}</div>
            <div className="text-2xl mb-1">{c.icon}</div>
            <div className="text-xs font-bold leading-tight truncate">{c.id}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{booksInCategory(c.id).length} كتاب</div>
          </button>
        ))}
      </div>

      {detail && (
        <div className="p-4 rounded-2xl border-2 border-gold/50 bg-card shadow-card space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-14 h-20 rounded-lg bg-gradient-to-br from-gold/30 to-gold/5 grid place-items-center text-2xl shrink-0">📕</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold">{detail.title}</div>
              <div className="text-[11px] text-muted-foreground">{detail.author} · {detail.category}</div>
              <div className="text-sm font-bold text-gold mt-1">{detail.price} ج.م</div>
            </div>
            <button onClick={() => setDetail(null)} className="p-1.5 rounded-lg border hover:border-gold" aria-label="إغلاق">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-bold flex items-center gap-1.5"><Share2 className="w-3.5 h-3.5 text-gold" />رابط ترويجي للمشاركة</div>
            <div className="flex items-center gap-2">
              <input readOnly value={promoLink(detail)} onFocus={(e) => e.currentTarget.select()} dir="ltr"
                className="flex-1 min-w-0 px-3 py-2 rounded-xl border bg-background text-[10px] font-mono" />
              <button onClick={() => copy(detail)}
                className="shrink-0 px-3 py-2 rounded-xl bg-gradient-royal text-primary-foreground text-[11px] font-bold flex items-center gap-1.5">
                {copied === bookSlug(detail) ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
                {copied === bookSlug(detail) ? "تم النسخ" : "نسخ الرابط"}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground">شارك الرابط مع أي شخص — سيفتح المكتبة مباشرة على هذا الكتاب.</p>
          </div>
        </div>
      )}

      <div>
        <div className="text-xs font-bold mb-2">{open ?? "كل الكتب"} · {books.length} كتاب</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {books.map((b) => (
            <div key={`${b.category}-${b.title}`}
              className={`flex items-center gap-2 p-2 rounded-xl border bg-card min-w-0 transition-colors ${detail && bookSlug(detail) === bookSlug(b) ? "border-gold" : ""}`}>
              <button onClick={() => setDetail(b)} className="flex items-center gap-2 flex-1 min-w-0 text-start">
                <div className="w-9 h-12 rounded-md bg-gradient-to-br from-gold/30 to-gold/5 grid place-items-center text-lg shrink-0">📕</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold truncate">{b.title}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{b.author}</div>
                </div>
              </button>
              <div className="shrink-0 text-[11px] font-bold text-gold">{b.price} ج</div>
              <button onClick={() => copy(b)} title="نسخ رابط ترويجي"
                className="shrink-0 p-1.5 rounded-lg border hover:border-gold text-muted-foreground hover:text-gold">
                {copied === bookSlug(b) ? <Check className="w-3.5 h-3.5 text-success" /> : <Link2 className="w-3.5 h-3.5" />}
              </button>
              <button className="shrink-0 text-[10px] px-2 py-1 rounded-lg bg-gold text-gold-foreground font-bold">شراء</button>
            </div>
          ))}
          {books.length === 0 && (
            <div className="text-xs text-muted-foreground p-4 text-center border rounded-xl">لا توجد نتائج مطابقة</div>
          )}
        </div>
      </div>
    </div>
  );
}
