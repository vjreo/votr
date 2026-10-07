/**
 * On-device district lookup.
 * Boundaries and Mecklenburg address points are lazy-loaded.
 * Coordinates and typed addresses never leave the device.
 */

import type { UserLocation } from './storage';
import { findFeature, type DistrictCollection } from './geo';

const DISTRICTS_BASE = `${import.meta.env.BASE_URL}districts/`;
const ADDRESSES_BASE = `${import.meta.env.BASE_URL}addresses/`;

/** Shown in the app. Keep in sync with public/districts/manifest.json. */
export const DISTRICTS_ATTRIBUTION = {
  lastChecked: '2026-10-07',
  lastCheckedLabel: 'October 7, 2026',
  summary:
    'District maps: NCSBE / NCGA U.S. House plan SL 2025-95 (2026), NC Senate SL 2023-146, and NC House SL 2023-149; Mecklenburg County GIS commissioner districts; Charlotte city limits from U.S. Census TIGER/Line 2024. Addresses: Mecklenburg County GIS Master Address Points. Clipped to Mecklenburg County and simplified for on-device lookup.',
};

const STREET_SUFFIX: Record<string, string> = {
  STREET: 'ST',
  STR: 'ST',
  AVENUE: 'AVE',
  AV: 'AVE',
  ROAD: 'RD',
  DRIVE: 'DR',
  LANE: 'LN',
  COURT: 'CT',
  PLACE: 'PL',
  TERRACE: 'TER',
  CIRCLE: 'CIR',
  BOULEVARD: 'BLVD',
  PARKWAY: 'PKWY',
  HIGHWAY: 'HWY',
  TRAIL: 'TRL',
  POINT: 'PT',
  SQUARE: 'SQ',
};
const STREET_DIR: Record<string, string> = {
  NORTH: 'N',
  SOUTH: 'S',
  EAST: 'E',
  WEST: 'W',
  NORTHEAST: 'NE',
  NORTHWEST: 'NW',
  SOUTHEAST: 'SE',
  SOUTHWEST: 'SW',
};
const DROP_TAIL = new Set([
  'NC', 'CAROLINA', 'USA', 'UNITED', 'STATES', 'COUNTY', 'MECKLENBURG',
  'CHARLOTTE', 'HUNTERSVILLE', 'MATTHEWS', 'CORNELIUS', 'DAVIDSON', 'PINEVILLE',
  'STALLINGS', 'WEDDINGTON', 'HARRISBURG',
]);

export function manualLocation(
  address: string,
  district: UserLocation['district'],
  isCharlotte: boolean
): UserLocation {
  return {
    address: address.trim() || 'Picked by hand',
    district,
    isCharlotte,
    lookupSource: 'manual',
  };
}

export interface LookupResult {
  location: UserLocation;
  unmatched: string[];
}

export interface AddressSuggestion {
  label: string;
  query: string;
}

interface ZipPack {
  z: string;
  s: string[];
  p: [string | number, number, number, number][];
}

let cache: {
  congress: DistrictCollection | null;
  ncSenate: DistrictCollection | null;
  ncHouse: DistrictCollection | null;
  commission: DistrictCollection | null;
  charlotte: DistrictCollection | null;
} | null = null;

const zipCache = new Map<string, ZipPack>();
let streetIndex: Record<string, string[]> | null = null;

async function loadJson<T>(base: string, file: string): Promise<T> {
  const res = await fetch(`${base}${file}`);
  if (!res.ok) throw new Error(`Could not load ${file}`);
  return res.json() as Promise<T>;
}

async function loadPackedJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Could not load the address list');
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  if (bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b) {
    const DS = (globalThis as { DecompressionStream?: new (format: string) => TransformStream<Uint8Array, Uint8Array> }).DecompressionStream;
    if (!DS) {
      throw new Error('This browser cannot read the address list. Pick your area by hand.');
    }
    const stream = new Response(buf).body!.pipeThrough(new DS('gzip'));
    const text = await new Response(stream).text();
    return JSON.parse(text) as T;
  }
  return JSON.parse(new TextDecoder().decode(buf)) as T;
}

export async function loadBoundaries(): Promise<void> {
  if (cache) return;
  const [congress, ncSenate, ncHouse, commission, charlotte] = await Promise.all([
    loadJson<DistrictCollection>(DISTRICTS_BASE, 'congress.json'),
    loadJson<DistrictCollection>(DISTRICTS_BASE, 'nc-senate.json'),
    loadJson<DistrictCollection>(DISTRICTS_BASE, 'nc-house.json'),
    loadJson<DistrictCollection>(DISTRICTS_BASE, 'commission.json'),
    loadJson<DistrictCollection>(DISTRICTS_BASE, 'charlotte.json'),
  ]);
  cache = { congress, ncSenate, ncHouse, commission, charlotte };
}

