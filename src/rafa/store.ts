import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import React from "react";

export type VehicleType = "car" | "motorbike" | "tuktuk" | "tricycle" | "dababa" | "winsh";
export type ServiceType = "ride" | "food" | "grocery" | "kiosk" | "pharmacy" | "laundry" | "errands";
export type OrderStatus = "pending" | "accepted" | "preparing" | "enRoute" | "delivered" | "completed" | "cancelled";
export type CaptainFleet = "tayar" | "captain" | "cargo" | "winsh";
export type MedicalSpecialty = "clinic" | "lab" | "salon";
export type Weekday = "sat" | "sun" | "mon" | "tue" | "wed" | "thu" | "fri";
export interface MedicalBranch {
  id: string; label: string; governorate: string; address?: string; mapUrl?: string;
}
export interface MedicalSlot {
  id: string; branchId: string; weekday: Weekday; from: string; to: string;
}
export interface MedicalBooking {
  id: string; providerId: string; branchId: string; customerName: string; customerPhone?: string;
  dateISO: string; service: string; price: number; paid: boolean; ts: number;
}
export interface MedicalProvider {
  id: string; name: string; specialty: MedicalSpecialty; specializationLabel: string;
  promoImage?: string; phone?: string; partnerNid: string;
  username: string; password: string;
  status: "pending" | "approved" | "rejected";
  branches: MedicalBranch[];
  slots: MedicalSlot[];
  weeklyHolidays: Weekday[];
  commissionPct: number;
}
export type CountryCode = string;
export interface Country {
  code: CountryCode; name: string; nameAr: string; flag: string;
  currency: string; defaultLang: "en" | "ar"; governorates: string[];
}
export type DebtCategory = "motorbike" | "car" | "cargo";
export interface PartnerApplication {
  id: string; ts: number; partnerNid: string;
  kind: "merchant" | "captain" | "medical";
  name: string; phone: string;
  governorate: string; center?: string;
  vehicle?: VehicleType;
  menu?: string; pricing?: string; promoVideo?: string;
  status: "pending" | "approved" | "rejected";
  reason?: string;
  nationalId?: string;
  license?: string;
  address?: string;
  mapUrl?: string;
  category?: ServiceType;
  // Extended onboarding (UI labels & uploaded assets)
  operationType?: string;
  categoryLabel?: string;
  nidPhoto?: string;
  signboardPhoto?: string;
  about?: string;
  criminalRecordPhoto?: string;
  appointmentCardPhoto?: string;
  // Medical/aesthetic provider fields
  specialty?: MedicalSpecialty;
  specializationLabel?: string;
  promoImage?: string;
}
export interface AuditEntry {
  id: string; seq: number; ts: number;
  partnerNid: string; partnerName: string;
  actionType: string; details: string;
}
export interface MonthlyClosure {
  id: string; month: string; partnerNid: string; partnerName: string;
  grossCommission: number; cashCollected: number; digital: number;
  debtsDeducted: number; netSettlement: number; paid: boolean; paidAt?: number;
}

export interface Driver {
  id: string; name: string; phone: string; vehicle: VehicleType; plate: string;
  zone: string; rating: number; online: boolean; fleet: CaptainFleet;
  prefix?: string;
}
export interface Merchant {
  id: string; name: string; phone: string; zone: string; category: ServiceType;
}
export interface Order {
  id: string; service: ServiceType; vehicle: VehicleType;
  customer: string; merchantId?: string; driverId?: string;
  pickup: string; dropoff: string; stops?: string[]; distanceKm: number;
  fareEgp: number; status: OrderStatus; createdAt: number; zone: string; destZone: string;
  cashChange?: number; weightKg?: number; scheduledFor?: number; rxImage?: string;
  outOfZonePremium?: number; bids?: { driverId: string; amount: number }[];
}
export interface SafetyLog { id: string; type: "sos" | "reassign" | "fraud" | "escrow"; msg: string; ts: number; zone?: string; }
export interface Notification { id: string; ts: number; title: string; body: string; }
export interface AdminStaff { id: string; name: string; phone: string; nationalId: string; role: "ops" | "finance" | "support" | "compliance"; }
export interface ZonePartner { nationalId: string; name: string; zone: string; }
export interface ZonePartnerFull extends ZonePartner {
  phone?: string; country?: CountryCode; governorate?: string; center?: string;
  username?: string; password?: string;
  /** Partner share % of the commission remainder, applied AFTER the central platform cut. */
  commissionPct?: number;
}
export interface PartnerInboxItem { id: string; ts: number; kind: "credentials" | "rejection"; targetName: string; targetRole: "merchant" | "captain" | "medical"; username?: string; password?: string; reason?: string; }
export interface Application { id: string; ts: number; targetName: string; targetRole: "merchant" | "captain"; zone: string; phone: string; }
export interface VehiclePricing { base: number; perKm: number; commissionPct: number; outOfZonePremium: number; }

