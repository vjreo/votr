import { describe, expect, it } from 'vitest';
import { allCandidates } from './ballot';
import { LOADED_RE } from './loadedWords';
import { MEASURES } from './offices';

describe('candidate copy neutrality', () => {
  it('does not use loaded praise or attack words in bios or issue stances', () => {
    const hits: string[] = [];
    for (const candidate of allCandidates()) {
      const fields = [
        ['bio', candidate.bio],
        ...candidate.positions.map((p) => [`${p.issueName} stance`, p.stance] as const),
      ] as const;
      for (const [label, text] of fields) {
        if (!text) continue;
        const match = text.match(LOADED_RE);
        if (match) hits.push(`${candidate.name} ${label}: "${match[0]}" in "${text}"`);
      }
    }
    expect(hits).toEqual([]);
  });

  it('does not use loaded praise or attack words in draft measure arguments', () => {
    const hits: string[] = [];
    for (const measure of Object.values(MEASURES)) {
      const claims = [...(measure.caseFor ?? []), ...(measure.caseAgainst ?? [])];
      for (const claim of claims) {
        const match = claim.text.match(LOADED_RE);
        if (match) hits.push(`${measure.id}: "${match[0]}" in "${claim.text}"`);
      }
    }
    expect(hits).toEqual([]);
  });
});
