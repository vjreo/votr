import { describe, expect, it } from 'vitest';
import { allBallotOffices, allMeasureIds } from './ballot';
import {
  MEASURES,
  OFFICES,
  explainerForMeasure,
  explainerForOffice,
  officeIdFromBallotOffice,
} from './offices';

describe('office explainers', () => {
  it('covers every office title on the ballot', () => {
    const missing: string[] = [];
    for (const office of allBallotOffices()) {
      const explainer = explainerForOffice(office);
      if (!explainer) missing.push(office);
      else {
        expect(explainer.oneLiner.length).toBeGreaterThan(20);
        expect(explainer.source.url.startsWith('https://')).toBe(true);
        expect(explainer.lastChecked).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(explainer.localImpact.length).toBeGreaterThanOrEqual(2);
      }
    }
    expect(missing).toEqual([]);
  });

  it('covers every measure on the ballot', () => {
    for (const id of allMeasureIds()) {
      const explainer = explainerForMeasure(id);
      expect(explainer, id).toBeTruthy();
      expect(explainer?.yesMeans).toBeTruthy();
      expect(explainer?.noMeans).toBeTruthy();
      expect(explainer?.source.url.startsWith('https://')).toBe(true);
    }
  });

  it('maps district office titles to the generic explainer', () => {
    expect(officeIdFromBallotOffice('U.S. House NC-12')).toBe('us-house');
    expect(officeIdFromBallotOffice('NC Senate District 41')).toBe('nc-senate');
    expect(officeIdFromBallotOffice('NC House District 102')).toBe('nc-house');
    expect(officeIdFromBallotOffice('Mecklenburg Commission District 2')).toBe(
      'meck-commission-district'
    );
    expect(officeIdFromBallotOffice('District Attorney (District 26)')).toBe('meck-da');
    expect(officeIdFromBallotOffice('U.S. Senate')).toBe('us-senate');
  });

  it('keeps clerk data even when that race is not in ballot.ts', () => {
    expect(OFFICES['meck-clerk'].source.url).toContain('nccourts.gov');
    expect(Object.keys(MEASURES).length).toBe(6);
  });

  it('gives every stored office a source and local impact', () => {
    for (const explainer of Object.values(OFFICES)) {
      expect(explainer.source.url.startsWith('https://'), explainer.id).toBe(true);
      expect(explainer.localImpact.length).toBeGreaterThanOrEqual(2);
      expect(explainer.localImpact.length).toBeLessThanOrEqual(3);
      expect(explainer.oneLiner.length).toBeGreaterThan(20);
    }
  });

  it('keeps County place copy off the commission seat', () => {
    expect(OFFICES['meck-county'].hideMeta).toBe(true);
    expect(OFFICES['meck-county'].currentHolder).toBeUndefined();
    expect(OFFICES['meck-commission-district'].seats).toMatch(/at-large/);
    expect(OFFICES['meck-commission-atlarge'].currentHolder).toMatch(/Altman/);
  });

  it('does not repeat the one-liner as a bullet', () => {
    for (const explainer of Object.values(OFFICES)) {
      const line = explainer.oneLiner.toLowerCase();
      for (const bullet of explainer.localImpact) {
        const head = bullet.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').trim().split(/\s+/).slice(0, 6).join(' ');
        expect(line.includes(head), `${explainer.id}: ${bullet}`).toBe(false);
      }
    }
  });
});
