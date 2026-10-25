import { describe, expect, it } from 'vitest';
import {
  DATA_PROVENANCE,
  NO_PUBLIC_POSITIONS_NOTE,
  POSITIONS_PER_CANDIDATE,
  allCandidates,
} from './ballot';

describe('candidate coverage', () => {
  it('records a last-verified date of October 24, 2026', () => {
    expect(DATA_PROVENANCE.lastVerified).toBe('2026-10-24');
    expect(DATA_PROVENANCE.lastVerifiedLabel).toBe('October 24, 2026');
  });

  it('gives every position an https source', () => {
    const missing: string[] = [];
    for (const candidate of allCandidates()) {
      for (const position of candidate.positions) {
        if (!position.source?.startsWith('https://')) {
          missing.push(`${candidate.name} / ${position.issueName}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it('caps sourced positions at two per candidate', () => {
    const over: string[] = [];
    for (const candidate of allCandidates()) {
      if (candidate.positions.length > POSITIONS_PER_CANDIDATE) {
        over.push(`${candidate.name} (${candidate.positions.length})`);
      }
    }
    expect(over).toEqual([]);
  });

  it('uses the same position count for candidates in a race who have sourced positions', () => {
    const byOffice = new Map<string, number[]>();
    for (const candidate of allCandidates()) {
      const counts = byOffice.get(candidate.office) ?? [];
      counts.push(candidate.positions.length);
      byOffice.set(candidate.office, counts);
    }
    const uneven: string[] = [];
    for (const [office, counts] of byOffice) {
      const sourced = counts.filter((n) => n > 0);
      if (sourced.length > 1 && new Set(sourced).size > 1) {
        uneven.push(`${office}: ${counts.join(',')}`);
      }
    }
    expect(uneven).toEqual([]);
  });

  it('uses the uniform note when a candidate has no sourced positions', () => {
    const missingNote: string[] = [];
    for (const candidate of allCandidates()) {
      if (candidate.positions.length === 0) {
        if (candidate.dataStatus !== 'incomplete') {
          missingNote.push(`${candidate.name}: expected incomplete`);
        }
        if (candidate.dataStatusNote !== NO_PUBLIC_POSITIONS_NOTE) {
          missingNote.push(`${candidate.name}: missing uniform note`);
        }
      }
    }
    expect(missingNote).toEqual([]);
  });

  it('marks candidates with two sourced positions complete', () => {
    const unmarked: string[] = [];
    for (const candidate of allCandidates()) {
      if (candidate.positions.length === POSITIONS_PER_CANDIDATE && candidate.dataStatus !== 'complete') {
        unmarked.push(candidate.name);
      }
    }
    expect(unmarked).toEqual([]);
  });
});
