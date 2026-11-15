import { describe, expect, it } from 'vitest';
import { charlotteLocation, huntersvilleLocation } from '../test/fixtures';
import { contestNamesForLocation } from './ballotContests';
import { resultsWindowOpen } from './availability';
import {
  NCSBE_MECKLENBURG_2026,
  formatSourcePercent,
  formatVoteTotal,
  ncsbeMecklenburg2026,
  parseNcsbeEnr,
  statusLabelFromTitle,
  type NcsbeChoiceRow,
} from './ncsbeEnr';
import { loadOfficialResults } from './registry';

const county = {
  cid: '60',
  cnm: 'MECKLENBURG',
  tle: '11/03/2026 UNOFFICIAL GENERAL ELECTION RESULTS - MECKLENBURG',
  prt: '10',
  ptl: '195',
  sub: 'November 3, 2026 9:00 pm',
};

function row(partial: Partial<NcsbeChoiceRow> & Pick<NcsbeChoiceRow, 'cnm' | 'bnm' | 'vct'>): NcsbeChoiceRow {
  return { cid: '60', pct: '0.5000', pty: '', ...partial };
}

describe('NCSBE results adapter', () => {
  it('keeps the source status word and drops party colors', () => {
    expect(statusLabelFromTitle(county.tle)).toBe('Unofficial');
    expect(statusLabelFromTitle('CERTIFIED CANVASS')).toBe('Certified');
    expect(statusLabelFromTitle('OFFICIAL GENERAL')).toBe('Official');
    expect(statusLabelFromTitle('County canvass posted')).toBe('County canvass posted');

    const parsed = parseNcsbeEnr({
      county,
      sourceUrl: 'https://er.ncsbe.gov/example',
      sourceTitle: 'Example board',
      rows: [
        row({ cnm: 'SAMPLE RACE', bnm: 'Lower total', vct: '10', pct: '0.2000', pty: 'REP', col: 'EB2326' }),
        row({ cnm: 'SAMPLE RACE', bnm: 'Higher total', vct: '40', pct: '0.8000', pty: 'ZZZ', col: '1171B9' }),
        row({ cid: '1', cnm: 'OTHER COUNTY', bnm: 'Skip', vct: '1' }),
      ],
    });
    expect(parsed.statusLabel).toBe('Unofficial');
    expect(parsed.lastUpdated).toBe('November 3, 2026 9:00 pm');
    expect(parsed.contests).toHaveLength(1);
    expect(parsed.contests[0].choices.map((choice) => choice.name)).toEqual([
      'Lower total',
      'Higher total',
    ]);
    expect(parsed.contests[0].choices[0].party).toBe('Republican');
    expect(parsed.contests[0].choices[1].party).toBe('ZZZ');
    expect(JSON.stringify(parsed)).not.toMatch(/EB2326|1171B9|leading|winner/i);
  });

  it('formats the file fraction without recomputing a share', () => {
    expect(formatSourcePercent('0.7584')).toBe('75.84%');
    expect(formatSourcePercent('0.0091')).toBe('0.91%');
    expect(formatSourcePercent('1.0000')).toBe('100.00%');
    expect(formatSourcePercent('n/a')).toBe('n/a');
    expect(formatVoteTotal('334972')).toBe('334,972');
    expect(formatVoteTotal('12a')).toBe('12a');
  });

  it('reads the Mecklenburg file as official and only covers that county', () => {
    expect(NCSBE_MECKLENBURG_2026.statusLabel).toBe('Official');
    expect(NCSBE_MECKLENBURG_2026.lastUpdated).toBe('November 13, 2026 12:03 pm');
    expect(NCSBE_MECKLENBURG_2026.sourceUrl).toContain('county_id=60');
    const senate = NCSBE_MECKLENBURG_2026.contests.find((contest) => contest.name.startsWith('US SENATE'));
    expect(senate?.choices.find((choice) => choice.name === 'Roy Cooper')?.votes).toBe('334972');
    expect(ncsbeMecklenburg2026.covers({ state: 'nc', county: 'Mecklenburg', electionDate: '2026-11-03' })).toBe(true);
    expect(ncsbeMecklenburg2026.covers({ state: 'NC', county: 'Wake', electionDate: '2026-11-03' })).toBe(false);
  });

  it('returns null for a county with no adapter', async () => {
    expect(await loadOfficialResults({ state: 'NC', county: 'Wake', electionDate: '2026-11-03' })).toBeNull();
    expect(await ncsbeMecklenburg2026.load({ state: 'NC', county: 'Wake', electionDate: '2026-11-03' })).toBeNull();
    const meck = await loadOfficialResults({ state: 'NC', county: 'Mecklenburg', electionDate: '2026-11-03' });
    expect(meck?.statusLabel).toBe('Official');
  });

  it('lists the contests on that voter’s ballot and not another district’s', () => {
    const charlotte = contestNamesForLocation(charlotteLocation);
    const huntersville = contestNamesForLocation(huntersvilleLocation);
    const published = new Set(NCSBE_MECKLENBURG_2026.contests.map((contest) => contest.name));
    for (const name of [...charlotte, ...huntersville]) {
      expect(published.has(name), name).toBe(true);
    }
    expect(charlotte.some((name) => name.includes('DISTRICT 14'))).toBe(true);
    expect(charlotte.some((name) => name.includes('HOUSING BONDS'))).toBe(true);
    expect(huntersville.some((name) => name.includes('DISTRICT 12'))).toBe(true);
    expect(huntersville.some((name) => name.includes('HOUSING'))).toBe(false);
    expect(charlotte.some((name) => name.includes('DISTRICT 12'))).toBe(false);
  });

  it('opens the results window at poll close and not before', () => {
    expect(resultsWindowOpen(new Date('2026-11-03T19:29:00-05:00'))).toBe(false);
    expect(resultsWindowOpen(new Date('2026-11-03T19:30:00-05:00'))).toBe(true);
  });
});
