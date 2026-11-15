/** Who is asking. Another state or county uses the same shape. */
export interface ResultsQuery {
  state: string;
  county: string;
  electionDate: string;
}

export interface OfficialChoice {
  name: string;
  /** Party as a word, when the source printed a party code. Never a color. */
  party?: string;
  /** Vote total as printed, digits only. */
  votes: string;
  /** Source fraction, such as "0.7584". Not recomputed. */
  percent: string;
}

export interface OfficialContest {
  /** Contest name as the source file prints it. */
  name: string;
  choices: OfficialChoice[];
}

/**
 * Official totals only. No winner, no "leading", no projection.
 * statusLabel is the source's own word (Unofficial, Official, Certified).
 */
export interface OfficialResults {
  statusLabel: string;
  statusTitle: string;
  sourceUrl: string;
  sourceTitle: string;
  lastUpdated: string;
  precinctsReported: string;
  precinctsTotal: string;
  contests: OfficialContest[];
}

export interface ResultsSource {
  id: string;
  covers(query: ResultsQuery): boolean;
  load(query: ResultsQuery): Promise<OfficialResults | null>;
}
