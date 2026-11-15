import snapshot from '../data/results/ncsbe-mecklenburg-20261103.json';
import type { OfficialChoice, OfficialContest, OfficialResults, ResultsQuery, ResultsSource } from './types';

export interface NcsbeChoiceRow {
  cid: string;
  cnm: string;
  bnm: string;
  pty?: string;
  vct: string;
  pct: string;
  col?: string;
}

export interface NcsbeCountyRecord {
  cid: string;
  cnm: string;
  tle: string;
  prt: string;
  ptl: string;
  sub: string;
}

const PARTY_LABEL: Record<string, string> = {
  DEM: 'Democratic',
  REP: 'Republican',
  LIB: 'Libertarian',
  GRE: 'Green',
};

/** The source's own status word. "Unofficial" is checked before "official". */
export function statusLabelFromTitle(title: string): string {
  const match = title.toUpperCase().match(/\b(UNOFFICIAL|CERTIFIED|OFFICIAL)\b/);
  if (!match) return title.trim();
  if (match[1] === 'UNOFFICIAL') return 'Unofficial';
  if (match[1] === 'CERTIFIED') return 'Certified';
  return 'Official';
}

export function formatVoteTotal(votes: string): string {
  if (!/^\d+$/.test(votes)) return votes;
  return votes.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** Show the file's fraction. 0.7584 stays 75.84%, not a recomputed share. */
export function formatSourcePercent(fraction: string): string {
  if (!/^\d+(\.\d+)?$/.test(fraction)) return fraction;
  const [whole, decimals = ''] = fraction.split('.');
  const padded = `${decimals}0000`.slice(0, 4);
  const digits = `${whole}${padded}`.replace(/^0+(?=\d)/, '');
  const body = digits.length <= 2 ? digits.padStart(2, '0') : digits;
  const head = body.slice(0, -2);
  const tail = body.slice(-2);
  return `${head || '0'}.${tail}%`;
}

function partyLabel(code: string | undefined): string | undefined {
  const trimmed = code?.trim();
  if (!trimmed) return undefined;
  return PARTY_LABEL[trimmed] ?? trimmed;
}

export function parseNcsbeEnr(input: {
  county: NcsbeCountyRecord;
  rows: NcsbeChoiceRow[];
  sourceUrl: string;
  sourceTitle: string;
}): OfficialResults {
  const contests: OfficialContest[] = [];
  const byName = new Map<string, OfficialChoice[]>();
  for (const row of input.rows) {
    if (row.cid !== input.county.cid) continue;
    let choices = byName.get(row.cnm);
    if (!choices) {
      choices = [];
      byName.set(row.cnm, choices);
      contests.push({ name: row.cnm, choices });
    }
    const choice: OfficialChoice = {
      name: row.bnm,
      votes: row.vct,
      percent: row.pct,
    };
    const party = partyLabel(row.pty);
    if (party) choice.party = party;
    choices.push(choice);
  }

  return {
    statusLabel: statusLabelFromTitle(input.county.tle),
    statusTitle: input.county.tle,
    sourceUrl: input.sourceUrl,
    sourceTitle: input.sourceTitle,
    lastUpdated: input.county.sub,
    precinctsReported: input.county.prt,
    precinctsTotal: input.county.ptl,
    contests,
  };
}

export const NCSBE_MECKLENBURG_2026 = parseNcsbeEnr({
  county: snapshot.county,
  rows: snapshot.rows,
  sourceUrl: snapshot.sourcePage,
  sourceTitle: 'NC State Board of Elections results',
});

export const ncsbeMecklenburg2026: ResultsSource = {
  id: 'ncsbe-enr-mecklenburg-2026',
  covers(query: ResultsQuery): boolean {
    return (
      query.state.toUpperCase() === 'NC' &&
      query.county.toLowerCase() === 'mecklenburg' &&
      query.electionDate === '2026-11-03'
    );
  },
  async load(query: ResultsQuery): Promise<OfficialResults | null> {
    if (!this.covers(query)) return null;
    return NCSBE_MECKLENBURG_2026;
  },
};
