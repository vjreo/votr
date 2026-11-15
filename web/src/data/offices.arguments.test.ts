import { describe, expect, it } from 'vitest';
import { auditPairedArguments } from './argumentAudit';
import { MEASURES, pairedArguments, type MeasureExplainer } from './offices';

const MEASURE_IDS = [
  'nc-amend-photo-id-2026',
  'nc-amend-income-tax-2026',
  'nc-amend-property-tax-2026',
  'clt-bonds-transportation-2026',
  'clt-bonds-housing-2026',
  'clt-bonds-neighborhood-2026',
];

describe('paired argument audit', () => {
  it('lets a pair drop the draft label only when length, tone, and sources pass', () => {
    const stillDraft: string[] = [];
    for (const id of MEASURE_IDS) {
      const audit = auditPairedArguments(MEASURES[id]);
      const pair = pairedArguments(MEASURES[id]);
      expect(pair, id).not.toBeNull();
      if (!audit.ok) stillDraft.push(`${id}: ${audit.reasons.join(' ')}`);
      expect(pair!.draft, id).toBe(!audit.ok);
      for (const claim of [...pair!.for, ...pair!.against]) {
        expect(claim.text.trim().length, id).toBeGreaterThan(40);
        expect(claim.source.url, id).toMatch(/^https:\/\//);
      }
    }
    expect(stillDraft).toEqual([]);
  });

  it('keeps the draft label when the sides are not comparable', () => {
    const uneven: MeasureExplainer = {
      ...MEASURES['nc-amend-photo-id-2026'],
      caseFor: [
        {
          text: 'One short sourced sentence about the amendment and nothing more than that.',
          source: { title: 'Session law', url: 'https://example.com/law' },
        },
      ],
      caseAgainst: [
        {
          text: 'A much longer opposing claim that keeps going so the two sides are no longer within twenty percent of each other in length and the draft label has to stay.',
          source: { title: 'Session law', url: 'https://example.com/law' },
        },
      ],
    };
    expect(auditPairedArguments(uneven).ok).toBe(false);
    expect(pairedArguments(uneven)?.draft).toBe(true);
  });

  it('flags a missing source, a loaded word, and a push to vote', () => {
    const bad: MeasureExplainer = {
      ...MEASURES['clt-bonds-housing-2026'],
      caseFor: [{ text: 'Vote yes. This is a vital change!', source: { title: '', url: 'http://example.com' } }],
      caseAgainst: [{ text: 'Vote yes. This is a vital change!', source: { title: 'Ballot', url: 'https://example.com/ballot' } }],
    };
    const audit = auditPairedArguments(bad);
    expect(audit.ok).toBe(false);
    expect(audit.reasons.join(' ')).toMatch(/https source/);
    expect(audit.reasons.join(' ')).toMatch(/vital/i);
    expect(audit.reasons.join(' ')).toMatch(/how to vote|exclamation/i);
  });

  it('does not return a pair when one side is empty', () => {
    const oneSided: MeasureExplainer = {
      ...MEASURES['nc-amend-photo-id-2026'],
      caseAgainst: [{ text: '   ', source: { title: 'x', url: 'https://example.com' } }],
    };
    expect(pairedArguments(oneSided)).toBeNull();
    expect(pairedArguments(null)).toBeNull();
    expect(auditPairedArguments(null).ok).toBe(false);
  });
});
