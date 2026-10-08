import { describe, expect, it } from 'vitest';
import { allCandidates } from './ballot';

/** Praise/attack words VOTR should not use in its own voice. */
export const LOADED_WORDS = [
  'champion',
  'fighter',
  'fighting',
  'fight',
  'radical',
  'extreme',
  'failed',
  'heroic',
  'brave',
  'courageous',
  'visionary',
  'corrupt',
  'disastrous',
  'unmatched',
  'legendary',
  'criticizes',
];

const LOADED_RE = new RegExp(`\\b(${LOADED_WORDS.join('|')})\\b`, 'i');

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
});
