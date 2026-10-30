import type { Candidate } from '../data/ballot';
import type { DistrictCollection, DistrictFeature } from '../utils/geo';
import type { UserLocation } from '../utils/storage';

export const charlotteLocation: UserLocation = {
  address: '100 N TRYON ST, 28202',
  district: 'NC-14',
  isCharlotte: true,
  ncSenate: '41',
  ncHouse: '104',
  commission: '2',
  zip: '28202',
  place: 'Charlotte',
  lookupSource: 'address',
};

export const huntersvilleLocation: UserLocation = {
  address: '12316 FOLKSTON DR, 28078',
  district: 'NC-12',
  isCharlotte: false,
  ncSenate: '38',
  ncHouse: '98',
  zip: '28078',
  place: 'Huntersville',
  lookupSource: 'manual',
};

export function candidate(partial: Partial<Candidate> = {}): Candidate {
  return {
    id: 'test-cand',
    name: 'Test Person',
    party: 'Democratic',
    office: 'U.S. House NC-12',
    officeLevel: 'federal',
    district: 'NC-12',
    positions: [],
    sources: [],
    dataStatus: 'incomplete',
    ...partial,
  };
}

export function squareFeature(
  id: string,
  kind: string,
  label: string,
  lng0 = -81,
  lat0 = 35,
  lng1 = -80,
  lat1 = 36
): DistrictFeature {
  return {
    type: 'Feature',
    properties: { id, kind, label },
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [lng0, lat0],
          [lng1, lat0],
          [lng1, lat1],
          [lng0, lat1],
          [lng0, lat0],
        ],
      ],
    },
  };
}

export function collection(features: DistrictFeature[]): DistrictCollection {
  return { type: 'FeatureCollection', features };
}
