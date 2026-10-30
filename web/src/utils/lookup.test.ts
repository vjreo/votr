import { gzipSync } from 'node:zlib';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { collection, squareFeature } from '../test/fixtures';
import {
  ADDRESS_NOT_FOUND_MESSAGE,
  OUTSIDE_COUNTY_MESSAGE,
  geocodeAddressOnDevice,
  loadBoundaries,
  lookupFromAddress,
  lookupFromGeolocation,
  lookupPoint,
  manualLocation,
  normalizeStreetTokens,
  parseTypedAddress,
  resetLookupCaches,
  suggestAddresses,
} from './lookup';

const INSIDE = { lng: -80.5, lat: 35.5 };

const zipPack = {
  z: '28202',
  s: ['MAIN ST', 'TRYON ST'],
  p: [
    [100, 0, Math.round(INSIDE.lng * 1e5), Math.round(INSIDE.lat * 1e5)],
    ['200', 1, Math.round(INSIDE.lng * 1e5), Math.round(INSIDE.lat * 1e5)],
  ] as [string | number, number, number, number][],
};

const otherPack = {
  z: '28203',
  s: ['MAIN ST'],
  p: [[100, 0, -7800000, 3550000]] as [string | number, number, number, number][],
};

function jsonRes(data: unknown) {
  const text = JSON.stringify(data);
  return {
    ok: true,
    json: async () => data,
    arrayBuffer: async () => new TextEncoder().encode(text).buffer,
  };
}

function gzipRes(data: unknown) {
  const buf = gzipSync(JSON.stringify(data));
  const copy = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  return {
    ok: true,
    json: async () => {
      throw new Error('gzip payload');
    },
    arrayBuffer: async () => copy,
  };
}

function failRes() {
  return { ok: false, status: 404, json: async () => ({}), arrayBuffer: async () => new ArrayBuffer(0) };
}

function installFetch(routes: Record<string, unknown>) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      const hit = Object.entries(routes).find(([key]) => url.includes(key));
      if (!hit) return failRes();
      return hit[1] as ReturnType<typeof jsonRes>;
    })
  );
}

const maps = {
  'districts/congress.json': jsonRes(
    collection([squareFeature('NC-12', 'congress', 'NC-12')])
  ),
  'districts/nc-senate.json': jsonRes(
    collection([squareFeature('41', 'senate', 'Senate 41')])
  ),
  'districts/nc-house.json': jsonRes(collection([squareFeature('104', 'house', 'House 104')])),
  'districts/commission.json': jsonRes(
    collection([squareFeature('2', 'commission', 'Commission 2')])
  ),
  'districts/charlotte.json': jsonRes(
    collection([squareFeature('charlotte', 'city', 'Charlotte')])
  ),
};

describe('address parsing', () => {
  it('normalizes directions and street suffixes', () => {
    expect(normalizeStreetTokens('North Tryon Street')).toBe('N TRYON ST');
    expect(normalizeStreetTokens('S. Boulevard,')).toBe('S BLVD');
  });

  it('parses house, street, and trailing ZIP (not a 5-digit house number)', () => {
    expect(parseTypedAddress('12316 Folkston Drive, Charlotte NC 28078')).toEqual({
      house: '12316',
      street: 'FOLKSTON DR',
      zip: '28078',
    });
    expect(parseTypedAddress('100 MAIN ST APT 4B, 28202-1234')).toEqual({
      house: '100',
      street: 'MAIN ST',
      zip: '28202',
    });
    expect(parseTypedAddress('28202')).toEqual({ house: '', street: '', zip: '28202' });
    expect(parseTypedAddress('100 MAIN ST')).toEqual({
      house: '100',
      street: 'MAIN ST',
      zip: null,
    });
  });
});

describe('manualLocation', () => {
  it('stores the typed address and place on device without a network lookup', () => {
    const loc = manualLocation('  100 Main St, 28202  ', 'NC-12', true);
    expect(loc.address).toBe('100 Main St, 28202');
    expect(loc.district).toBe('NC-12');
    expect(loc.isCharlotte).toBe(true);
    expect(loc.place).toBe('Charlotte');
    expect(loc.lookupSource).toBe('manual');
    expect(loc.zip).toBe('28202');
  });

  it('uses a fallback label when the field is blank', () => {
    expect(manualLocation('   ', 'NC-8', false).address).toBe('Picked by hand');
  });
});