export type MerchantCommissionCategory = "restaurants" | "supermarket" | "pharmacy" | "publisher" | "other";
export type MerchantCommissions = Record<MerchantCommissionCategory, number>;

interface State {
  drivers: Driver[]; merchants: Merchant[]; orders: Order[]; logs: SafetyLog[];
  fuelIndex: number;
  walletCustomer: number; walletDriver: Record<string, number>; walletPartner: Record<string, number>;
  centralRevenue: number;
  pricing: Record<VehicleType, VehiclePricing>;
  splitCentralPct: number; splitPartnerPct: number;
  merchantCommissions: MerchantCommissions;
  adminStaff: AdminStaff[];
  zonePartners: ZonePartnerFull[];
  partnerInbox: Record<string, PartnerInboxItem[]>;
  applications: Application[];
  notifications: Notification[];
  sosEvents: { id: string; customer: string; zone: string; ts: number }[];
  insuranceFund: number;
  homeZone: string;
  family: { name: string; share: number }[];
  // RAVA upgrades
  countries: Country[];
  activeCountryCode: CountryCode;
  debtLimits: Record<CountryCode, Record<DebtCategory, number>>;
  partnerApplications: PartnerApplication[];
  auditLog: AuditEntry[];
  auditSeq: number;
  payoutFrozen: boolean;
  monthlyClosures: MonthlyClosure[];
  coldStorage: Order[];
  adminPassword: string;
  faceVerified: Record<string, boolean>;
  medicalProviders: MedicalProvider[];
  medicalBookings: MedicalBooking[];
}

type Action =
  | { type: "addOrder"; order: Order }
  | { type: "addOrders"; orders: Order[] }
  | { type: "acceptOrder"; orderId: string; driverId: string }
  | { type: "advanceOrder"; orderId: string; status: OrderStatus }
  | { type: "completeOrder"; orderId: string }
  | { type: "cancelOrder"; orderId: string; byCustomer: boolean }
  | { type: "setFuel"; v: number }
  | { type: "topUpDriver"; driverId: string; amount: number }
  | { type: "changeToCredit"; orderId: string }
  | { type: "addLog"; log: SafetyLog }
  | { type: "addNotif"; n: Notification }
  | { type: "fireSos"; customer: string; zone: string }
  | { type: "setShift"; driverId: string; online: boolean }
  | { type: "placeBid"; orderId: string; driverId: string; amount: number }
  | { type: "acceptBid"; orderId: string; driverId: string; amount: number }
  | { type: "updatePricing"; vehicle: VehicleType; patch: Partial<VehiclePricing> }
  | { type: "updateSplit"; central: number; partner: number }
  | { type: "updateMerchantCommissions"; patch: Partial<MerchantCommissions> }
  | { type: "addZonePartnerFull"; p: ZonePartnerFull }
  | { type: "addStaff"; s: AdminStaff }
  | { type: "approveApplication"; appId: string; password: string }
  | { type: "rejectApplication"; appId: string; reason: string }
  // RAVA upgrades
  | { type: "setActiveCountry"; code: CountryCode }
  | { type: "addCountry"; c: Country }
  | { type: "adjustDebtLimit"; country: CountryCode; cat: DebtCategory; delta: number }
  | { type: "massWallet"; country: CountryCode; governorate?: string; target: "driver" | "customer"; delta: number }
  | { type: "addPartner"; p: ZonePartnerFull }
  | { type: "submitPartnerApp"; app: PartnerApplication }
  | { type: "decidePartnerApp"; appId: string; approve: boolean; reason?: string; password?: string }
  | { type: "adjustWallet"; kind: "driver" | "partner"; id: string; delta: number; note: string; actorName?: string; actorNid?: string }
  | { type: "logAudit"; partnerNid: string; partnerName: string; actionType: string; details: string }
  | { type: "setFaceVerified"; driverId: string; ok: boolean }
  | { type: "setPayoutFrozen"; frozen: boolean }
  | { type: "runMonthlyClosure" }
  | { type: "markClosurePaid"; closureId: string }
  | { type: "archiveCold"; ids: string[] }
  | { type: "patchMedicalProvider"; id: string; patch: Partial<MedicalProvider> }
  | { type: "addMedicalBooking"; b: MedicalBooking }
  | { type: "markMedicalBookingPaid"; id: string };

