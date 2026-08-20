import type { Candidate } from '../../../shared/types';

export function toSwipeCandidate(row: Record<string, unknown>, state: string): Candidate {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    office: String(row.office ?? ''),
    officeLevel: (row.office_level || row.officeLevel || 'local') as Candidate['officeLevel'],
    party: row.party != null ? String(row.party) : undefined,
    photo: (row.photo || row.photo_url) as string | undefined,
    positions: Array.isArray(row.positions) ? row.positions : [],
    sources: Array.isArray(row.sources) ? row.sources : [],
    district: row.district != null ? String(row.district) : undefined,
    state: String(row.state ?? state),
    bio: row.bio != null ? String(row.bio) : undefined,
    apiSource: String(row.api_source || row.apiSource || 'db'),
    createdAt: (row.created_at as Date) || new Date(),
    updatedAt: (row.updated_at as Date) || new Date(),
    matchScore: typeof row.matchScore === 'number' ? row.matchScore : undefined,
  };
}

const LEVEL_ORDER: Record<string, number> = {
  federal: 0,
  state: 1,
  state_legislature: 2,
  local: 3,
};

function compareMatchScoreDesc(a: Candidate, b: Candidate): number {
  const as = a.matchScore;
  const bs = b.matchScore;
  if (as == null && bs == null) return 0;
  if (as == null) return 1;
  if (bs == null) return -1;
  return bs - as;
}

export type OfficeGroup = {
  office: string;
  officeLevel: string;
  candidates: Candidate[];
};

export function groupCandidatesByOffice(
  rows: Candidate[],
  sortByMatch: boolean
): OfficeGroup[] {
  const map = new Map<string, OfficeGroup>();
  for (const c of rows) {
    const office = c.office || 'Other';
    const officeLevel = String(c.officeLevel || 'local');
    let group = map.get(office);
    if (!group) {
      group = { office, officeLevel, candidates: [] };
      map.set(office, group);
    }
    group.candidates.push(c);
  }
  if (sortByMatch) {
    for (const g of map.values()) {
      g.candidates.sort(compareMatchScoreDesc);
    }
  }
  return [...map.values()].sort((a, b) => {
    const lo = (LEVEL_ORDER[a.officeLevel] ?? 9) - (LEVEL_ORDER[b.officeLevel] ?? 9);
    if (lo !== 0) return lo;
    return a.office.localeCompare(b.office);
  });
}