export function normalizeStreetTokens(raw: string): string {
  const parts = raw.toUpperCase().replace(/[#.,]/g, ' ').split(/\s+/).filter(Boolean);
  return parts.map((p) => STREET_DIR[p] || STREET_SUFFIX[p] || p).join(' ');
}

export function parseTypedAddress(raw: string): { house: string; street: string; zip: string | null } {
  let s = raw.toUpperCase();
  // Last 5-digit token is the ZIP (optional +4). A leading 5-digit house
  // number like 12316 is not a ZIP unless the query is only that number.
  const zipMatches = [...s.matchAll(/\b(\d{5})(?:-\d{4})?\b/g)];
  let zip: string | null = null;
  if (zipMatches.length) {
    const last = zipMatches[zipMatches.length - 1];
    const atStart = last.index === 0;
    const onlyToken = atStart && s.slice(last[0].length).trim() === '';
    if (!atStart || onlyToken) {
      zip = last[1];
      s = `${s.slice(0, last.index)} ${s.slice((last.index ?? 0) + last[0].length)}`;
    }
  }
  s = s.replace(/\b(APT|APARTMENT|UNIT|STE|SUITE|FL|FLOOR)\b.*$/i, ' ');
  s = normalizeStreetTokens(s);
  const tokens = s.split(/\s+/).filter((t) => t && !DROP_TAIL.has(t) && t !== 'NC');
  const house = tokens[0] && /^\d/.test(tokens[0]) ? tokens[0] : '';
  const street = (house ? tokens.slice(1) : tokens).join(' ');
  return { house, street, zip };
}

async function loadZip(zip: string): Promise<ZipPack> {
  const hit = zipCache.get(zip);
  if (hit) return hit;
  const pack = await loadPackedJson<ZipPack>(`${ADDRESSES_BASE}${zip}.json.gz`);
  zipCache.set(zip, pack);
  return pack;
}

async function zipsForStreet(street: string): Promise<string[]> {
  if (!streetIndex) {
    streetIndex = await loadPackedJson<Record<string, string[]>>(`${ADDRESSES_BASE}streets.json.gz`);
  }
  return streetIndex[street] || [];
}

function matchInPack(pack: ZipPack, house: string, street: string): { lng: number; lat: number; label: string } | null {
  const streetIdx = new Set<number>();
  for (let i = 0; i < pack.s.length; i++) {
    if (pack.s[i] === street) streetIdx.add(i);
  }
  const houseNum = /^\d+$/.test(house) ? Number(house) : house;
  for (const [hn, si, lngE5, latE5] of pack.p) {
    if (streetIdx.size && !streetIdx.has(si)) continue;
    if (streetIdx.size === 0 && pack.s[si] !== street && !pack.s[si].startsWith(`${street} `) && pack.s[si] !== street) continue;
    if (String(hn) === String(house) || hn === houseNum) {
      return {
        lng: lngE5 / 1e5,
        lat: latE5 / 1e5,
        label: `${hn} ${pack.s[si]}, ${pack.z}`,
      };
    }
  }
  return null;
}

export function lookupPoint(lng: number, lat: number, address: string, source: UserLocation['lookupSource']): LookupResult {
  if (!cache) {
    throw new Error('District maps are not loaded yet');
  }
  const unmatched: string[] = [];
  const congress = findFeature(lng, lat, cache.congress);
  const senate = findFeature(lng, lat, cache.ncSenate);
  const house = findFeature(lng, lat, cache.ncHouse);
  const commission = findFeature(lng, lat, cache.commission);
  const city = findFeature(lng, lat, cache.charlotte);

  if (!congress) unmatched.push('U.S. House');
  if (!senate) unmatched.push('NC Senate');
  if (!house) unmatched.push('NC House');
  if (!commission) unmatched.push('County Commission');

  const district = (congress?.properties.id || 'NC-12') as UserLocation['district'];
  if (district !== 'NC-8' && district !== 'NC-12' && district !== 'NC-14') {
    unmatched.push('U.S. House');
  }

  const location: UserLocation = {
    address,
    district: district === 'NC-8' || district === 'NC-12' || district === 'NC-14' ? district : 'NC-12',
    isCharlotte: Boolean(city),
    ncSenate: senate?.properties.id,
    ncHouse: house?.properties.id,
    commission: commission?.properties.id,
    lookupSource: source,
  };

  return { location, unmatched };
}

export const OUTSIDE_COUNTY_MESSAGE =
  'VOTR covers Mecklenburg County for now. Pick your area by hand, or confirm with the state.';
export const ADDRESS_NOT_FOUND_MESSAGE =
  'We could not find that address. Check the spelling and ZIP, or pick your area by hand.';

let zipIndex: Set<string> | null = null;

async function knownZips(): Promise<Set<string>> {
  if (zipIndex) return zipIndex;
  const idx = await loadJson<{ zips: Record<string, unknown> }>(ADDRESSES_BASE, 'index.json');
  zipIndex = new Set(Object.keys(idx.zips));
  return zipIndex;
}

export async function lookupFromGeolocation(): Promise<LookupResult> {
  await loadBoundaries();
  const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('This browser cannot share a location'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 12000,
      maximumAge: 60_000,
    });
  });
  const { longitude: lng, latitude: lat } = pos.coords;
  const result = lookupPoint(lng, lat, 'Near me (this device)', 'geolocation');
  if (result.unmatched.includes('U.S. House') && !result.location.ncSenate) {
    throw new Error(OUTSIDE_COUNTY_MESSAGE);
  }
  return result;
}

