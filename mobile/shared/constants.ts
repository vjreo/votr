/**
 * App constants
 *
 * SCOPE: Mecklenburg County, NC — 2026 midterm elections
 * This app is dogfooding for Charlotte/Mecklenburg voters first.
 */

/** Default state for elections/candidates when user has no location set */
export const DEFAULT_STATE = 'NC' as const;

/** Target election for dogfood */
export const TARGET_ELECTION = {
  id: 'nc-general-2026',
  date: '2026-11-03',
  state: 'NC',
  label: '2026 NC Midterms',
} as const;
