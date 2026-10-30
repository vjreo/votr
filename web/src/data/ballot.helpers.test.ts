import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AMENDMENTS,
  CHARLOTTE_BONDS,
  DATA_PROVENANCE,
  DEADLINES,
  ELECTION,
  NC_VOTER_SEARCH_URL,
  OFFICIAL_SOURCES,
  US_HOUSE_NC12,
  US_HOUSE_NC14,
  US_HOUSE_NC8,
  US_SENATE,
  allBallotOffices,
  allCandidates,
  allMeasureIds,
  formatDate,
  formatMoney,
  formatShortDate,
  getCandidatesForLocation,
  getDaysUntil,
  getNextCriticalDeadline,
  sortCandidatesAlphabetically,
} from './ballot';

describe('getCandidatesForLocation', () => {
  it('includes only the U.S. House slate for the voter district', () => {
    const nc12 = getCandidatesForLocation({ district: 'NC-12' });
    const nc14 = getCandidatesForLocation({ district: 'NC-14' });
    const nc8 = getCandidatesForLocation({ district: 'NC-8' });

    expect(nc12.some((c) => c.id === US_HOUSE_NC12[0].id)).toBe(true);
    expect(nc12.some((c) => c.id === US_HOUSE_NC14[0].id)).toBe(false);
    expect(nc14.some((c) => c.id === US_HOUSE_NC14[0].id)).toBe(true);
    expect(nc14.some((c) => c.id === US_HOUSE_NC8[0].id)).toBe(false);
    expect(nc8.some((c) => c.id === US_HOUSE_NC8[0].id)).toBe(true);
  });

  it('always includes statewide races', () => {
    const list = getCandidatesForLocation({ district: 'NC-12' });
    expect(list.some((c) => c.office === 'U.S. Senate')).toBe(true);
    expect(list.some((c) => c.office.startsWith('NC Supreme Court'))).toBe(true);
    expect(list.some((c) => c.office.startsWith('NC Court of Appeals'))).toBe(true);
  });

  it('filters NC Senate, NC House, and commission seats when districts are known', () => {
    const list = getCandidatesForLocation({
      district: 'NC-14',
      ncSenate: '41',
      ncHouse: '104',
      commission: '2',
    });
    const offices = [...new Set(list.map((c) => c.office))];

    expect(offices).toContain('NC Senate District 41');
    expect(offices).not.toContain('NC Senate District 37');
    expect(offices).toContain('NC House District 104');
    expect(offices).not.toContain('NC House District 88');
    expect(offices).toContain('Mecklenburg Commission District 2');
    expect(offices).toContain('Mecklenburg Commissioners At-Large');
    expect(offices).toContain('Mecklenburg Sheriff');
  });

  it('includes every state legislature and local race when districts are unknown', () => {
    const list = getCandidatesForLocation({ district: 'NC-12' });
    expect(list.some((c) => c.office === 'NC Senate District 37')).toBe(true);
    expect(list.some((c) => c.office === 'NC House District 105')).toBe(true);
    expect(list.filter((c) => c.office.includes('Commission District')).length).toBeGreaterThan(0);
  });
});

describe('sortCandidatesAlphabetically', () => {
  it('orders by last name, not party or filing order', () => {
    const senate = sortCandidatesAlphabetically(US_SENATE);
    expect(senate.map((c) => c.name)).toEqual([
      'Shannon W. Bray',
      'Roy Cooper',
      'Michael Dublin',
      'Michael Whatley',
    ]);
    expect(senate.map((c) => c.party)).not.toEqual(['Democratic', 'Republican', 'Libertarian', 'Green']);

    const house14 = sortCandidatesAlphabetically(US_HOUSE_NC14);
    expect(house14.map((c) => c.name)).toEqual(['Tim Moore', 'Lakesha Womack']);
    expect(house14[0].party).toBe('Republican');
  });

  it('does not mutate the input list', () => {
    const original = US_SENATE.map((c) => c.id);
    sortCandidatesAlphabetically(US_SENATE);
    expect(US_SENATE.map((c) => c.id)).toEqual(original);
  });
});

describe('deadline and money formatting', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 30));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts whole local days until a date', () => {
    expect(getDaysUntil('2026-10-30')).toBe(0);
    expect(getDaysUntil('2026-10-31')).toBe(1);
    expect(getDaysUntil('2026-11-03')).toBe(4);
    expect(getDaysUntil('2026-10-09')).toBeLessThan(0);
  });

  it('returns the next future critical deadline', () => {
    expect(getNextCriticalDeadline()?.name).toBe('Election Day');
  });

  it('returns null when every critical deadline has passed', () => {
    vi.setSystemTime(new Date(2026, 10, 4));
    expect(getNextCriticalDeadline()).toBeNull();
  });

  it('formats dates and money for ballot copy', () => {
    expect(formatDate('2026-11-03')).toMatch(/Tuesday/);
    expect(formatDate('2026-11-03')).toMatch(/November/);
    expect(formatDate('2026-11-03')).toMatch(/3/);
    expect(formatDate('2026-11-03')).toMatch(/2026/);
    expect(formatShortDate('2026-11-03')).toMatch(/Nov/);
    expect(formatShortDate('2026-11-03')).toMatch(/3/);
    expect(formatMoney(1_000_000_000)).toBe('$1.0B');
    expect(formatMoney(280_000_000)).toBe('$280M');
    expect(formatMoney(20_000)).toBe('$20K');
    expect(formatMoney(500)).toBe('$500');
  });
});

describe('bundled ballot data', () => {
  it('names the 2026 general election and lists official https sources', () => {
    expect(ELECTION.date).toBe('2026-11-03');
    expect(DEADLINES.some((d) => d.name === 'Election Day' && d.critical)).toBe(true);
    expect(NC_VOTER_SEARCH_URL.startsWith('https://')).toBe(true);
    for (const url of Object.values(OFFICIAL_SOURCES)) {
      expect(url.startsWith('https://'), url).toBe(true);
    }
    expect(DATA_PROVENANCE.sources.length).toBeGreaterThan(0);
  });

  it('exposes unique offices and every amendment and bond id', () => {
    const offices = allBallotOffices();
    expect(offices).toEqual([...offices].sort());
    expect(new Set(offices).size).toBe(offices.length);
    expect(allMeasureIds()).toEqual([...AMENDMENTS, ...CHARLOTTE_BONDS].map((m) => m.id));
    expect(allCandidates().length).toBeGreaterThan(20);
  });
});
