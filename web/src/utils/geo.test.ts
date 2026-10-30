import { describe, expect, it } from 'vitest';
import {
  findFeature,
  pointInGeometry,
  pointInRing,
  type GeoJSONGeometry,
} from './geo';
import { collection, squareFeature } from '../test/fixtures';

const UNIT_SQUARE = [
  [0, 0],
  [2, 0],
  [2, 2],
  [0, 2],
  [0, 0],
] as [number, number][];

describe('pointInRing', () => {
  it('detects points inside, outside, and on a horizontal edge skip', () => {
    expect(pointInRing(1, 1, UNIT_SQUARE)).toBe(true);
    expect(pointInRing(3, 1, UNIT_SQUARE)).toBe(false);
    expect(pointInRing(-1, 1, UNIT_SQUARE)).toBe(false);
    expect(pointInRing(1, -1, UNIT_SQUARE)).toBe(false);
  });
});

describe('pointInGeometry', () => {
  it('handles polygons with holes', () => {
    const withHole: GeoJSONGeometry = {
      type: 'Polygon',
      coordinates: [
        UNIT_SQUARE,
        [
          [0.5, 0.5],
          [1.5, 0.5],
          [1.5, 1.5],
          [0.5, 1.5],
          [0.5, 0.5],
        ],
      ],
    };
    expect(pointInGeometry(1, 1, withHole)).toBe(false);
    expect(pointInGeometry(0.25, 0.25, withHole)).toBe(true);
    expect(pointInGeometry(1, 1, { type: 'Polygon', coordinates: [] })).toBe(false);
  });

  it('matches any polygon in a MultiPolygon', () => {
    const multi: GeoJSONGeometry = {
      type: 'MultiPolygon',
      coordinates: [
        [
          [
            [10, 10],
            [12, 10],
            [12, 12],
            [10, 12],
            [10, 10],
          ],
        ],
        [UNIT_SQUARE],
      ],
    };
    expect(pointInGeometry(1, 1, multi)).toBe(true);
    expect(pointInGeometry(5, 5, multi)).toBe(false);
  });

  it('rejects unknown geometry types', () => {
    expect(pointInGeometry(1, 1, { type: 'LineString', coordinates: [] })).toBe(false);
  });
});

describe('findFeature', () => {
  it('returns the first matching feature or null', () => {
    const nc12 = squareFeature('NC-12', 'congress', 'NC-12');
    const nc14 = squareFeature('NC-14', 'congress', 'NC-14', -79, 35, -78, 36);
    const fc = collection([nc12, nc14]);

    expect(findFeature(-80.5, 35.5, fc)?.properties.id).toBe('NC-12');
    expect(findFeature(-78.5, 35.5, fc)?.properties.id).toBe('NC-14');
    expect(findFeature(0, 0, fc)).toBeNull();
    expect(findFeature(-80.5, 35.5, null)).toBeNull();
  });
});
