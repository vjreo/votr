function envFlag(v: string | undefined, defaultValue: boolean): boolean {
  if (v == null || v === '') return defaultValue;
  const s = String(v).toLowerCase().trim();
  if (s === '0' || s === 'false' || s === 'no') return false;
  if (s === '1' || s === 'true' || s === 'yes') return true;
  return defaultValue;
}

/**
 * Feature flags for VOTR MVP (Mecklenburg County 2026 dogfood)
 *
 * MVP Mode (default ON):
 * - Shows: Match (Feed) + Shortlist (Roster) + Profile
 * - Hides: Discover tab, Journey/gamification tab
 *
 * The gamification code is retained but the UI is hidden in MVP mode.
 * Set EXPO_PUBLIC_MVP_MODE=false to enable full feature set.
 */
const mvpMode = envFlag(process.env.EXPO_PUBLIC_MVP_MODE, true);

/** Mecklenburg County, NC — 2026 General Election */
export { MVP_TARGET as mvpTarget } from '../data/upcomingElections';

export const features = {
  mvpMode,
  /** Show the Discover tab (browse all candidates by office) */
  showDiscoverTab: !mvpMode,
  /** Show the Journey tab (gamification, streaks, achievements) */
  showJourneyTab: !mvpMode,
  /** Show daily lessons (civic education) — quarantined for dogfood */
  showDailyLessons: !mvpMode,
  /** Show policy quiz swipe cards */
  showPolicyQuiz: !mvpMode,
} as const;
