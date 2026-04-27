import {
  motorcycleCatalog,
  type LoanTermMonths,
  type MotorcycleCatalogItem,
} from "../data/motorcycles";
import { getActiveTenantSlug } from "./supabase";

export type OverdueFeeType = "fixed" | "percentage" | "daily";

export type OverdueSettings = {
  gracePeriodDays: number;
  feeType: OverdueFeeType;
  feeAmount: number;
  enabled: boolean;
};

export type TenantCatalogItem = MotorcycleCatalogItem & {
  visible: boolean;
};

const DEFAULT_OVERDUE_SETTINGS: OverdueSettings = {
  gracePeriodDays: 3,
  feeType: "fixed",
  feeAmount: 100,
  enabled: true,
};

function getTenantStorageKey(suffix: string) {
  return `mf_tenant_${getActiveTenantSlug()}_${suffix}`;
}

function normalizeTerm(value: number): LoanTermMonths | null {
  return [12, 24, 36, 48].includes(value) ? (value as LoanTermMonths) : null;
}

export function getDefaultOverdueSettings() {
  return { ...DEFAULT_OVERDUE_SETTINGS };
}

export function getOverdueSettings(): OverdueSettings {
  if (typeof window === "undefined") return getDefaultOverdueSettings();
  const raw = window.localStorage.getItem(getTenantStorageKey("overdue_settings"));
  if (!raw) return getDefaultOverdueSettings();

  try {
    const parsed = JSON.parse(raw) as Partial<OverdueSettings>;
    return {
      enabled: parsed.enabled ?? DEFAULT_OVERDUE_SETTINGS.enabled,
      gracePeriodDays: Math.max(Number(parsed.gracePeriodDays ?? 0), 0),
      feeType:
        parsed.feeType === "percentage" || parsed.feeType === "daily"
          ? parsed.feeType
          : "fixed",
      feeAmount: Math.max(Number(parsed.feeAmount ?? 0), 0),
    };
  } catch {
    return getDefaultOverdueSettings();
  }
}

export function saveOverdueSettings(settings: OverdueSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    getTenantStorageKey("overdue_settings"),
    JSON.stringify({
      enabled: settings.enabled,
      gracePeriodDays: Math.max(settings.gracePeriodDays, 0),
      feeType: settings.feeType,
      feeAmount: Math.max(settings.feeAmount, 0),
    }),
  );
}

export function calculateOverdueFee(params: {
  dueDate: Date;
  amount: number;
  paid: boolean;
  settings?: OverdueSettings;
}) {
  const settings = params.settings ?? getOverdueSettings();
  if (!settings.enabled || params.paid) {
    return { overdue: false, overdueFee: 0, daysOverdue: 0, totalDue: params.amount };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(params.dueDate);
  dueDate.setHours(0, 0, 0, 0);
  const rawDaysPastDue = Math.floor(
    (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  const daysOverdue = Math.max(rawDaysPastDue - settings.gracePeriodDays, 0);
  if (daysOverdue <= 0) {
    return { overdue: false, overdueFee: 0, daysOverdue: 0, totalDue: params.amount };
  }

  const overdueFee =
    settings.feeType === "percentage"
      ? params.amount * (settings.feeAmount / 100)
      : settings.feeType === "daily"
        ? settings.feeAmount * daysOverdue
        : settings.feeAmount;

  const roundedFee = Number(overdueFee.toFixed(2));
  return {
    overdue: true,
    overdueFee: roundedFee,
    daysOverdue,
    totalDue: Number((params.amount + roundedFee).toFixed(2)),
  };
}

function defaultTenantCatalog(): TenantCatalogItem[] {
  return motorcycleCatalog.map((item) => ({ ...item, visible: true }));
}

function normalizeCatalogItem(item: Partial<TenantCatalogItem>): TenantCatalogItem | null {
  const brand = item.brand?.trim() ?? "";
  const model = item.model?.trim() ?? "";
  if (!brand || !model) return null;

  const terms = (item.availableTerms ?? [])
    .map((term) => normalizeTerm(Number(term)))
    .filter((term): term is LoanTermMonths => term !== null);

  return {
    id:
      item.id?.trim() ||
      `${brand}-${model}-${Date.now()}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    brand,
    model,
    year: Math.max(Number(item.year ?? new Date().getFullYear()), 2000),
    engineCc: Math.max(Number(item.engineCc ?? 0), 0),
    price: Math.max(Number(item.price ?? 0), 0),
    image: item.image?.trim() || "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=80",
    description: item.description?.trim() || "Motorcycle unit available for financing.",
    status:
      item.status === "reserved" || item.status === "out_of_stock"
        ? item.status
        : "available",
    downPaymentOptions:
      item.downPaymentOptions?.length
        ? item.downPaymentOptions.map((value) => Math.max(Number(value), 0))
        : [0],
    availableTerms: terms.length ? terms : [12, 24, 36],
    promoTag: item.promoTag?.trim() || undefined,
    visible: item.visible ?? true,
  };
}

export function getTenantCatalog(): TenantCatalogItem[] {
  if (typeof window === "undefined") return defaultTenantCatalog();
  const raw = window.localStorage.getItem(getTenantStorageKey("catalog"));
  if (!raw) return defaultTenantCatalog();

  try {
    const parsed = JSON.parse(raw) as Partial<TenantCatalogItem>[];
    const normalized = parsed
      .map((item) => normalizeCatalogItem(item))
      .filter((item): item is TenantCatalogItem => item !== null);
    return normalized.length ? normalized : defaultTenantCatalog();
  } catch {
    return defaultTenantCatalog();
  }
}

export function saveTenantCatalog(items: TenantCatalogItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getTenantStorageKey("catalog"), JSON.stringify(items));
}

export function upsertTenantCatalogItem(item: Partial<TenantCatalogItem>) {
  const normalized = normalizeCatalogItem(item);
  if (!normalized) throw new Error("Brand and model are required.");

  const items = getTenantCatalog();
  const exists = items.some((entry) => entry.id === normalized.id);
  const next = exists
    ? items.map((entry) => (entry.id === normalized.id ? normalized : entry))
    : [normalized, ...items];
  saveTenantCatalog(next);
  return normalized;
}

export function removeTenantCatalogItem(id: string) {
  const next = getTenantCatalog().filter((item) => item.id !== id);
  saveTenantCatalog(next);
}

export function getTenantCatalogItem(id: string) {
  return getTenantCatalog().find((item) => item.id === id) ?? null;
}
