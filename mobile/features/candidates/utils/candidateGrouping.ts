import type { Candidate } from '../../../shared/types';

const BUCKETS = ['federal', 'state', 'state_legislature', 'local'] as const;
export type OfficeBucket = (typeof BUCKETS)[number];

function emptyGrouped<T>(): Record<OfficeBucket, T[]> {
  return {
    federal: [],
    state: [],
    state_legislature: [],
    local: [],
  };
}

/**
 * Normalize API rows into office buckets; optionally sort each bucket by matchScore (desc).
 */
export function groupCandidatesByOfficeLevel(
  rows: unknown[] | null | undefined,
  sortByMatch: boolean
): Record<OfficeBucket, Record<string, unknown>[]> {
  const grouped = emptyGrouped<Record<string, unknown>>();
  for (const raw of rows || []) {
    const c = raw as Record<string, unknown>;
    const normalized = { ...c, photo: c.photo ?? c.photo_url };
    const level = String(c.office_level || c.officeLevel || 'local');
    const bucket = (level in grouped ? level : 'local') as OfficeBucket;
    grouped[bucket].push(normalized);
  }
  if (sortByMatch) {
    for (const k of BUCKETS) {
      grouped[k].sort(
        (a, b) =>
          (Number((b as { matchScore?: number }).matchScore) || 0) -
          (Number((a as { matchScore?: number }).matchScore) || 0)
      );
    }
  }
  return grouped;
}

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
