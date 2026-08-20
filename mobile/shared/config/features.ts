function envFlag(v: string | undefined, defaultValue: boolean): boolean {
  if (v == null || v === '') return defaultValue;
  const s = String(v).toLowerCase().trim();
  if (s === '0' || s === 'false' || s === 'no') return false;
  if (s === '1' || s === 'true' || s === 'yes') return true;
  return defaultValue;
}

/** Default on: Match + Shortlist + Profile. Set EXPO_PUBLIC_MVP_MODE=false for Discover + Journey. */
const mvpMode = envFlag(process.env.EXPO_PUBLIC_MVP_MODE, true);

/** NC-only, aimed at the March 7, 2028 primary. */
export { MVP_TARGET as mvpTarget } from '../data/upcomingElections';

export const features = {
  mvpMode,
  showDiscoverTab: !mvpMode,
  showJourneyTab: !mvpMode,
} as const;
