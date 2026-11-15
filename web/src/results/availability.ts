/**
 * North Carolina polls close at 7:30 p.m. Eastern.
 * November 3, 2026 is after the daylight-saving change, so the offset is -05:00.
 * https://www.ncsbe.gov/voting/vote-person-election-day
 */
export const MECKLENBURG_POLLS_CLOSE = '2026-11-03T19:30:00-05:00';

export function resultsWindowOpen(
  now = new Date(),
  pollsClose = MECKLENBURG_POLLS_CLOSE
): boolean {
  return now.getTime() >= Date.parse(pollsClose);
}
