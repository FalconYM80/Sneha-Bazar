import type { StockStatus } from "./types";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AdminSettings {
  storeName: string;
  phone: string;
  email: string;
  lowStockThreshold: number;
  currency: string;
}

// ── Defaults ──────────────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: AdminSettings = {
  storeName: "Sneha Bazar",
  phone: "+91 98765 43210",
  email: "admin@snehabazar.in",
  lowStockThreshold: 8,
  currency: "INR (₹)",
};

const STORAGE_KEY = "adminSettings";

// ── Persistence ───────────────────────────────────────────────────────────────

/**
 * Load settings from localStorage.
 * Falls back to defaults for any missing or malformed fields.
 */
export function loadSettings(): AdminSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };

    const parsed = JSON.parse(raw) as Partial<AdminSettings>;

    return {
      storeName: typeof parsed.storeName === "string" && parsed.storeName.trim()
        ? parsed.storeName
        : DEFAULT_SETTINGS.storeName,
      phone: typeof parsed.phone === "string" && parsed.phone.trim()
        ? parsed.phone
        : DEFAULT_SETTINGS.phone,
      email: typeof parsed.email === "string" && parsed.email.trim()
        ? parsed.email
        : DEFAULT_SETTINGS.email,
      lowStockThreshold:
        typeof parsed.lowStockThreshold === "number" &&
        Number.isFinite(parsed.lowStockThreshold) &&
        parsed.lowStockThreshold > 0
          ? parsed.lowStockThreshold
          : DEFAULT_SETTINGS.lowStockThreshold,
      currency: typeof parsed.currency === "string" && parsed.currency.trim()
        ? parsed.currency
        : DEFAULT_SETTINGS.currency,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Persist settings to localStorage.
 */
export function saveSettings(settings: AdminSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

// ── Shared helper ─────────────────────────────────────────────────────────────

/**
 * Determine the stock status for a given quantity using the saved threshold.
 * This is the single source of truth used by both Inventory and Dashboard.
 *
 * @param stock         Current stock quantity
 * @param threshold     Optional override; defaults to the saved lowStockThreshold
 */
export function getStockStatus(stock: number, threshold?: number): StockStatus {
  const t = threshold ?? loadSettings().lowStockThreshold;
  if (stock === 0) return "Out of Stock";
  if (stock <= t) return "Low Stock";
  return "In Stock";
}
