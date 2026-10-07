/**
 * On-device district lookup.
 * Boundaries are lazy-loaded GeoJSON. Coordinates never leave the device
 * except when the user consents to send a typed address to the U.S. Census Geocoder.
 */

import type { UserLocation } from './storage';
import { findFeature, type DistrictCollection } from './geo';

const BASE = `${import.meta.env.BASE_URL}districts/`;

export const CENSUS_GEOCODER_URL = 'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress';

/** Shown in the app. Keep in sync with public/districts/manifest.json. */
export const DISTRICTS_ATTRIBUTION = {
  lastChecked: '2026-10-07',
  lastCheckedLabel: 'October 7, 2026',
  summary:
    'District maps: NCSBE / NCGA U.S. House plan SL 2025-95 (2026), NC Senate SL 2023-146, and NC House SL 2023-149; Mecklenburg County GIS commissioner districts; Charlotte city limits from U.S. Census TIGER/Line 2024. Clipped to Mecklenburg County and simplified for on-device lookup.',
};

export function formatLocationSummary(location: UserLocation): string {
  const parts: string[] = [location.district];
  if (location.ncSenate) parts.push(`Senate ${location.ncSenate}`);
  if (location.ncHouse) parts.push(`House ${location.ncHouse}`);
  if (location.commission) parts.push(`Commission ${location.commission}`);
  parts.push(location.isCharlotte ? 'Charlotte city' : 'Not Charlotte');
  return parts.join(' · ');
}

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

export interface DistrictManifest {
  lastChecked: string;
  layers: { id: string; file: string; source: string; sourceUrl: string; date: string }[];
  clip: string;
}

export interface LookupResult {
  location: UserLocation;
  unmatched: string[];
}

let cache: {
  congress: DistrictCollection | null;
  ncSenate: DistrictCollection | null;
  ncHouse: DistrictCollection | null;
  commission: DistrictCollection | null;
  charlotte: DistrictCollection | null;
} | null = null;

let manifestCache: DistrictManifest | null = null;

async function loadJson<T>(file: string): Promise<T> {
  const res = await fetch(`${BASE}${file}`);
  if (!res.ok) throw new Error(`Could not load ${file}`);
  return res.json() as Promise<T>;
}

export async function loadManifest(): Promise<DistrictManifest> {
  if (manifestCache) return manifestCache;
  manifestCache = await loadJson<DistrictManifest>('manifest.json');
  return manifestCache;
}

export async function loadBoundaries(): Promise<void> {
  if (cache) return;
  const [congress, ncSenate, ncHouse, commission, charlotte] = await Promise.all([
    loadJson<DistrictCollection>('congress.json'),
    loadJson<DistrictCollection>('nc-senate.json'),
    loadJson<DistrictCollection>('nc-house.json'),
    loadJson<DistrictCollection>('commission.json'),
    loadJson<DistrictCollection>('charlotte.json'),
  ]);
  cache = { congress, ncSenate, ncHouse, commission, charlotte };
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
    throw new Error('That location is outside Mecklenburg County. You can pick your area by hand.');
  }
  return result;
}

interface CensusMatch {
  matchedAddress?: string;
  coordinates?: { x: number; y: number };
}

export async function geocodeAddressWithCensus(address: string): Promise<{ lng: number; lat: number; matchedAddress: string }> {
  const params = new URLSearchParams({
    address,
    benchmark: 'Public_AR_Current',
    format: 'json',
  });
  const res = await fetch(`${CENSUS_GEOCODER_URL}?${params.toString()}`);
  if (!res.ok) {
    throw new Error('The Census lookup did not respond. Try again, or pick your area by hand.');
  }
  const data = await res.json() as { result?: { addressMatches?: CensusMatch[] } };
  const match = data.result?.addressMatches?.[0];
  if (!match?.coordinates) {
    throw new Error('We could not find that address. Check the spelling, or pick your area by hand.');
  }
  return {
    lng: match.coordinates.x,
    lat: match.coordinates.y,
    matchedAddress: match.matchedAddress || address,
  };
}

export async function lookupFromAddress(address: string): Promise<LookupResult> {
  const geo = await geocodeAddressWithCensus(address);
  await loadBoundaries();
  const result = lookupPoint(geo.lng, geo.lat, geo.matchedAddress, 'census');
  if (result.unmatched.includes('U.S. House') && !result.location.ncSenate) {
    throw new Error('That address is outside Mecklenburg County. You can pick your area by hand.');
  }
  return result;
}
