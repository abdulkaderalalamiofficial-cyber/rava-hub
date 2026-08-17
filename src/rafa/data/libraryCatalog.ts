// RAVA Digital Library (Open Zone) — shared catalog data.
import { BOOKS } from "./booksSeed";

export const EXTRA_BOOKS: { title: string; author: string; category: string; price: number }[] = [
  { title: "حكايات ما قبل النوم", author: "سميرة عبد الله", category: "كتب أطفال", price: 45 },
  { title: "مغامرات نور والقمر", author: "أحمد سليم", category: "كتب أطفال", price: 50 },
  { title: "الأرنب الذكي", author: "منى فؤاد", category: "كتب أطفال", price: 40 },
  { title: "قصة الحضارة", author: "ويل ديورانت", category: "تاريخ وسير", price: 380 },
  { title: "مصر القديمة", author: "سليم حسن", category: "تاريخ وسير", price: 290 },
  { title: "سيرة ابن هشام", author: "ابن هشام", category: "تاريخ وسير", price: 210 },
  { title: "تاريخ موجز للزمن", author: "ستيفن هوكينج", category: "علوم", price: 185 },
  { title: "الكون في قشرة جوز", author: "ستيفن هوكينج", category: "علوم", price: 195 },
  { title: "أصل الأنواع", author: "تشارلز داروين", category: "علوم", price: 240 },
];

export const LIBRARY_CATEGORIES: { id: string; icon: string }[] = [
  { id: "روايات", icon: "📖" },
  { id: "قصص", icon: "📚" },
  { id: "كتب دينية", icon: "🕌" },
  { id: "كتب تعليمية", icon: "🎓" },
  { id: "ملخصات كتب", icon: "📝" },
  { id: "كتب أطفال", icon: "🧒" },
  { id: "تاريخ وسير", icon: "🏛️" },
  { id: "علوم", icon: "🔬" },
];

export const ALL_BOOKS: { title: string; author: string; category: string; price: number }[] = [
  ...BOOKS,
  ...EXTRA_BOOKS,
];

export const booksInCategory = (category: string) => ALL_BOOKS.filter((b) => b.category === category);
