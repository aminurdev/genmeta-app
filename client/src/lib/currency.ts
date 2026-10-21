export type Currency = "BDT" | "USD";

export const CURRENCY_STORAGE_KEY = "genmeta_pricing_currency";

/**
 * 100 BDT = $1.00 USD
 */
export const BDT_PER_USD = 100;

/**
 * Formats a BDT price according to the selected currency.
 * When currency is USD, calculates: 100 BDT = $1 USD.
 */
export function formatPlanPrice(
  amountInBdt: number,
  currency: Currency,
): string {
  if (currency === "BDT") {
    return `৳${amountInBdt.toLocaleString()}`;
  }

  const usd = amountInBdt / BDT_PER_USD;
  if (usd === 0) return "$0";
  if (usd % 1 === 0) return `$${usd}`;
  return `$${usd.toFixed(2)}`;
}

/**
 * Fast synchronous heuristic based on user device timezone.
 */
export function getInitialCurrencyFromTimezone(): Currency {
  if (typeof window === "undefined") return "BDT";
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz === "Asia/Dhaka" || tz === "Asia/Dacca" ? "BDT" : "USD";
  } catch {
    return "BDT";
  }
}

/**
 * Read user's manually chosen currency from localStorage.
 */
export function getSavedCurrency(): Currency | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (saved === "BDT" || saved === "USD") {
      return saved;
    }
  } catch {
    // localStorage not accessible
  }
  return null;
}

/**
 * Persist user's manually chosen currency to localStorage.
 */
export function saveCurrency(currency: Currency): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
  } catch {
    // localStorage not accessible
  }
}

/**
 * Detect user's country code (e.g. "BD", "US", "GB").
 * Uses internal Next.js API route first, falls back to public IP API, then timezone.
 */
export async function detectVisitorCountry(): Promise<string | null> {
  // 1. Next.js internal API route (reads CDN headers / server-side lookup)
  try {
    const res = await fetch("/api/country", {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.country && data.country !== "UNKNOWN") {
        return String(data.country).toUpperCase();
      }
    }
  } catch {
    // Continue to next fallback
  }

  // 2. Client-side fallback to public IP geolocation
  try {
    const res = await fetch("https://api.country.is", {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.country) {
        return String(data.country).toUpperCase();
      }
    }
  } catch {
    // Continue to next fallback
  }

  // 3. Fallback based on timezone
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === "Asia/Dhaka" || tz === "Asia/Dacca") {
      return "BD";
    }
  } catch {
    // Ignore
  }

  return null;
}
