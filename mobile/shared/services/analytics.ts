/**
 * Lightweight funnel / product events. In dev, logs to console; plug a vendor here later.
 */
export type AnalyticsProps = Record<string, string | number | boolean | undefined>;

export function logEvent(name: string, props?: AnalyticsProps): void {
  const payload = { name, ...props, ts: Date.now() };
  if (__DEV__) {
    console.log('[votr]', JSON.stringify(payload));
  }
  // Future: PostHog, Segment, Amplitude, etc.
}
