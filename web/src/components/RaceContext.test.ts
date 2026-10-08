import { describe, expect, it } from 'vitest';
import type { Candidate } from '../data/ballot';
import { jargonForCandidate } from './RaceContext';

function cand(partial: Partial<Candidate>): Candidate {
  return {
    id: 'x',
    name: 'Test',
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

describe('jargonForCandidate', () => {
  it('explains incumbent from the bio', () => {
    expect(jargonForCandidate(cand({ bio: 'Incumbent U.S. Representative for NC-12.' }))).toEqual([
      { term: 'incumbent', meaning: 'currently holds this seat' },
    ]);
  });

  it('explains at-large from the office title', () => {
    expect(
      jargonForCandidate(
        cand({ office: 'Mecklenburg Commissioners At-Large', district: 'At-Large', bio: '' })
      )
    ).toEqual([{ term: 'at-large', meaning: 'elected by the whole county' }]);
  });

  it('stays quiet when there is no jargon', () => {
    expect(jargonForCandidate(cand({ bio: 'Attorney in Charlotte.', office: 'NC Senate District 41' }))).toEqual(
      []
    );
  });
});
