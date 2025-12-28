export type TownSelection = {
  label: string; // e.g. "Rochdale"
  displayName?: string; // e.g. "Rochdale, England, United Kingdom"
  center: [number, number]; // [lng, lat]
  bbox?: [number, number, number, number]; // [west, south, east, north]
};

const STORAGE_KEY = 'selectedTown:v1';

export function getDefaultTown(): TownSelection {
  return {
    label: 'Worthing',
    displayName: 'Worthing, West Sussex, United Kingdom',
    center: [-0.3719, 50.8179],
  };
}

export function loadStoredTown(): TownSelection | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TownSelection;
    if (!parsed?.label || !Array.isArray(parsed.center) || parsed.center.length !== 2) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function storeTown(town: TownSelection) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(town));
  } catch {
    // ignore
  }
}

export function getTownBbox(town: TownSelection): [number, number, number, number] {
  if (town.bbox) return town.bbox;
  // Sensible default bbox around center (roughly town-sized).
  return [town.center[0] - 0.12, town.center[1] - 0.08, town.center[0] + 0.12, town.center[1] + 0.08];
}

