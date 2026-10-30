import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { allCandidates } from './ballot';

const PARTY_COLOR_RE =
  /\.(democrat|republican|party--d|party--r|party-democrat|party-republican)\b/i;

describe('unbiased presentation rules', () => {
  it('gives every candidate the same field shape', () => {
    const uneven: string[] = [];
    for (const candidate of allCandidates()) {
      if (typeof candidate.id !== 'string' || !candidate.id) uneven.push(`${candidate.name}: id`);
      if (typeof candidate.name !== 'string' || !candidate.name) uneven.push(`${candidate.name}: name`);
      if (typeof candidate.party !== 'string' || !candidate.party) uneven.push(`${candidate.name}: party`);
      if (typeof candidate.office !== 'string' || !candidate.office) uneven.push(`${candidate.name}: office`);
      if (!Array.isArray(candidate.positions)) uneven.push(`${candidate.name}: positions`);
      if (!Array.isArray(candidate.sources)) uneven.push(`${candidate.name}: sources`);
      if (candidate.dataStatus !== 'complete' && candidate.dataStatus !== 'incomplete') {
        uneven.push(`${candidate.name}: dataStatus`);
      }
    }
    expect(uneven).toEqual([]);
  });

  it('uses https links on every candidate source', () => {
    const missing: string[] = [];
    for (const candidate of allCandidates()) {
      for (const source of candidate.sources) {
        if (!source.url.startsWith('https://')) {
          missing.push(`${candidate.name} / ${source.title}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it('does not color-code parties red or blue in global CSS', () => {
    const css = readFileSync(resolve(import.meta.dirname, '../styles.css'), 'utf8');
    expect(css).toMatch(/politically neutral \(no red\/blue party coding\)/);
    expect(css).toContain('--color-accent: #0a6163');
    expect(css).not.toMatch(PARTY_COLOR_RE);
    expect(css).not.toMatch(/--color-democrat|--color-republican/i);
  });

  it('does not attach party colors in ballot or detail styles', () => {
    const ballot = readFileSync(resolve(import.meta.dirname, '../components/YourBallot.tsx'), 'utf8');
    const detail = readFileSync(
      resolve(import.meta.dirname, '../components/CandidateDetail.tsx'),
      'utf8'
    );
    expect(ballot).not.toMatch(PARTY_COLOR_RE);
    expect(detail).not.toMatch(PARTY_COLOR_RE);
    expect(ballot).toContain('ballot__candidate-party');
    expect(ballot).toContain('sortCandidatesAlphabetically');
  });
});
