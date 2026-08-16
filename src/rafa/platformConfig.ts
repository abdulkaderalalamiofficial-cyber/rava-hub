import { useEffect, useState } from "react";

// ============================================================
// Platform-wide control center (Admin ⇄ Customer, live sync)
// Persisted in localStorage. Multiple consumers stay in sync via
// a custom "rava:platform-config-changed" window event.
// ============================================================

export type PaymentGatewayId =
  | "cod"           // Cash on Delivery
  | "wallet"        // Rava internal wallet
  | "visa"          // Visa / Mastercard (Stripe)
  | "vodafone_cash"
  | "etisalat_cash"
  | "orange_money"
  | "we_pay"
  | "instapay"
  | "meeza"
  | "fawry"
  | "aman"
  | "masary"
  | "paddle";

export type PaymentGateway = {
  id: PaymentGatewayId;
  nameAr: string;
  nameEn: string;
  emoji: string;
  enabled: boolean;
  feePct: number;          // % taken by the gateway
  minEgp: number;          // minimum allowed order
  maxEgp: number;          // 0 = no cap
  payUrl?: string;         // e.g. InstaPay / payment link opened at checkout
  payNumber?: string;      // e.g. Vodafone / Orange wallet number or bank account
  payNote?: string;        // short instruction shown to the customer
};


export type FeatureFlagId =
  | "rides"          // Ride-hailing (car/tuktuk/moto passenger)
  | "delivery"       // Courier & food delivery
  | "medical"        // Clinics / labs / salons
  | "heavy"          // Trucks / dababa / winsh
  | "spare"          // Spare parts marketplace
  | "mall"           // Rava commercial mall
  | "sos"            // Emergency SOS button
  | "chat"           // In-app chat
  | "scheduling"     // Scheduled orders
  | "wallet_topup";  // Wallet top-up

export type FeatureFlag = {
  id: FeatureFlagId;
  nameAr: string;
  nameEn: string;
  emoji: string;
  enabled: boolean;
};

export type DynamicPricing = {
  enabled: boolean;
  surgeMultiplier: number;   // 1.0 .. 3.0
  nightSurchargePct: number; // 0..100 (added between 00:00-05:00)
  peakSurchargePct: number;  // 0..100 (added 17:00-20:00)
  loyaltyCommissionCut: number; // % subtracted from top-tier captain commission
};

export type PromoBanner = {
  id: string;
  titleAr: string;
  bodyAr: string;
  enabled: boolean;
  tone: "gold" | "royal" | "info";
};

export type PlatformConfig = {
  gateways: PaymentGateway[];
  features: FeatureFlag[];
  pricing: DynamicPricing;
  banners: PromoBanner[];
};

const CONFIG_KEY = "rava_platform_config_v1";
const EVENT = "rava:platform-config-changed";