const initialDrivers: Driver[] = [
  { id: "d1", name: "Ahmed Saber", phone: "010-1122-3344", vehicle: "motorbike", plate: "ق ج م 4521", zone: "Shubra", rating: 4.9, online: true, fleet: "tayar" },
  { id: "d2", name: "Mahmoud Ali", phone: "011-2233-4455", vehicle: "tuktuk", plate: "س ل ت 1188", zone: "Maadi", rating: 4.7, online: true, fleet: "captain" },
  { id: "d3", name: "Karim Hassan", phone: "012-3344-5566", vehicle: "car", plate: "أ ب ج 9090", zone: "Maadi", rating: 4.8, online: true, fleet: "captain" },
  { id: "d4", name: "Sayed Ibrahim", phone: "015-4455-6677", vehicle: "dababa", plate: "د ف ع 7012", zone: "Shubra", rating: 4.6, online: true, fleet: "cargo" },
  { id: "d5", name: "Tarek Nabil", phone: "010-5566-7788", vehicle: "winsh", plate: "و ن ش 3030", zone: "Cairo", rating: 4.5, online: false, fleet: "winsh" },
  { id: "d6", name: "Hany Fouad", phone: "010-9988-7766", vehicle: "tricycle", plate: "ت ر س 5566", zone: "Shubra", rating: 4.4, online: true, fleet: "cargo" },
];
const initialMerchants: Merchant[] = [
  { id: "m1", name: "Koshary El-Tahrir", phone: "02-2390-1122", zone: "Shubra", category: "food" },
  { id: "m2", name: "Seoudi Market", phone: "02-2519-3344", zone: "Maadi", category: "grocery" },
  { id: "m3", name: "El-Ezaby Pharmacy", phone: "16027", zone: "Maadi", category: "pharmacy" },
];

const initialPricing: Record<VehicleType, VehiclePricing> = {
  motorbike: { base: 8, perKm: 4, commissionPct: 18, outOfZonePremium: 10 },
  tuktuk: { base: 8, perKm: 5, commissionPct: 15, outOfZonePremium: 25 },
  tricycle: { base: 12, perKm: 3.5, commissionPct: 15, outOfZonePremium: 10 },
  car: { base: 15, perKm: 7, commissionPct: 20, outOfZonePremium: 15 },
  dababa: { base: 30, perKm: 12, commissionPct: 18, outOfZonePremium: 20 },
  winsh: { base: 60, perKm: 22, commissionPct: 22, outOfZonePremium: 30 },
};

const initialCountries: Country[] = [
  { code: "EG", name: "Egypt", nameAr: "مصر", flag: "🇪🇬", currency: "EGP", defaultLang: "ar",
    governorates: ["القاهرة","الجيزة","الإسكندرية","القليوبية","الغربية","الدقهلية","الشرقية","المنوفية","البحيرة","كفر الشيخ","دمياط","بورسعيد","الإسماعيلية","السويس","شمال سيناء","جنوب سيناء","الفيوم","بني سويف","المنيا","أسيوط","سوهاج","قنا","الأقصر","أسوان","البحر الأحمر","الوادي الجديد","مطروح"] },
  { code: "SA", name: "Saudi Arabia", nameAr: "السعودية", flag: "🇸🇦", currency: "SAR", defaultLang: "ar",
    governorates: ["الرياض","مكة المكرمة","المدينة المنورة","القصيم","المنطقة الشرقية","عسير","تبوك","حائل","الحدود الشمالية","جازان","نجران","الباحة","الجوف"] },
];

