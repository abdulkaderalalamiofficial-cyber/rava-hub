// Real Arabic books catalog (data compatible with Google Books listings).
// Categories: روايات · قصص · كتب دينية · كتب تعليمية · ملخصات كتب

export const BOOK_CATEGORIES = [
  "روايات",
  "قصص",
  "كتب دينية",
  "كتب تعليمية",
  "ملخصات كتب",
] as const;

export type BookCategory = (typeof BOOK_CATEGORIES)[number];

export type BookSeed = {
  title: string;
  author: string;
  category: BookCategory;
  price: number;
};

export const BOOKS: BookSeed[] = [
  // روايات
  { title: "ثلاثية غرناطة", author: "رضوى عاشور", category: "روايات", price: 180 },
  { title: "عمارة يعقوبيان", author: "علاء الأسواني", category: "روايات", price: 150 },
  { title: "ذاكرة الجسد", author: "أحلام مستغانمي", category: "روايات", price: 165 },
  { title: "موسم الهجرة إلى الشمال", author: "الطيب صالح", category: "روايات", price: 120 },
  { title: "رجال في الشمس", author: "غسان كنفاني", category: "روايات", price: 95 },
  { title: "ساق البامبو", author: "سعود السنعوسي", category: "روايات", price: 170 },
  { title: "أولاد حارتنا", author: "نجيب محفوظ", category: "روايات", price: 140 },
  { title: "الحرب والسلم", author: "ليو تولستوي", category: "روايات", price: 260 },

  // قصص
  { title: "أرض النفاق", author: "يوسف السباعي", category: "قصص", price: 90 },
  { title: "حكايات حارتنا", author: "نجيب محفوظ", category: "قصص", price: 110 },
  { title: "قنديل أم هاشم", author: "يحيى حقي", category: "قصص", price: 75 },
  { title: "أرخص ليالي", author: "يوسف إدريس", category: "قصص", price: 85 },
  { title: "زقاق المدق", author: "نجيب محفوظ", category: "قصص", price: 130 },

  // كتب دينية
  { title: "في ظلال القرآن", author: "سيد قطب", category: "كتب دينية", price: 320 },
  { title: "الرحيق المختوم", author: "صفي الرحمن المباركفوري", category: "كتب دينية", price: 145 },
  { title: "لا تحزن", author: "عائض القرني", category: "كتب دينية", price: 110 },
  { title: "فقه السنة", author: "السيد سابق", category: "كتب دينية", price: 220 },
  { title: "زاد المعاد", author: "ابن قيم الجوزية", category: "كتب دينية", price: 260 },

  // كتب تعليمية
  { title: "أساسيات علم النفس", author: "د. عبد الرحمن العيسوي", category: "كتب تعليمية", price: 155 },
  { title: "مبادئ الاقتصاد", author: "جريجوري مانكيو", category: "كتب تعليمية", price: 230 },
  { title: "تعلم البرمجة بلغة بايثون", author: "علي أبو زيد", category: "كتب تعليمية", price: 175 },
  { title: "أساسيات الرياضيات", author: "د. سامي عوض", category: "كتب تعليمية", price: 140 },
  { title: "تعلم اللغة الإنجليزية", author: "ريموند مورفي", category: "كتب تعليمية", price: 195 },

  // ملخصات كتب
  { title: "ملخص: العادات السبع", author: "ستيفن كوفي", category: "ملخصات كتب", price: 60 },
  { title: "ملخص: أبل - سيرة ستيف جوبز", author: "والتر إيزاكسون", category: "ملخصات كتب", price: 55 },
  { title: "ملخص: فن اللامبالاة", author: "مارك مانسون", category: "ملخصات كتب", price: 50 },
  { title: "ملخص: قوة العادات", author: "تشارلز دويج", category: "ملخصات كتب", price: 55 },
  { title: "ملخص: التفكير السريع والبطيء", author: "دانيال كانمان", category: "ملخصات كتب", price: 65 },
];