export const DEFAULT_CONFIG: PlatformConfig = {
  gateways: [
    { id: "cod",          nameAr: "الدفع عند الاستلام", nameEn: "Cash on Delivery",  emoji: "💵", enabled: true,  feePct: 0,   minEgp: 0,   maxEgp: 0    },
    { id: "wallet",       nameAr: "محفظة رافا",         nameEn: "Rava Wallet",       emoji: "🪙", enabled: true,  feePct: 0,   minEgp: 0,   maxEgp: 0    },
    { id: "visa",         nameAr: "فيزا / ماستركارد",    nameEn: "Visa / Mastercard", emoji: "💳", enabled: false, feePct: 2.9, minEgp: 10,  maxEgp: 0    },
    { id: "vodafone_cash",nameAr: "فودافون كاش",         nameEn: "Vodafone Cash",     emoji: "📱", enabled: false, feePct: 1.5, minEgp: 5,   maxEgp: 3000 },
    { id: "etisalat_cash",nameAr: "اتصالات كاش",         nameEn: "Etisalat Cash",     emoji: "📱", enabled: false, feePct: 1.5, minEgp: 5,   maxEgp: 3000 },
    { id: "orange_money", nameAr: "أورانج موني",          nameEn: "Orange Money",      emoji: "📱", enabled: false, feePct: 1.5, minEgp: 5,   maxEgp: 3000 },
    { id: "we_pay",       nameAr: "WE Pay",              nameEn: "WE Pay",            emoji: "📱", enabled: false, feePct: 1.5, minEgp: 5,   maxEgp: 3000 },
    { id: "instapay",     nameAr: "إنستا باي",           nameEn: "InstaPay",          emoji: "🏦", enabled: false, feePct: 0.5, minEgp: 10,  maxEgp: 0    },
    { id: "meeza",        nameAr: "ميزة",                nameEn: "Meeza",             emoji: "🏦", enabled: false, feePct: 1.0, minEgp: 5,   maxEgp: 0    },
    { id: "fawry",        nameAr: "فوري",                nameEn: "Fawry",             emoji: "🧾", enabled: false, feePct: 1.0, minEgp: 5,   maxEgp: 5000 },
    { id: "aman",         nameAr: "أمان",                nameEn: "Aman",              emoji: "🧾", enabled: false, feePct: 1.0, minEgp: 5,   maxEgp: 5000 },
    { id: "masary",       nameAr: "مصاري",               nameEn: "Masary",            emoji: "🧾", enabled: false, feePct: 1.0, minEgp: 5,   maxEgp: 5000 },
    { id: "paddle",       nameAr: "Paddle (اشتراكات)",   nameEn: "Paddle",            emoji: "🌍", enabled: false, feePct: 5.0, minEgp: 20,  maxEgp: 0    },
  ],
  features: [
    { id: "rides",        nameAr: "رحلات الركاب",           nameEn: "Ride-hailing",       emoji: "🚗", enabled: true },
    { id: "delivery",     nameAr: "التوصيل السريع",         nameEn: "Express delivery",   emoji: "🛵", enabled: true },
    { id: "medical",      nameAr: "الخدمات الطبية والتجميلية", nameEn: "Medical & beauty",  emoji: "🩺", enabled: true },
    { id: "heavy",        nameAr: "الشحن الثقيل والونش",     nameEn: "Heavy transport",    emoji: "🚛", enabled: true },
    { id: "spare",        nameAr: "قطع الغيار",             nameEn: "Spare parts",        emoji: "🔧", enabled: true },
    { id: "mall",         nameAr: "مول رافا التجاري",       nameEn: "Rava Mall",          emoji: "🏬", enabled: true },
    { id: "sos",          nameAr: "زر الطوارئ (SOS)",       nameEn: "SOS button",         emoji: "🆘", enabled: true },
    { id: "chat",         nameAr: "الشات الداخلي",           nameEn: "In-app chat",        emoji: "💬", enabled: true },
    { id: "scheduling",   nameAr: "جدولة الطلبات",           nameEn: "Scheduling",         emoji: "🗓️", enabled: true },
    { id: "wallet_topup", nameAr: "شحن المحفظة",             nameEn: "Wallet top-up",      emoji: "➕", enabled: true },
  ],
  pricing: {
    enabled: false,
    surgeMultiplier: 1.0,
    nightSurchargePct: 20,
    peakSurchargePct: 15,
    loyaltyCommissionCut: 5,
  },
  banners: [],
};

