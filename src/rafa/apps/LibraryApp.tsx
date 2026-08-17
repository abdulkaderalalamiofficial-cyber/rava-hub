import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Search } from "lucide-react";
import { ALL_BOOKS, LIBRARY_CATEGORIES, booksInCategory } from "../data/libraryCatalog";

export function LibraryApp() {
  const [open, setOpen] = useState<string | null>(null);
  const [q, setQ] = useState("");

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
          <Link to="/customer" className="p-2 rounded-xl border hover:border-gold transition-colors" aria-label="رجوع">
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

      <div>
        <div className="text-xs font-bold mb-2">{open ?? "كل الكتب"} · {books.length} كتاب</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {books.map((b) => (
            <div key={`${b.category}-${b.title}`} className="flex items-center gap-2 p-2 rounded-xl border bg-card min-w-0">
              <div className="w-9 h-12 rounded-md bg-gradient-to-br from-gold/30 to-gold/5 grid place-items-center text-lg shrink-0">📕</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold truncate">{b.title}</div>
                <div className="text-[10px] text-muted-foreground truncate">{b.author}</div>
              </div>
              <div className="shrink-0 text-[11px] font-bold text-gold">{b.price} ج</div>
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
