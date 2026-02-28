const FAVORITES_KEY = "mf_catalog_favorites";
const RECENTLY_VIEWED_KEY = "mf_catalog_recently_viewed";

function readStringArray(key: string): string[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(key);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

function writeStringArray(key: string, data: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(data));
}

export function getFavoriteCatalogIds(): string[] {
  return readStringArray(FAVORITES_KEY);
}

export function toggleFavoriteCatalogId(id: string): string[] {
  const favorites = getFavoriteCatalogIds();
  const next = favorites.includes(id)
    ? favorites.filter((item) => item !== id)
    : [...favorites, id];
  writeStringArray(FAVORITES_KEY, next);
  return next;
}

export function getRecentlyViewedCatalogIds(): string[] {
  return readStringArray(RECENTLY_VIEWED_KEY);
}

export function pushRecentlyViewedCatalogId(
  id: string,
  maxItems = 8,
): string[] {
  const current = getRecentlyViewedCatalogIds();
  const deduplicated = [id, ...current.filter((item) => item !== id)];
  const trimmed = deduplicated.slice(0, maxItems);
  writeStringArray(RECENTLY_VIEWED_KEY, trimmed);
  return trimmed;
}