describe('on-device geocode and district lookup', () => {
  beforeEach(() => {
    resetLookupCaches();
  });

  afterEach(() => {
    resetLookupCaches();
  });

  it('throws until district maps are loaded, then matches a point', async () => {
    expect(() => lookupPoint(INSIDE.lng, INSIDE.lat, 'x', 'address')).toThrow(
      'District maps are not loaded yet'
    );
    installFetch(maps);
    await loadBoundaries();
    await loadBoundaries();
    expect(fetch).toHaveBeenCalledTimes(5);

    const result = lookupPoint(INSIDE.lng, INSIDE.lat, '100 MAIN ST, 28202', 'address');
    expect(result.location.district).toBe('NC-12');
    expect(result.location.ncSenate).toBe('41');
    expect(result.location.ncHouse).toBe('104');
    expect(result.location.commission).toBe('2');
    expect(result.location.isCharlotte).toBe(true);
    expect(result.location.place).toBe('Charlotte');
    expect(result.unmatched).toEqual([]);
  });

  it('records unmatched layers and falls back to NC-12 for unknown house districts', async () => {
    installFetch({
      ...maps,
      'districts/congress.json': jsonRes(
        collection([squareFeature('NC-6', 'congress', 'NC-6')])
      ),
      'districts/nc-senate.json': jsonRes(collection([])),
      'districts/nc-house.json': jsonRes(collection([])),
      'districts/commission.json': jsonRes(collection([])),
      'districts/charlotte.json': jsonRes(collection([])),
    });
    await loadBoundaries();
    const result = lookupPoint(INSIDE.lng, INSIDE.lat, '100 MAIN ST, 28202', 'geolocation');
    expect(result.location.district).toBe('NC-12');
    expect(result.location.isCharlotte).toBe(false);
    expect(result.unmatched).toEqual(
      expect.arrayContaining(['U.S. House', 'NC Senate', 'NC House', 'County Commission'])
    );
  });

  it('geocodes a typed address from a ZIP pack', async () => {
    installFetch({
      ...maps,
      'addresses/index.json': jsonRes({ zips: { '28202': { n: 1 } } }),
      '28202.json.gz': jsonRes(zipPack),
    });
    const geo = await geocodeAddressOnDevice('100 Main Street, 28202');
    expect(geo.matchedAddress).toBe('100 MAIN ST, 28202');
    expect(geo.lng).toBeCloseTo(INSIDE.lng);
    expect(geo.lat).toBeCloseTo(INSIDE.lat);

    const result = await lookupFromAddress('100 Main Street, 28202');
    expect(result.location.lookupSource).toBe('address');
    expect(result.location.district).toBe('NC-12');
  });

  it('reads gzipped address packs', async () => {
    installFetch({
      'addresses/index.json': jsonRes({ zips: { '28202': { n: 1 } } }),
      '28202.json.gz': gzipRes(zipPack),
    });
    const geo = await geocodeAddressOnDevice('200 Tryon St, 28202');
    expect(geo.matchedAddress).toBe('200 TRYON ST, 28202');
  });

  it('looks up a street without a ZIP via the street index', async () => {
    installFetch({
      'streets.json.gz': jsonRes({ 'MAIN ST': ['28202'] }),
      '28202.json.gz': jsonRes(zipPack),
    });
    const geo = await geocodeAddressOnDevice('100 MAIN ST');
    expect(geo.matchedAddress).toContain('MAIN ST');
  });

  it('rejects missing streets, unknown ZIPs, and unmatched addresses', async () => {
    installFetch({
      'addresses/index.json': jsonRes({ zips: { '28202': { n: 1 } } }),
      '28202.json.gz': jsonRes(zipPack),
      'streets.json.gz': jsonRes({}),
    });
    await expect(geocodeAddressOnDevice('28202')).rejects.toThrow('Add a street name');
    await expect(geocodeAddressOnDevice('100 MAIN ST, 99999')).rejects.toThrow(OUTSIDE_COUNTY_MESSAGE);
    await expect(geocodeAddressOnDevice('100 UNKNOWN ST')).rejects.toThrow('Add a ZIP code');
    await expect(geocodeAddressOnDevice('999 MAIN ST, 28202')).rejects.toThrow(
      ADDRESS_NOT_FOUND_MESSAGE
    );
  });

  it('skips a missing ZIP pack and tries the next', async () => {
    installFetch({
      'streets.json.gz': jsonRes({ 'MAIN ST': ['28105', '28202'] }),
      '28105.json.gz': failRes(),
      '28202.json.gz': jsonRes(zipPack),
    });
    const geo = await geocodeAddressOnDevice('100 MAIN ST');
    expect(geo.matchedAddress).toBe('100 MAIN ST, 28202');
  });

  it('caps street-index ZIP scans at six packs', async () => {
    installFetch({
      'streets.json.gz': jsonRes({
        'MAIN ST': ['1', '2', '3', '4', '5', '6', '28202'],
      }),
      '1.json.gz': failRes(),
      '2.json.gz': failRes(),
      '3.json.gz': failRes(),
      '4.json.gz': failRes(),
      '5.json.gz': failRes(),
      '6.json.gz': failRes(),
      '28202.json.gz': jsonRes(zipPack),
    });
    await expect(geocodeAddressOnDevice('100 MAIN ST')).rejects.toThrow(ADDRESS_NOT_FOUND_MESSAGE);
  });

  it('suggests prefix matches and ignores short queries', async () => {
    installFetch({
      '28202.json.gz': jsonRes(zipPack),
      'streets.json.gz': jsonRes({ 'MAIN ST': ['28202'] }),
    });
    expect(await suggestAddresses('12')).toEqual([]);
    expect(await suggestAddresses('28202')).toEqual([]);
    expect(await suggestAddresses('MAIN ST')).toEqual([]);
    const withZip = await suggestAddresses('10 MAIN ST, 28202');
    expect(withZip.map((s) => s.label)).toEqual(['100 MAIN ST, 28202']);
    const streetOnly = await suggestAddresses('MAIN ST, 28202');
    expect(streetOnly.map((s) => s.label)).toEqual(['100 MAIN ST, 28202']);
    const noZip = await suggestAddresses('100 MAIN');
    expect(noZip[0].query).toContain('MAIN ST');
    installFetch({
      '28203.json.gz': failRes(),
    });
    expect(await suggestAddresses('100 MAIN ST, 28203')).toEqual([]);
  });

  it('uses GPS on this device and rejects points outside the county', async () => {
    installFetch(maps);
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: (ok: PositionCallback) => {
          ok({
            coords: {
              longitude: INSIDE.lng,
              latitude: INSIDE.lat,
              accuracy: 10,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null,
            },
            timestamp: Date.now(),
          } as GeolocationPosition);
        },
      },
    });
    const here = await lookupFromGeolocation();
    expect(here.location.lookupSource).toBe('geolocation');
    expect(here.location.address).toBe('Near me (this device)');

    resetLookupCaches();
    installFetch({
      ...maps,
      'districts/congress.json': jsonRes(collection([])),
      'districts/nc-senate.json': jsonRes(collection([])),
    });
    await expect(lookupFromGeolocation()).rejects.toThrow(OUTSIDE_COUNTY_MESSAGE);
  });

  it('fails clearly when this browser has no geolocation', async () => {
    installFetch(maps);
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: undefined,
    });
    await expect(lookupFromGeolocation()).rejects.toThrow('This browser cannot share a location');
  });

  it('treats an unreadable gzip pack as a missing ZIP', async () => {
    vi.stubGlobal('DecompressionStream', undefined);
    installFetch({
      'addresses/index.json': jsonRes({ zips: { '28202': { n: 1 } } }),
      '28202.json.gz': gzipRes(zipPack),
    });
    await expect(geocodeAddressOnDevice('100 MAIN ST, 28202')).rejects.toThrow(
      ADDRESS_NOT_FOUND_MESSAGE
    );
  });

  it('treats a failed district JSON fetch as fatal', async () => {
    installFetch({
      'districts/congress.json': failRes(),
      'districts/nc-senate.json': jsonRes(collection([])),
      'districts/nc-house.json': jsonRes(collection([])),
      'districts/commission.json': jsonRes(collection([])),
      'districts/charlotte.json': jsonRes(collection([])),
    });
    await expect(loadBoundaries()).rejects.toThrow('Could not load congress.json');
  });

  it('rejects geocode results that fall outside Mecklenburg', async () => {
    installFetch({
      ...maps,
      'districts/congress.json': jsonRes(collection([])),
      'districts/nc-senate.json': jsonRes(collection([])),
      'addresses/index.json': jsonRes({ zips: { '28203': { n: 1 } } }),
      '28203.json.gz': jsonRes(otherPack),
    });
    await expect(lookupFromAddress('100 MAIN ST, 28203')).rejects.toThrow(OUTSIDE_COUNTY_MESSAGE);
  });
});
