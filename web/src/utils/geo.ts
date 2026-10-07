/**
 * Point-in-polygon for GeoJSON Polygon / MultiPolygon.
 * Coordinates are [lng, lat]. Runs entirely on-device.
 */

export type GeoJSONPosition = [number, number];
export type GeoJSONRing = GeoJSONPosition[];

export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: GeoJSONRing[];
}

export interface GeoJSONMultiPolygon {
  type: 'MultiPolygon';
  coordinates: GeoJSONRing[][];
}

export type GeoJSONGeometry = GeoJSONPolygon | GeoJSONMultiPolygon | { type: string; coordinates: unknown };

export interface DistrictFeature {
  type: 'Feature';
  properties: { id: string; kind: string; label: string };
  geometry: GeoJSONGeometry;
}

export interface DistrictCollection {
  type: 'FeatureCollection';
  features: DistrictFeature[];
}

/** Ray-cast against a linear ring (lng/lat). */
export function pointInRing(lng: number, lat: number, ring: GeoJSONRing): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    if (yi === yj) continue;
    const intersect = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInPolygonCoords(lng: number, lat: number, rings: GeoJSONRing[]): boolean {
  if (!rings.length) return false;
  if (!pointInRing(lng, lat, rings[0])) return false;
  for (let i = 1; i < rings.length; i++) {
    if (pointInRing(lng, lat, rings[i])) return false; // hole
  }
  return true;
}

export function pointInGeometry(lng: number, lat: number, geometry: GeoJSONGeometry): boolean {
  if (geometry.type === 'Polygon') {
    return pointInPolygonCoords(lng, lat, geometry.coordinates as GeoJSONRing[]);
  }
  if (geometry.type === 'MultiPolygon') {
    const polys = geometry.coordinates as GeoJSONRing[][];
    return polys.some((rings) => pointInPolygonCoords(lng, lat, rings));
  }
  return false;
}

export function findFeature(lng: number, lat: number, fc: DistrictCollection | null): DistrictFeature | null {
  if (!fc) return null;
  for (const f of fc.features) {
    if (pointInGeometry(lng, lat, f.geometry)) return f;
  }
  return null;
}
