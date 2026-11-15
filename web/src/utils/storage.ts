/**
 * Local storage utilities for VOTR
 * 
 * All user data stays on device. Nothing is sent to any server.
 * Each device is independent — friends can share the link and 
 * each person's picks are private to their own device.
 */

const STORAGE_KEY = 'votr_data';

export interface UserLocation {
  address: string;
  /** Null when the point is not inside NC-8, NC-12, or NC-14. */
  district: 'NC-8' | 'NC-12' | 'NC-14' | null;
  isCharlotte: boolean;
  ncSenate?: string;
  ncHouse?: string;
  commission?: string;
  /** City or town label, e.g. Charlotte, Huntersville, Unincorporated Mecklenburg. */
  place?: string;
  zip?: string;
  lookupSource?: 'geolocation' | 'address' | 'manual';
}

export interface CandidatePick {
  candidateId: string;
  leaning: 'considering' | 'likely' | 'unlikely';
  timestamp: number;
}

export interface MeasurePick {
  measureId: string;
  leaning: 'for' | 'against' | 'undecided';
  timestamp: number;
}

export interface StoredData {
  location: UserLocation | null;
  candidatePicks: CandidatePick[];
  measurePicks: MeasurePick[];
  lastUpdated: number;
}

const DEFAULT_DATA: StoredData = {
  location: null,
  candidatePicks: [],
  measurePicks: [],
  lastUpdated: Date.now(),
};

const HOUSE_DISTRICTS = new Set(['NC-8', 'NC-12', 'NC-14']);
const CANDIDATE_LEANINGS = new Set(['considering', 'likely', 'unlikely']);
const MEASURE_LEANINGS = new Set(['for', 'against', 'undecided']);
const LOOKUP_SOURCES = new Set(['geolocation', 'address', 'manual']);

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

/** Drop a saved location that cannot drive a ballot. A bad district used to fall through to NC-14. */
export function sanitizeLocation(value: unknown): UserLocation | null {
  if (!value || typeof value !== 'object') return null;
  const loc = value as Record<string, unknown>;
  if (typeof loc.address !== 'string' || !loc.address.trim()) return null;
  const district: UserLocation['district'] | undefined =
    loc.district === null
      ? null
      : typeof loc.district === 'string' && HOUSE_DISTRICTS.has(loc.district)
        ? (loc.district as UserLocation['district'])
        : undefined;
  if (district === undefined) return null;
  if (typeof loc.isCharlotte !== 'boolean') return null;

  const next: UserLocation = {
    address: loc.address,
    district,
    isCharlotte: loc.isCharlotte,
  };
  const ncSenate = optionalString(loc.ncSenate);
  const ncHouse = optionalString(loc.ncHouse);
  const commission = optionalString(loc.commission);
  const place = optionalString(loc.place);
  const zip = optionalString(loc.zip);
  if (ncSenate) next.ncSenate = ncSenate;
  if (ncHouse) next.ncHouse = ncHouse;
  if (commission) next.commission = commission;
  if (place) next.place = place;
  if (zip) next.zip = zip;
  if (typeof loc.lookupSource === 'string' && LOOKUP_SOURCES.has(loc.lookupSource)) {
    next.lookupSource = loc.lookupSource as UserLocation['lookupSource'];
  }
  return next;
}

function sanitizeCandidatePicks(value: unknown): CandidatePick[] {
  if (!Array.isArray(value)) return [];
  return value.filter((pick): pick is CandidatePick => {
    if (!pick || typeof pick !== 'object') return false;
    const row = pick as CandidatePick;
    return typeof row.candidateId === 'string' && CANDIDATE_LEANINGS.has(row.leaning) && typeof row.timestamp === 'number';
  });
}

function sanitizeMeasurePicks(value: unknown): MeasurePick[] {
  if (!Array.isArray(value)) return [];
  return value.filter((pick): pick is MeasurePick => {
    if (!pick || typeof pick !== 'object') return false;
    const row = pick as MeasurePick;
    return typeof row.measureId === 'string' && MEASURE_LEANINGS.has(row.leaning) && typeof row.timestamp === 'number';
  });
}

export function loadData(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_DATA, lastUpdated: Date.now() };
    const parsed = JSON.parse(raw) as Partial<StoredData>;
    return {
      location: sanitizeLocation(parsed.location),
      candidatePicks: sanitizeCandidatePicks(parsed.candidatePicks),
      measurePicks: sanitizeMeasurePicks(parsed.measurePicks),
      lastUpdated: typeof parsed.lastUpdated === 'number' ? parsed.lastUpdated : Date.now(),
    };
  } catch {
    return { ...DEFAULT_DATA, lastUpdated: Date.now() };
  }
}

export function saveData(data: Partial<StoredData>): void {
  try {
    const current = loadData();
    const updated = { 
      ...current, 
      ...data, 
      lastUpdated: Date.now() 
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage unavailable (private browsing, etc.) — silently fail
  }
}

export function clearAllData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silently fail
  }
}

