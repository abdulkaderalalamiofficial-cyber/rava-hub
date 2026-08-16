/**
 * RAVA occasion engine — infers customer occasions & interests silently
 * (no annoying questionnaires). Uses local usage signals + the calendar.
 */

export type Occasion = {
  id: string;
  ar: string;
  en: string;
  voiceAr: string;
};

const KEY = "rafa.profile.v1";

export type SilentProfile = {
  firstSeen: string;          // ISO date of first app open
  visits: number;
  lastGreeted: string | null; // occasion id + date already greeted
  categories: Record<string, number>; // inferred interests by usage
};

export function loadProfile(): SilentProfile {
  if (typeof window === "undefined") {
    return { firstSeen: new Date().toISOString(), visits: 0, lastGreeted: null, categories: {} };
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as SilentProfile;
  } catch { /* ignore */ }
  const fresh: SilentProfile = { firstSeen: new Date().toISOString(), visits: 0, lastGreeted: null, categories: {} };
  window.localStorage.setItem(KEY, JSON.stringify(fresh));
  return fresh;
}

export function saveProfile(p: SilentProfile) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* ignore */ }
  schedulePush(p);
}

/* ------------------------------------------------------------------ *
 * Cloud sync — the local copy stays as an offline cache, the database *
 * is the source of truth once the user is signed in.                  *
 * ------------------------------------------------------------------ */

let pushTimer: number | null = null;

function schedulePush(p: SilentProfile) {
  if (typeof window === "undefined") return;
  if (pushTimer) window.clearTimeout(pushTimer);
  pushTimer = window.setTimeout(() => { void pushProfile(p); }, 1200);
}

async function pushProfile(p: SilentProfile) {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase.auth.getSession();
    if (!data.session) return; // guest → local only
    const { savePreferences } = await import("@/lib/preferences.functions");
    await savePreferences({ data: p });
  } catch { /* offline / signed out — keep local copy */ }
}

function merge(local: SilentProfile, remote: SilentProfile): SilentProfile {
  const categories: Record<string, number> = { ...remote.categories };
  for (const [k, v] of Object.entries(local.categories)) {
    categories[k] = Math.max(categories[k] ?? 0, v);
  }
  return {
    firstSeen: [local.firstSeen, remote.firstSeen].sort()[0],
    visits: Math.max(local.visits, remote.visits),
    lastGreeted: (local.lastGreeted ?? "") > (remote.lastGreeted ?? "") ? local.lastGreeted : remote.lastGreeted,
    categories,
  };
}

/** Pulls the server profile, merges it with the local cache and pushes back. */
export async function syncProfile(): Promise<SilentProfile> {
  const local = loadProfile();
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase.auth.getSession();
    if (!data.session) return local;
    const { getPreferences, savePreferences } = await import("@/lib/preferences.functions");
    const remote = await getPreferences();
    const merged = remote ? merge(local, remote as SilentProfile) : local;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(KEY, JSON.stringify(merged));
    }
    await savePreferences({ data: merged });
    return merged;
  } catch {
    return local;
  }
}


/** Record an interest silently (called when the user browses/orders something). */
export function noteInterest(category: string) {
  const p = loadProfile();
  p.categories[category] = (p.categories[category] ?? 0) + 1;
  saveProfile(p);
}

export function topInterests(limit = 3): string[] {
  const p = loadProfile();
  return Object.entries(p.categories).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([k]) => k);
}