const initial: State = {
  drivers: initialDrivers, merchants: initialMerchants,
  orders: [],
  logs: [
    { id: "l1", type: "reassign", msg: "Driver d7 GPS stalled — reassigned", ts: Date.now() - 90_000, zone: "Heliopolis" },
    { id: "l2", type: "fraud", msg: "Suspicious 0.1km trip flagged", ts: Date.now() - 240_000, zone: "Heliopolis" },
  ],
  fuelIndex: 1.0,
  walletCustomer: 850,
  walletDriver: { d1: 120, d2: -45, d3: 320, d4: 60, d5: 0, d6: 80 },
  walletPartner: { Shubra: 2840, Maadi: 4120, Heliopolis: 1980 },
  centralRevenue: 18_540,
  pricing: initialPricing,
  splitCentralPct: 40, splitPartnerPct: 60,
  merchantCommissions: { restaurants: 15, supermarket: 10, pharmacy: 8, publisher: 15, other: 12 },
  adminStaff: [
    { id: "a1", name: "Hossam El-Sayed", phone: "010-0000-1111", nationalId: "29005011234567", role: "ops" },
    { id: "a2", name: "Mona Sherif", phone: "010-0000-2222", nationalId: "28809155544332", role: "finance" },
  ],
  zonePartners: [
    { nationalId: "29101011234567", name: "Hassan Abdelaziz", zone: "Shubra" },
    { nationalId: "28505121234567", name: "Reham Mostafa", zone: "Maadi" },
    { nationalId: "29201011234567", name: "Walid Kamal", zone: "Heliopolis" },
  ],
  partnerInbox: {
    "29101011234567": [
      { id: "in1", ts: Date.now() - 3_600_000, kind: "credentials", targetName: "Koshary El-Tahrir", targetRole: "merchant", username: "koshary_tahrir", password: "Rf-tahrir-2026" },
    ],
    "28505121234567": [],
    "29201011234567": [],
  },
  applications: [
    { id: "ap1", ts: Date.now() - 600_000, targetName: "Abou Tarek Restaurant", targetRole: "merchant", zone: "Shubra", phone: "02-2575-4040" },
    { id: "ap2", ts: Date.now() - 300_000, targetName: "Mostafa Galal", targetRole: "captain", zone: "Maadi", phone: "011-7788-9900" },
  ],
  notifications: [
    { id: "n1", ts: Date.now() - 7200_000, title: "30% off El-Ezaby tonight", body: "Use code RAFA30 on pharmacy orders before midnight." },
  ],
  sosEvents: [],
  insuranceFund: 12_400,
  homeZone: "Shubra",
  family: [{ name: "Omar", share: 60 }, { name: "Nour", share: 25 }, { name: "Yassin", share: 15 }],
  countries: initialCountries,
  activeCountryCode: "EG",
  debtLimits: {
    EG: { motorbike: 100, car: 200, cargo: 350 },
    SA: { motorbike: 150, car: 300, cargo: 500 },
  },
  partnerApplications: [],
  auditLog: [],
  auditSeq: 1000,
  payoutFrozen: true,
  monthlyClosures: [],
  coldStorage: [],
  adminPassword: "RAVA-ADMIN-2026",
  faceVerified: {},
  medicalProviders: [],
  medicalBookings: [],
};

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "addOrder":
      return { ...s, orders: [a.order, ...s.orders] };
    case "addOrders":
      return { ...s, orders: [...a.orders, ...s.orders] };
    case "acceptOrder":
      return { ...s, orders: s.orders.map((o) => o.id === a.orderId ? { ...o, driverId: a.driverId, status: "accepted" } : o) };
    case "advanceOrder":
      return { ...s, orders: s.orders.map((o) => o.id === a.orderId ? { ...o, status: a.status } : o) };
    case "completeOrder": {
      const order = s.orders.find((o) => o.id === a.orderId);
      if (!order) return s;
      const pricing = s.pricing[order.vehicle];
      const totalFee = order.fareEgp * (pricing.commissionPct / 100);
      // === Compound Percentage Commission ===
      // Step 1: Central platform takes its cut FIRST.
      const central = totalFee * (s.splitCentralPct / 100);
      const remainder = totalFee - central;
      // Step 2: Franchise partner gets their per-partner rate of the remainder.
      // Falls back to the global splitPartnerPct when the partner has no custom rate.
      const zonePartner = s.zonePartners.find((p) => p.zone === order.zone);
      const partnerPct = zonePartner?.commissionPct ?? s.splitPartnerPct;
      const partner = remainder * (partnerPct / 100);
      const driverShare = order.fareEgp - totalFee;
      const log: SafetyLog = { id: uid(), type: "escrow", msg: `Split → Central +${central.toFixed(0)} · ${order.zone} +${partner.toFixed(0)}`, ts: Date.now(), zone: order.zone };
      return {
        ...s,
        orders: s.orders.map((o) => o.id === a.orderId ? { ...o, status: "completed" } : o),
        centralRevenue: s.centralRevenue + central,
        insuranceFund: s.insuranceFund + central * 0.05,
        walletPartner: { ...s.walletPartner, [order.zone]: (s.walletPartner[order.zone] ?? 0) + partner },
        walletDriver: order.driverId
          ? { ...s.walletDriver, [order.driverId]: (s.walletDriver[order.driverId] ?? 0) + driverShare }
          : s.walletDriver,
        logs: [log, ...s.logs].slice(0, 60),
      };
    }
    case "cancelOrder": {
      const o = s.orders.find((x) => x.id === a.orderId);
      const log: SafetyLog = { id: uid(), type: "escrow", msg: `Escrow lock — cancellation by ${a.byCustomer ? "customer" : "captain"}`, ts: Date.now(), zone: o?.zone };
      return { ...s, orders: s.orders.map((x) => x.id === a.orderId ? { ...x, status: "cancelled" } : x), logs: [log, ...s.logs].slice(0, 60) };
    }
    case "setFuel": return { ...s, fuelIndex: a.v };
    case "topUpDriver":
      return { ...s, walletDriver: { ...s.walletDriver, [a.driverId]: (s.walletDriver[a.driverId] ?? 0) + a.amount } };
    case "changeToCredit": {
      const o = s.orders.find((x) => x.id === a.orderId);
      const change = o?.cashChange ?? 0;
      return {
        ...s,
        walletCustomer: s.walletCustomer + change,
        orders: s.orders.map((x) => x.id === a.orderId ? { ...x, cashChange: 0 } : x),
        notifications: [{ id: uid(), ts: Date.now(), title: "Change added to wallet", body: `+${change} EGP credited from merchant change.` }, ...s.notifications].slice(0, 30),
      };
    }
    case "addLog":
      return { ...s, logs: [a.log, ...s.logs].slice(0, 60) };
    case "addNotif":
      return { ...s, notifications: [a.n, ...s.notifications].slice(0, 30) };
    case "fireSos": {
      const ev = { id: uid(), customer: a.customer, zone: a.zone, ts: Date.now() };
      const log: SafetyLog = { id: uid(), type: "sos", msg: `SOS · ${a.customer} · ${a.zone}`, ts: Date.now(), zone: a.zone };
      return { ...s, sosEvents: [ev, ...s.sosEvents].slice(0, 20), logs: [log, ...s.logs].slice(0, 60) };
    }
    case "setShift":
      return { ...s, drivers: s.drivers.map((d) => d.id === a.driverId ? { ...d, online: a.online } : d) };
    case "placeBid":
      return { ...s, orders: s.orders.map((o) => o.id === a.orderId ? { ...o, bids: [...(o.bids ?? []), { driverId: a.driverId, amount: a.amount }] } : o) };
    case "acceptBid":
      return { ...s, orders: s.orders.map((o) => o.id === a.orderId ? { ...o, driverId: a.driverId, fareEgp: a.amount, status: "accepted" } : o) };
    case "updatePricing":
      return { ...s, pricing: { ...s.pricing, [a.vehicle]: { ...s.pricing[a.vehicle], ...a.patch } } };
    case "updateSplit":
      return { ...s, splitCentralPct: a.central, splitPartnerPct: a.partner };
    case "updateMerchantCommissions":
      return { ...s, merchantCommissions: { ...s.merchantCommissions, ...a.patch } };
    case "addZonePartnerFull":
      return { ...s, zonePartners: [...s.zonePartners, a.p], partnerInbox: { ...s.partnerInbox, [a.p.nationalId]: [] } };
    case "addStaff":
      return { ...s, adminStaff: [a.s, ...s.adminStaff] };
    case "approveApplication": {
      const app = s.applications.find((x) => x.id === a.appId);
      if (!app) return s;
      const partner = s.zonePartners.find((p) => p.zone === app.zone);
      const username = app.targetName.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 20);
      const item: PartnerInboxItem = { id: uid(), ts: Date.now(), kind: "credentials", targetName: app.targetName, targetRole: app.targetRole, username, password: a.password };
      const inbox = partner ? { ...s.partnerInbox, [partner.nationalId]: [item, ...(s.partnerInbox[partner.nationalId] ?? [])] } : s.partnerInbox;
      // Auto-add to live merchants/drivers
      const extraMerchants = app.targetRole === "merchant"
        ? [...s.merchants, { id: uid(), name: app.targetName, phone: app.phone, zone: app.zone, category: "food" as ServiceType }]
        : s.merchants;
      const extraDrivers = app.targetRole === "captain"
        ? [...s.drivers, { id: uid(), name: app.targetName, phone: app.phone, vehicle: "motorbike" as VehicleType, plate: "ج د د " + Math.floor(1000 + Math.random() * 9000), zone: app.zone, rating: 5, online: true, fleet: "tayar" as CaptainFleet }]
        : s.drivers;
      return { ...s, applications: s.applications.filter((x) => x.id !== a.appId), partnerInbox: inbox, merchants: extraMerchants, drivers: extraDrivers };
    }
    case "rejectApplication": {
      const app = s.applications.find((x) => x.id === a.appId);
      if (!app) return s;
      const partner = s.zonePartners.find((p) => p.zone === app.zone);
      const item: PartnerInboxItem = { id: uid(), ts: Date.now(), kind: "rejection", targetName: app.targetName, targetRole: app.targetRole, reason: a.reason };
      const inbox = partner ? { ...s.partnerInbox, [partner.nationalId]: [item, ...(s.partnerInbox[partner.nationalId] ?? [])] } : s.partnerInbox;
      return { ...s, applications: s.applications.filter((x) => x.id !== a.appId), partnerInbox: inbox };
    }
    case "setActiveCountry":
      return { ...s, activeCountryCode: a.code };
    case "addCountry":
      return { ...s, countries: [...s.countries, a.c], debtLimits: { ...s.debtLimits, [a.c.code]: { motorbike: 100, car: 200, cargo: 350 } } };
    case "adjustDebtLimit": {
      const cur = s.debtLimits[a.country] ?? { motorbike: 100, car: 200, cargo: 350 };
      return { ...s, debtLimits: { ...s.debtLimits, [a.country]: { ...cur, [a.cat]: Math.max(0, cur[a.cat] + a.delta) } } };
    }
    case "massWallet": {
      if (a.target === "customer") return { ...s, walletCustomer: s.walletCustomer + a.delta };
      // Driver mass adjust — scoped to governorate if provided (matches driver.zone substring)
      const next: Record<string, number> = { ...s.walletDriver };
      s.drivers.forEach((d) => {
        if (a.governorate && d.zone !== a.governorate) return;
        next[d.id] = (next[d.id] ?? 0) + a.delta;
      });
      return { ...s, walletDriver: next };
    }
    case "addPartner":
      return { ...s, zonePartners: [...s.zonePartners, a.p], partnerInbox: { ...s.partnerInbox, [a.p.nationalId]: [] } };
    case "submitPartnerApp": {
      const entry = Object.freeze({
        id: uid(), seq: s.auditSeq + 1, ts: Date.now(),
        partnerNid: a.app.partnerNid,
        partnerName: s.zonePartners.find((p) => p.nationalId === a.app.partnerNid)?.name ?? "—",
        actionType: `submit_${a.app.kind}`,
        details: `${a.app.name} · ${a.app.governorate}`,
      }) as AuditEntry;
      return { ...s, partnerApplications: [a.app, ...s.partnerApplications], auditLog: [entry, ...s.auditLog], auditSeq: s.auditSeq + 1 };
    }
    case "decidePartnerApp": {
      const app = s.partnerApplications.find((x) => x.id === a.appId);
      if (!app) return s;
      const updated: PartnerApplication = { ...app, status: a.approve ? "approved" : "rejected", reason: a.reason };
      const partner = s.zonePartners.find((p) => p.nationalId === app.partnerNid);
      const password = a.password || ("RAVA-" + Math.random().toString(36).slice(2, 8).toUpperCase());
      const username = (app.name || "user").toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 16);
      const item: PartnerInboxItem = a.approve
        ? { id: uid(), ts: Date.now(), kind: "credentials", targetName: app.name, targetRole: app.kind, username, password }
        : { id: uid(), ts: Date.now(), kind: "rejection", targetName: app.name, targetRole: app.kind, reason: a.reason };
      const inbox = partner ? { ...s.partnerInbox, [partner.nationalId]: [item, ...(s.partnerInbox[partner.nationalId] ?? [])] } : s.partnerInbox;
      const extraMerchants = a.approve && app.kind === "merchant"
        ? [...s.merchants, { id: uid(), name: app.name, phone: app.phone, zone: app.governorate, category: (app.category ?? "food") as ServiceType }]
        : s.merchants;
      const extraDrivers = a.approve && app.kind === "captain"
        ? [...s.drivers, (() => {
            const v: VehicleType = (app.vehicle ?? "motorbike") as VehicleType;
            const fleet: CaptainFleet = FLEET_FOR_VEHICLE[v];
            const prefixMap: Record<VehicleType, string> = {
              motorbike: "MOTO", tricycle: "TRIC", car: "CAR", tuktuk: "TUK", dababa: "DABA", winsh: "WNSH",
            };
            const prefix = `${prefixMap[v]}-${Math.floor(1000 + Math.random() * 9000)}`;
            return { id: uid(), name: app.name, phone: app.phone, vehicle: v, plate: "ج د د " + Math.floor(1000 + Math.random() * 9000), zone: app.governorate, rating: 5, online: false, fleet, prefix };
          })()]
        : s.drivers;
      const extraMedical = a.approve && app.kind === "medical"
        ? [...s.medicalProviders, {
            id: uid(), name: app.name, specialty: (app.specialty ?? "clinic") as MedicalSpecialty,
            specializationLabel: app.specializationLabel ?? "",
            promoImage: app.promoImage, phone: app.phone, partnerNid: app.partnerNid,
            username, password, status: "approved" as const,
            branches: [], slots: [], weeklyHolidays: ["fri" as Weekday],
            commissionPct: 12,
          }]
        : s.medicalProviders;
      const auditEntry = Object.freeze({
        id: uid(), seq: s.auditSeq + 1, ts: Date.now(),
        partnerNid: app.partnerNid, partnerName: partner?.name ?? "—",
        actionType: a.approve ? "approve_decision_received" : "rejection_received",
        details: `${app.kind} · ${app.name}${a.reason ? " · " + a.reason : ""}`,
      }) as AuditEntry;
      return {
        ...s,
        partnerApplications: s.partnerApplications.map((x) => x.id === a.appId ? updated : x),
        partnerInbox: inbox, merchants: extraMerchants, drivers: extraDrivers,
        medicalProviders: extraMedical,
        auditLog: [auditEntry, ...s.auditLog], auditSeq: s.auditSeq + 1,
      };
    }
    case "logAudit": {
      const entry = Object.freeze({
        id: uid(), seq: s.auditSeq + 1, ts: Date.now(),
        partnerNid: a.partnerNid, partnerName: a.partnerName,
        actionType: a.actionType, details: a.details,
      }) as AuditEntry;
      return { ...s, auditLog: [entry, ...s.auditLog], auditSeq: s.auditSeq + 1 };
    }
    case "adjustWallet": {
      const sign = a.delta >= 0 ? "+" : "";
      const audit = Object.freeze({
        id: uid(), seq: s.auditSeq + 1, ts: Date.now(),
        partnerNid: a.actorNid ?? "ADMIN",
        partnerName: a.actorName ?? "Admin Ledger",
        actionType: a.delta >= 0 ? "ledger_credit" : "ledger_debit",
        details: `${a.kind} ${a.id} · ${sign}${a.delta} EGP · ${a.note}`,
      }) as AuditEntry;
      if (a.kind === "driver") {
        return {
          ...s,
          walletDriver: { ...s.walletDriver, [a.id]: (s.walletDriver[a.id] ?? 0) + a.delta },
          auditLog: [audit, ...s.auditLog], auditSeq: s.auditSeq + 1,
        };
      }
      return {
        ...s,
        walletPartner: { ...s.walletPartner, [a.id]: (s.walletPartner[a.id] ?? 0) + a.delta },
        auditLog: [audit, ...s.auditLog], auditSeq: s.auditSeq + 1,
      };
    }
    case "setFaceVerified":
      return {
        ...s,
        faceVerified: { ...s.faceVerified, [a.driverId]: a.ok },
        walletDriver: a.ok ? s.walletDriver : { ...s.walletDriver, [a.driverId]: (s.walletDriver[a.driverId] ?? 0) - 75 },
        logs: a.ok ? s.logs : [{ id: uid(), type: "fraud" as const, msg: `Face mismatch — driver ${a.driverId} fined 75`, ts: Date.now() }, ...s.logs].slice(0, 60),
      };
    case "setPayoutFrozen":
      return { ...s, payoutFrozen: a.frozen };
    case "runMonthlyClosure": {
      const month = new Date().toISOString().slice(0, 7);
      const closures: MonthlyClosure[] = s.zonePartners.map((p) => {
        const gross = s.walletPartner[p.zone] ?? 0;
        const cash = Math.round(gross * 0.35);
        const digital = Math.round(gross * 0.65);
        const debts = s.drivers.filter((d) => d.zone === p.zone).reduce((acc, d) => acc + Math.max(0, -(s.walletDriver[d.id] ?? 0)), 0);
        const net = Math.round(gross - debts);
        return { id: uid(), month, partnerNid: p.nationalId, partnerName: p.name, grossCommission: gross, cashCollected: cash, digital, debtsDeducted: debts, netSettlement: net, paid: false };
      });
      return { ...s, monthlyClosures: [...closures, ...s.monthlyClosures], payoutFrozen: false };
    }
    case "markClosurePaid": {
      const c = s.monthlyClosures.find((x) => x.id === a.closureId);
      if (!c) return s;
      return {
        ...s,
        monthlyClosures: s.monthlyClosures.map((x) => x.id === a.closureId ? { ...x, paid: true, paidAt: Date.now() } : x),
        walletPartner: { ...s.walletPartner, [s.zonePartners.find((p) => p.nationalId === c.partnerNid)?.zone ?? ""]: 0 },
      };
    }
    case "archiveCold": {
      const moved = s.orders.filter((o) => a.ids.includes(o.id));
      return { ...s, orders: s.orders.filter((o) => !a.ids.includes(o.id)), coldStorage: [...moved, ...s.coldStorage].slice(0, 500) };
    }
    case "patchMedicalProvider":
      return { ...s, medicalProviders: s.medicalProviders.map((p) => p.id === a.id ? { ...p, ...a.patch } : p) };
    case "addMedicalBooking":
      return { ...s, medicalBookings: [a.b, ...s.medicalBookings] };
    case "markMedicalBookingPaid": {
      const b = s.medicalBookings.find((x) => x.id === a.id);
      if (!b) return s;
      const provider = s.medicalProviders.find((p) => p.id === b.providerId);
      const commission = provider ? Math.round(b.price * (provider.commissionPct / 100)) : 0;
      return {
        ...s,
        medicalBookings: s.medicalBookings.map((x) => x.id === a.id ? { ...x, paid: true } : x),
        centralRevenue: s.centralRevenue + commission,
      };
    }
  }
}

