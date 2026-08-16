// ============================================================
// Geo-zoning & service access module
// ------------------------------------------------------------
// Two access modes:
//  • "open"  → available everywhere in the country (no regional gate)
//  • "zoned" → only providers inside the customer's governorate/center
//
// Business rules:
//  • Library / stationery  → OPEN ZONE
//  • Rides / trips         → OPEN ZONE
//  • Restaurants (food)    → ZONE-SPECIFIC
//  • Shops / merchants     → ZONE-SPECIFIC
//  • Motorcycle & tricycle delivery are hard-capped inside their zone.
// ============================================================

import type { VehicleType } from "./store";

export type ZoneMode = "open" | "zoned";

export type CustomerZone = { governorate?: string; center?: string };

/** Service access keys used across the customer app. */
export type ServiceAccessId =
  | "libraries"
  | "rides"
  | "food"
  | "grocery"
  | "cafe"
  | "pharmacy"
  | "mall"
  | "home"
  | "spare"
  | "clinics"
  | "labs"
  | "salons";

export const SERVICE_ZONE_MODE: Record<ServiceAccessId, ZoneMode> = {
  // Open zone — nationwide
  libraries: "open",
  rides: "open",
  // Zone-specific — physical goods delivered locally
  food: "zoned",
  grocery: "zoned",
  cafe: "zoned",
  pharmacy: "zoned",
  mall: "zoned",
  home: "zoned",
  spare: "zoned",
  // Bookings stay local to the chosen governorate
  clinics: "zoned",
  labs: "zoned",
  salons: "zoned",
};

export function zoneModeOf(id: string): ZoneMode {
  return SERVICE_ZONE_MODE[id as ServiceAccessId] ?? "zoned";
}

export function isOpenZoneService(id: string): boolean {
  return zoneModeOf(id) === "open";
}

/** Does a provider/merchant zone string belong to the customer's zone? */
export function matchesZone(providerZone: string | undefined, zone: CustomerZone): boolean {
  if (!providerZone) return false;
  const z = providerZone.trim().toLowerCase();
  const center = zone.center?.trim().toLowerCase();
  const gov = zone.governorate?.trim().toLowerCase();
  if (center && (z === center || z.includes(center) || center.includes(z))) return true;
  if (gov && (z === gov || z.includes(gov))) return true;
  return false;
}

/**
 * Filter any provider list for a service.
 * Open-zone services return the full list untouched.
 */
export function filterByZone<T extends { zone?: string }>(
  serviceId: string,
  items: T[],
  zone: CustomerZone,
): T[] {
  if (isOpenZoneService(serviceId)) return items;
  return items.filter((it) => matchesZone(it.zone, zone));
}

// ---------- Delivery vehicle zone limits ----------
/** Max operating radius (km) per vehicle inside its designated zone. */
export const VEHICLE_ZONE_LIMITS: Partial<Record<VehicleType, { maxKm: number; crossZone: boolean; labelAr: string }>> = {
  motorbike: { maxKm: 15, crossZone: false, labelAr: "الموتوسيكل" },
  tricycle: { maxKm: 20, crossZone: false, labelAr: "التروسيكل" },
  tuktuk: { maxKm: 10, crossZone: false, labelAr: "التوكتوك" },
};

export type ZoneCheck = { allowed: boolean; reasonAr?: string };

/**
 * Strict enforcement for motorcycle / tricycle (and tuktuk) deliveries:
 * they may not leave their designated zone, and are distance-capped.
 */
export function checkVehicleZone(
  vehicle: VehicleType,
  opts: { originZone?: string; destZone?: string; distanceKm?: number; customerZone: CustomerZone },
): ZoneCheck {
  const limit = VEHICLE_ZONE_LIMITS[vehicle];
  if (!limit) return { allowed: true };

  const { originZone, destZone, distanceKm = 0, customerZone } = opts;

  if (!limit.crossZone) {
    const originOk = originZone ? matchesZone(originZone, customerZone) : true;
    const destOk = destZone ? matchesZone(destZone, customerZone) : true;
    if (!originOk || !destOk) {
      return {
        allowed: false,
        reasonAr: `${limit.labelAr} لا يخرج من نطاق ${customerZone.center || customerZone.governorate || "منطقتك"} — اختر مركبة نقل أكبر.`,
      };
    }
  }

  if (distanceKm > limit.maxKm) {
    return {
      allowed: false,
      reasonAr: `${limit.labelAr} مسموح حتى ${limit.maxKm} كم داخل النطاق (المسافة ${distanceKm.toFixed(1)} كم).`,
    };
  }

  return { allowed: true };
}

/** Human label for badges in the UI. */
export function zoneBadgeAr(serviceId: string, zone: CustomerZone): string {
  return isOpenZoneService(serviceId)
    ? "متاح في كل المحافظات"
    : `متاح في ${zone.center || zone.governorate || "منطقتك"}`;
}
