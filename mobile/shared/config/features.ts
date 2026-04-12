/** Feature flags from `EXPO_PUBLIC_*` (Expo embeds at build time). */
function envTruthy(v: string | undefined): boolean {
  if (v == null || v === '') return false;
  const s = String(v).toLowerCase().trim();
  return s === '1' || s === 'true' || s === 'yes';
}

const mvpMode = envTruthy(process.env.EXPO_PUBLIC_MVP_MODE);

/** MVP: Match + Shortlist + Profile only. Full app adds Discover + Journey tabs. */
export const features = {
  mvpMode,
  showDiscoverTab: !mvpMode,
  showJourneyTab: !mvpMode,
} as const;
