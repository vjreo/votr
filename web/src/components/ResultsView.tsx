import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { UserLocation } from '../utils/storage';
import { contestNamesForLocation } from '../results/ballotContests';
import { resultsWindowOpen } from '../results/availability';
import { formatSourcePercent, formatVoteTotal } from '../results/ncsbeEnr';
import { loadOfficialResults } from '../results/registry';
import type { OfficialResults, ResultsQuery } from '../results/types';

const MECKLENBURG_QUERY: ResultsQuery = {
  state: 'NC',
  county: 'Mecklenburg',
  electionDate: '2026-11-03',
};

type Phase = 'closed' | 'loading' | 'ready' | 'missing';

export default function ResultsView({
  location,
  onBack,
  now,
  load = loadOfficialResults,
}: {
  location: UserLocation;
  onBack: () => void;
  now?: Date;
  load?: (query: ResultsQuery) => Promise<OfficialResults | null>;
}) {
  const [clock] = useState(() => now ?? new Date());
  const open = resultsWindowOpen(clock);
  const [phase, setPhase] = useState<Phase>(open ? 'loading' : 'closed');
  const [data, setData] = useState<OfficialResults | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    load(MECKLENBURG_QUERY)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setPhase(result ? 'ready' : 'missing');
      })
      .catch(() => {
        if (!cancelled) setPhase('missing');
      });
    return () => {
      cancelled = true;
    };
  }, [open, load]);

  const headingRef = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => {
    headingRef.current?.focus();
  }, []);

  const names = contestNamesForLocation(location);
  const contests =
    data?.contests.filter((contest) => names.includes(contest.name)) ?? [];

  return (
    <div className="results">
      <header className="results__header">
        <button className="results__back" onClick={onBack} aria-label="Go back to ballot">
          <span aria-hidden="true">←</span>
          <span>Back to ballot</span>
        </button>
        <h1 tabIndex={-1} ref={headingRef} className="results__title">
          Official results
        </h1>
      </header>
      <main className="results__content">
        {phase !== 'ready' && (
          <p className="results__empty" role="status">
            Results not yet available.
            {phase === 'closed'
              ? ' Totals appear here after the polls close, and only from the election board. This view does not project a winner.'
              : phase === 'loading'
                ? ' Reading the election board file.'
                : ' No official results file is connected for this county.'}
          </p>
        )}
        {phase === 'ready' && data && (
          <>
            <p className="results__status">{data.statusLabel}</p>
            <p className="results__meta">
              Last updated {data.lastUpdated}. {data.precinctsReported} of {data.precinctsTotal} precincts in the file.
            </p>
            <p className="results__meta">
              <a href={data.sourceUrl} target="_blank" rel="noopener noreferrer">
                {data.sourceTitle}
              </a>
            </p>
            <p className="results__meta">{data.statusTitle}</p>
            {contests.map((contest) => (
              <section key={contest.name} className="results__contest" aria-label={contest.name}>
                <h2 className="results__contest-name">{contest.name}</h2>
                <ul className="results__choices">
                  {contest.choices.map((choice) => (
                    <li key={`${contest.name}-${choice.name}`} className="results__choice">
                      <span className="results__choice-name">{choice.name}</span>
                      {choice.party && <span className="results__choice-party">{choice.party}</span>}
                      <span className="results__choice-tally">
                        {formatVoteTotal(choice.votes)} votes, {formatSourcePercent(choice.percent)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </>
        )}
        {phase !== 'ready' && (
          <p className="results__meta">
            <a href="https://er.ncsbe.gov/?election_dt=11/03/2026&county_id=60" target="_blank" rel="noopener noreferrer">
              NC State Board of Elections results
            </a>
          </p>
        )}
      </main>
      <style>{resultsStyles}</style>
    </div>
  );
}

const resultsStyles = `
  .results {
    min-height: 100vh;
    min-height: 100dvh;
    background: var(--color-bg);
  }

  .results__header,
  .results__content {
    padding: var(--space-4) var(--space-5);
  }

  .results__back {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-height: var(--tap-target-min);
    color: var(--color-accent);
    font-weight: 600;
  }

  .results__title {
    margin: var(--space-3) 0 0;
    font-size: var(--text-2xl);
  }

  .results__status,
  .results__meta,
  .results__empty {
    color: var(--color-text-secondary);
    margin: 0 0 var(--space-3);
    line-height: var(--leading-relaxed);
  }

  .results__status {
    color: var(--color-text-primary);
    font-weight: 600;
  }

  .results__contest {
    margin: 0 0 var(--space-4);
    padding: var(--space-4);
    background: var(--color-surface);
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-md);
  }

  .results__contest-name {
    margin: 0 0 var(--space-3);
    font-size: var(--text-base);
    font-weight: 600;
  }

  .results__choices {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .results__choice {
    display: grid;
    gap: 0.15rem;
    margin: 0 0 var(--space-3);
    color: var(--color-text-primary);
  }

  .results__choice-party,
  .results__choice-tally {
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
  }

  .results__meta a {
    color: var(--color-accent);
    font-weight: 500;
  }
`;