export async function geocodeAddressOnDevice(address: string): Promise<{ lng: number; lat: number; matchedAddress: string }> {
  const parsed = parseTypedAddress(address);
  if (!parsed.street) {
    throw new Error('Add a street name, or pick your area by hand.');
  }
  if (parsed.zip) {
    const known = await knownZips();
    if (!known.has(parsed.zip)) {
      throw new Error(OUTSIDE_COUNTY_MESSAGE);
    }
  }
  let zips = parsed.zip ? [parsed.zip] : await zipsForStreet(parsed.street);
  if (parsed.zip && !zips.length) zips = [parsed.zip];
  if (!zips.length) {
    throw new Error('Add a ZIP code (for example 28202), or pick your area by hand.');
  }
  if (zips.length > 6) zips = zips.slice(0, 6);
  for (const zip of zips) {
    try {
      const pack = await loadZip(zip);
      const hit = matchInPack(pack, parsed.house, parsed.street);
      if (hit) return { lng: hit.lng, lat: hit.lat, matchedAddress: hit.label };
    } catch {
      // missing zip file — try the next
    }
  }
  throw new Error(ADDRESS_NOT_FOUND_MESSAGE);
}

export async function lookupFromAddress(address: string): Promise<LookupResult> {
  const geo = await geocodeAddressOnDevice(address);
  await loadBoundaries();
  const result = lookupPoint(geo.lng, geo.lat, geo.matchedAddress, 'address');
  if (result.unmatched.includes('U.S. House') && !result.location.ncSenate) {
    throw new Error(OUTSIDE_COUNTY_MESSAGE);
  }
  return result;
}

function houseMatches(hn: string | number, house: string): boolean {
  if (!house) return true;
  return String(hn).startsWith(house);
}

async function zipsForStreetPrefix(prefix: string): Promise<string[]> {
  if (!streetIndex) {
    streetIndex = await loadPackedJson<Record<string, string[]>>(`${ADDRESSES_BASE}streets.json.gz`);
  }
  const zips: string[] = [];
  const seen = new Set<string>();
  for (const [name, list] of Object.entries(streetIndex)) {
    if (!name.startsWith(prefix)) continue;
    for (const zip of list) {
      if (seen.has(zip)) continue;
      seen.add(zip);
      zips.push(zip);
      if (zips.length >= 1) return zips;
    }
  }
  return zips;
}

function collectSuggestions(
  pack: ZipPack,
  house: string,
  street: string,
  limit: number,
  out: AddressSuggestion[],
  seen: Set<string>
): void {
  for (const [hn, si] of pack.p) {
    const st = pack.s[si];
    if (street && !st.startsWith(street)) continue;
    if (!houseMatches(hn, house)) continue;
    const label = `${hn} ${st}, ${pack.z}`;
    if (seen.has(label)) continue;
    seen.add(label);
    out.push({ label, query: label });
    if (out.length >= limit) return;
  }
}

/**
 * Prefix suggestions from the on-device address packs.
 * ZIP-gated when a ZIP is present; otherwise loads at most one pack
 * after a house number and a short street prefix.
 */
export async function suggestAddresses(raw: string, limit = 8): Promise<AddressSuggestion[]> {
  const parsed = parseTypedAddress(raw);
  if (raw.trim().length < 3) return [];

  let zips: string[] = [];
  if (parsed.zip) {
    if (!parsed.house && parsed.street.length < 2) return [];
    zips = [parsed.zip];
  } else {
    if (!parsed.house || parsed.street.length < 4) return [];
    zips = await zipsForStreetPrefix(parsed.street);
  }
  if (!zips.length) return [];

  const out: AddressSuggestion[] = [];
  const seen = new Set<string>();
  for (const zip of zips) {
    try {
      collectSuggestions(await loadZip(zip), parsed.house, parsed.street, limit, out, seen);
    } catch {
      // missing zip file — skip
    }
    if (out.length >= limit) break;
  }
  return out;
}
