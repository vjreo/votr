import { describe, expect, it } from 'vitest';
import { MEASURES, pairedArguments, type MeasureExplainer } from './offices';

const MEASURE_IDS = [
  'nc-amend-photo-id-2026',
  'nc-amend-income-tax-2026',
  'nc-amend-property-tax-2026',
  'clt-bonds-transportation-2026',
  'clt-bonds-housing-2026',
  'clt-bonds-neighborhood-2026',
];

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

describe('draft paired arguments', () => {
  it('gives each of the six measures two sourced sides of similar length', () => {
    for (const id of MEASURE_IDS) {
      const pair = pairedArguments(MEASURES[id]);
      expect(pair, id).not.toBeNull();
      expect(pair!.draft).toBe(true);
      const forWords = wordCount(pair!.for.map((claim) => claim.text).join(' '));
      const againstWords = wordCount(pair!.against.map((claim) => claim.text).join(' '));
      expect(Math.abs(forWords - againstWords), `${id}: ${forWords} for vs ${againstWords} against`).toBeLessThanOrEqual(12);
      for (const claim of [...pair!.for, ...pair!.against]) {
        expect(claim.text.trim().length).toBeGreaterThan(40);
        expect(claim.source.title.trim().length).toBeGreaterThan(0);
        expect(claim.source.url).toMatch(/^https:\/\//);
      }
    }
  });

  it('does not return a pair when one side is empty', () => {
    const oneSided: MeasureExplainer = {
      ...MEASURES['nc-amend-photo-id-2026'],
      caseAgainst: [{ text: '   ', source: { title: 'x', url: 'https://example.com' } }],
    };
    expect(pairedArguments(oneSided)).toBeNull();
    expect(pairedArguments(null)).toBeNull();
  });
});