const StoreCtx = createContext<{ state: State; dispatch: (a: Action) => void; } | null>(null);

const PERSIST_KEY = "rava.store.v1";
const PERSIST_FIELDS: (keyof State)[] = [
  "orders", "logs", "fuelIndex",
  "walletCustomer", "walletDriver", "walletPartner", "centralRevenue",
  "pricing", "splitCentralPct", "splitPartnerPct", "merchantCommissions",
  "adminStaff", "zonePartners", "partnerInbox", "applications", "notifications",
  "sosEvents", "insuranceFund", "homeZone", "family",
  "activeCountryCode", "debtLimits",
  "partnerApplications", "auditLog", "auditSeq", "payoutFrozen",
  "monthlyClosures", "coldStorage", "faceVerified",
  "medicalProviders", "medicalBookings",
];

function loadPersisted(): Partial<State> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PERSIST_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch { return null; }
}

function savePersisted(s: State) {
  if (typeof window === "undefined") return;
  try {
    const subset: Record<string, unknown> = {};
    for (const k of PERSIST_FIELDS) subset[k as string] = (s as any)[k];
    window.localStorage.setItem(PERSIST_KEY, JSON.stringify(subset));
  } catch { /* quota / private mode — ignore */ }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(() => {
    const persisted = loadPersisted();
    return persisted ? { ...initial, ...persisted } : initial;
  });
  const stateRef = useRef(state);
  stateRef.current = state;
  const dispatch = (a: Action) => setState((s) => reducer(s, a));

  useEffect(() => {
    const id = setTimeout(() => savePersisted(state), 300);
    return () => clearTimeout(id);
  }, [state]);

  useEffect(() => {
    const t = setInterval(() => {
      const now = Date.now();
      const s = stateRef.current;
      s.orders.forEach((o) => {
        const age = now - o.createdAt;
        if (o.status === "pending" && age > 4000) {
          const candidate = s.drivers.find((d) => d.vehicle === o.vehicle && d.zone === o.zone && d.online)
            ?? s.drivers.find((d) => d.vehicle === o.vehicle && d.online);
          if (candidate) {
            setState((cur) => reducer(cur, { type: "acceptOrder", orderId: o.id, driverId: candidate.id }));
          }
        } else if (o.status === "accepted" && age > 10_000) {
          setState((cur) => reducer(cur, { type: "advanceOrder", orderId: o.id, status: o.service === "ride" ? "enRoute" : "preparing" }));
        } else if (o.status === "preparing" && age > 16_000) {
          setState((cur) => reducer(cur, { type: "advanceOrder", orderId: o.id, status: "enRoute" }));
        } else if (o.status === "enRoute" && age > 24_000) {
          setState((cur) => reducer(cur, { type: "advanceOrder", orderId: o.id, status: "delivered" }));
        } else if (o.status === "delivered" && age > 28_000) {
          setState((cur) => reducer(cur, { type: "completeOrder", orderId: o.id }));
        }
      });
    }, 1500);
    // Database Janitor — archive completed orders older than 48h (simulated as 90s for demo)
    const j = setInterval(() => {
      const now = Date.now();
      const s = stateRef.current;
      const stale = s.orders.filter((o) => o.status === "completed" && now - o.createdAt > 90_000).map((o) => o.id);
      if (stale.length) setState((cur) => reducer(cur, { type: "archiveCold", ids: stale }));
    }, 30_000);
    return () => { clearInterval(t); clearInterval(j); };
  }, []);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return React.createElement(StoreCtx.Provider, { value }, children);
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("StoreProvider missing");
  return ctx;
}

export function calcFare(vehicle: VehicleType, km: number, fuelIndex: number, pricing: Record<VehicleType, VehiclePricing>, outOfZone = false) {
  const p = pricing[vehicle];
  const base = p.base + p.perKm * km * fuelIndex;
  const premium = outOfZone ? p.outOfZonePremium : 0;
  return Math.round(base + premium);
}

export const FLEET_FOR_VEHICLE: Record<VehicleType, CaptainFleet> = {
  motorbike: "tayar",
  car: "captain",
  tuktuk: "captain",
  tricycle: "cargo",
  dababa: "cargo",
  winsh: "winsh",
};

export function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export function formatMoney(amount: number, currency: string) {
  const sym: Record<string, string> = { EGP: "ج.م", SAR: "ر.س", AED: "د.إ", USD: "$", EUR: "€" };
  return `${Math.round(amount).toLocaleString()} ${sym[currency] ?? currency}`;
}
