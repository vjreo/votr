import { ncsbeMecklenburg2026 } from './ncsbeEnr';
import type { OfficialResults, ResultsQuery, ResultsSource } from './types';

/** One entry per publisher. A new county or state is another object, not a new screen. */
export const RESULTS_SOURCES: ResultsSource[] = [ncsbeMecklenburg2026];

export async function loadOfficialResults(query: ResultsQuery): Promise<OfficialResults | null> {
  const source = RESULTS_SOURCES.find((item) => item.covers(query));
  if (!source) return null;
  return source.load(query);
}