/** Fixed-date occasions (Gregorian). Moving Hijri feasts are approximated per year below. */
const FIXED: { md: string; o: Occasion }[] = [
  { md: "01-01", o: { id: "newyear", ar: "سنة جديدة سعيدة يا فندم 🎉", en: "Happy New Year!", voiceAr: "كل سنة وانت طيب يا كبير، سنة حلوة عليك وعلى اللي بتحبهم" } },
  { md: "01-07", o: { id: "xmas", ar: "كل سنة وانت طيب بعيد الميلاد المجيد 🎄", en: "Merry Christmas!", voiceAr: "كل سنة وانت طيب، عيد ميلاد مجيد وسعيد عليك" } },
  { md: "01-25", o: { id: "jan25", ar: "تحيا مصر · عيد الشرطة 🇪🇬", en: "Egypt National Police Day", voiceAr: "تحيا مصر يا بطل، يوم جميل على كل المصريين" } },
  { md: "03-21", o: { id: "mother", ar: "كل سنة وكل الأمهات بخير 🌷", en: "Happy Mother's Day", voiceAr: "كل سنة ووالدتك طيبة، متنساش تجيبلها هدية النهاردة" } },
  { md: "04-25", o: { id: "sinai", ar: "عيد تحرير سيناء 🇪🇬", en: "Sinai Liberation Day", voiceAr: "كل سنة ومصر بخير، عيد تحرير سيناء" } },
  { md: "07-23", o: { id: "jul23", ar: "عيد ثورة ٢٣ يوليو 🇪🇬", en: "July 23 Revolution Day", voiceAr: "كل سنة ومصر بخير يا معلم" } },
  { md: "10-06", o: { id: "oct6", ar: "كل سنة وانت طيب بذكرى نصر أكتوبر 🇪🇬", en: "October Victory Day", voiceAr: "كل سنة وانت طيب، ذكرى نصر أكتوبر العظيم" } },
];

/** Approximate Hijri feast dates (Gregorian) — updated per year. */
const HIJRI: Record<string, { md: string; o: Occasion }[]> = {
  "2026": [
    { md: "02-18", o: { id: "ramadan", ar: "رمضان كريم 🌙", en: "Ramadan Kareem", voiceAr: "رمضان كريم يا حبيبي، ربنا يتقبل منك ويكتبلك الخير" } },
    { md: "03-20", o: { id: "fitr", ar: "عيد فطر مبارك 🎊", en: "Eid al-Fitr Mubarak", voiceAr: "كل سنة وانت طيب، عيد سعيد وعقبال ميت سنة" } },
    { md: "05-27", o: { id: "adha", ar: "عيد أضحى مبارك 🐑", en: "Eid al-Adha Mubarak", voiceAr: "كل سنة وانت طيب، عيد أضحى مبارك وربنا يتقبل" } },
  ],
  "2027": [
    { md: "02-07", o: { id: "ramadan", ar: "رمضان كريم 🌙", en: "Ramadan Kareem", voiceAr: "رمضان كريم يا حبيبي، ربنا يتقبل منك" } },
    { md: "03-09", o: { id: "fitr", ar: "عيد فطر مبارك 🎊", en: "Eid al-Fitr Mubarak", voiceAr: "كل سنة وانت طيب، عيد سعيد" } },
    { md: "05-16", o: { id: "adha", ar: "عيد أضحى مبارك 🐑", en: "Eid al-Adha Mubarak", voiceAr: "كل سنة وانت طيب، عيد أضحى مبارك" } },
  ],
};

function md(d: Date) {
  return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Returns today's occasion, or a personal milestone inferred silently. */
export function detectOccasion(now = new Date()): Occasion | null {
  const key = md(now);
  const year = String(now.getFullYear());
  const hit =
    FIXED.find((f) => f.md === key)?.o ??
    (HIJRI[year] ?? []).find((f) => f.md === key)?.o ??
    null;
  if (hit) return hit;

  // Personal milestone: anniversary of first use (silently inferred, never asked).
  const p = loadProfile();
  const first = new Date(p.firstSeen);
  if (!Number.isNaN(first.getTime()) && md(first) === key && first.getFullYear() < now.getFullYear()) {
    return {
      id: "anniversary",
      ar: "بقالك سنة معانا في رافا — شكراً لثقتك 💚",
      en: "One year with RAVA — thank you!",
      voiceAr: "بقالك سنة كاملة معانا يا كبير، احنا مبسوطين بيك والله",
    };
  }
  return null;
}

/** Ensures one greeting per occasion per day. */
export function shouldGreet(o: Occasion, now = new Date()): boolean {
  const p = loadProfile();
  const stamp = `${o.id}:${now.toISOString().slice(0, 10)}`;
  if (p.lastGreeted === stamp) return false;
  p.lastGreeted = stamp;
  p.visits += 1;
  saveProfile(p);
  return true;
}