function readConfig(): PlatformConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw) as Partial<PlatformConfig>;
    // Merge with defaults so new fields added later still surface.
    const mergedGateways = DEFAULT_CONFIG.gateways.map((g) => {
      const found = parsed.gateways?.find((x) => x.id === g.id);
      return found ? { ...g, ...found } : g;
    });
    const mergedFeatures = DEFAULT_CONFIG.features.map((f) => {
      const found = parsed.features?.find((x) => x.id === f.id);
      return found ? { ...f, ...found } : f;
    });
    return {
      gateways: mergedGateways,
      features: mergedFeatures,
      pricing: { ...DEFAULT_CONFIG.pricing, ...(parsed.pricing ?? {}) },
      banners: parsed.banners ?? [],
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

function writeConfig(cfg: PlatformConfig) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function usePlatformConfig() {
  const [cfg, setCfg] = useState<PlatformConfig>(() => (typeof window !== "undefined" ? readConfig() : DEFAULT_CONFIG));

  useEffect(() => {
    // hydrate after mount (SSR safety)
    setCfg(readConfig());
    const handler = () => setCfg(readConfig());
    window.addEventListener(EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const update = (patch: Partial<PlatformConfig> | ((prev: PlatformConfig) => PlatformConfig)) => {
    const next = typeof patch === "function" ? patch(readConfig()) : { ...readConfig(), ...patch };
    writeConfig(next);
    setCfg(next);
  };

  const toggleGateway = (id: PaymentGatewayId) =>
    update((prev) => ({ ...prev, gateways: prev.gateways.map((g) => g.id === id ? { ...g, enabled: !g.enabled } : g) }));

  const patchGateway = (id: PaymentGatewayId, patch: Partial<PaymentGateway>) =>
    update((prev) => ({ ...prev, gateways: prev.gateways.map((g) => g.id === id ? { ...g, ...patch } : g) }));

  const toggleFeature = (id: FeatureFlagId) =>
    update((prev) => ({ ...prev, features: prev.features.map((f) => f.id === id ? { ...f, enabled: !f.enabled } : f) }));

  const patchPricing = (patch: Partial<DynamicPricing>) =>
    update((prev) => ({ ...prev, pricing: { ...prev.pricing, ...patch } }));

  const addBanner = (b: Omit<PromoBanner, "id">) =>
    update((prev) => ({ ...prev, banners: [...prev.banners, { ...b, id: `bn_${Date.now()}` }] }));

  const patchBanner = (id: string, patch: Partial<PromoBanner>) =>
    update((prev) => ({ ...prev, banners: prev.banners.map((b) => b.id === id ? { ...b, ...patch } : b) }));

  const removeBanner = (id: string) =>
    update((prev) => ({ ...prev, banners: prev.banners.filter((b) => b.id !== id) }));

  const resetAll = () => { writeConfig(DEFAULT_CONFIG); setCfg(DEFAULT_CONFIG); };

  return { cfg, update, toggleGateway, patchGateway, toggleFeature, patchPricing, addBanner, patchBanner, removeBanner, resetAll };
}

// Helper for consumers that only need to read
export function useEnabledGateways() {
  const { cfg } = usePlatformConfig();
  return cfg.gateways.filter((g) => g.enabled);
}

export function useFeatureEnabled(id: FeatureFlagId) {
  const { cfg } = usePlatformConfig();
  return cfg.features.find((f) => f.id === id)?.enabled ?? true;
}

// Pure calculator (used by admin preview & customer checkout)
export function applyDynamicPricing(base: number, pricing: DynamicPricing, now = new Date()): { total: number; breakdown: { label: string; amount: number }[] } {
  if (!pricing.enabled) return { total: base, breakdown: [{ label: "السعر الأساسي", amount: base }] };
  const breakdown: { label: string; amount: number }[] = [{ label: "السعر الأساسي", amount: base }];
  let total = base;
  if (pricing.surgeMultiplier > 1.0) {
    const extra = base * (pricing.surgeMultiplier - 1);
    total += extra;
    breakdown.push({ label: `ذروة الطلب ×${pricing.surgeMultiplier.toFixed(1)}`, amount: extra });
  }
  const h = now.getHours();
  if (h >= 0 && h < 5 && pricing.nightSurchargePct > 0) {
    const extra = base * (pricing.nightSurchargePct / 100);
    total += extra;
    breakdown.push({ label: `تعرفة ليلية +${pricing.nightSurchargePct}%`, amount: extra });
  }
  if (h >= 17 && h < 20 && pricing.peakSurchargePct > 0) {
    const extra = base * (pricing.peakSurchargePct / 100);
    total += extra;
    breakdown.push({ label: `ساعات الذروة +${pricing.peakSurchargePct}%`, amount: extra });
  }
  return { total: Math.round(total), breakdown };
}
