/**
 * Application constants and configuration values
 *
 * SCOPE: Mecklenburg County, NC — 2026 midterm elections
 * This app is dogfooding for Charlotte/Mecklenburg voters first.
 */

export const DEFAULTS = {
  /** Default state: North Carolina */
  STATE: 'NC',
  /** Target election type */
  ELECTION_TYPE: 'general',
  /** Max elections to return in upcoming list */
  UPCOMING_ELECTIONS_LIMIT: 10,
};

/**
 * 2026 NC General Election — primary dogfood target
 */
export const TARGET_ELECTION = {
  id: 'nc-general-2026',
  date: '2026-11-03',
  state: 'NC',
  label: '2026 NC Midterms',
};
