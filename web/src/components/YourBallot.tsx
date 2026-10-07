import { useState } from 'react';
import type { UserLocation } from '../App';
import {
  ELECTION,
  DEADLINES,
  AMENDMENTS,
  CHARLOTTE_BONDS,
  NC_VOTER_SEARCH_URL,
  getCandidatesForDistrict,
  getNextCriticalDeadline,
  getDaysUntil,
  formatDate,
  formatShortDate,
  formatMoney,
  type Candidate,
  type BallotMeasure,
} from '../data/ballot';
import CandidateDetail from './CandidateDetail';

interface Props {
  location: UserLocation;
  onChangeAddress: () => void;
}

const LEVEL_CONFIG: Record<string, { label: string; order: number }> = {
  federal: { label: 'Federal Offices', order: 1 },
  state: { label: 'State Courts', order: 2 },
  state_legislature: { label: 'State Legislature', order: 3 },
  local: { label: 'County & Local', order: 4 },
};

interface ContestGroup {
  level: string;
  label: string;
  contests: { office: string; candidates: Candidate[] }[];
}

function groupCandidates(candidates: Candidate[]): ContestGroup[] {
  const byLevel: Record<string, Record<string, Candidate[]>> = {};

  for (const c of candidates) {
    const level = c.officeLevel;
    const office = c.office;
    if (!byLevel[level]) byLevel[level] = {};
    if (!byLevel[level][office]) byLevel[level][office] = [];
    byLevel[level][office].push(c);
  }

  return Object.entries(byLevel)
    .map(([level, offices]) => ({
      level,
      label: LEVEL_CONFIG[level]?.label || level,
      contests: Object.entries(offices)
        .map(([office, cands]) => ({ office, candidates: cands }))
        .sort((a, b) => a.office.localeCompare(b.office)),
    }))
    .sort((a, b) => {
      const orderA = LEVEL_CONFIG[a.level]?.order || 99;
      const orderB = LEVEL_CONFIG[b.level]?.order || 99;
      return orderA - orderB;
    });
}

export default function YourBallot({ location, onChangeAddress }: Props) {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [view, setView] = useState<'ballot' | 'dates'>('ballot');

  const candidates = getCandidatesForDistrict(location.district);
  const contestGroups = groupCandidates(candidates);
  const bonds = location.isCharlotte ? CHARLOTTE_BONDS : [];
  const nextDeadline = getNextCriticalDeadline();

  if (selectedCandidate) {
    return (
      <CandidateDetail
        candidate={selectedCandidate}
        onBack={() => setSelectedCandidate(null)}
      />
    );
  }

  if (view === 'dates') {
    return <DatesView onBack={() => setView('ballot')} />;
  }

  return (
    <div className="ballot">
      {/* Header */}
      <header className="ballot__header">
        <div className="ballot__header-top">
          <h1 className="ballot__title">Your Ballot</h1>
          <button 
            className="ballot__dates-btn"
            onClick={() => setView('dates')}
            aria-label="View key dates"
          >
            <CalendarIcon />
            <span>Dates</span>
          </button>
        </div>
        
        <button className="ballot__location" onClick={onChangeAddress}>
          <MapPinIcon />
          <span className="ballot__location-text">{location.address}</span>
          <span className="ballot__location-district">{location.district}</span>
        </button>

        {nextDeadline && (
          <div className="ballot__deadline">
            <ClockIcon />
            <div className="ballot__deadline-content">
              <span className="ballot__deadline-label">{nextDeadline.name}</span>
              <span className="ballot__deadline-date">
                {formatShortDate(nextDeadline.date)} · {getDaysUntil(nextDeadline.date)} days left
              </span>
            </div>
          </div>
        )}
      </header>

      <main className="ballot__content">
        {/* Election overview */}
        <section className="ballot__section">
          <div className="ballot__election-card">
            <h2 className="ballot__election-name">{ELECTION.name}</h2>
            <p className="ballot__election-date">{formatDate(ELECTION.date)}</p>
            <p className="ballot__election-desc">{ELECTION.description}</p>
          </div>
        </section>

        {/* Races */}
        {contestGroups.map((group) => (
          <section key={group.level} className="ballot__section">
            <h3 className="ballot__section-title">{group.label}</h3>
            
            {group.contests.map((contest) => (
              <div key={contest.office} className="ballot__race">
                <h4 className="ballot__office">{contest.office}</h4>
                <div className="ballot__candidates">
                  {contest.candidates.map((candidate) => (
                    <button
                      key={candidate.id}
                      className="ballot__candidate"
                      onClick={() => setSelectedCandidate(candidate)}
                    >
                      <div className="ballot__candidate-info">
                        <span className="ballot__candidate-name">{candidate.name}</span>
                        <span className="ballot__candidate-party">{candidate.party}</span>
                      </div>
                      <ChevronRightIcon />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </section>
        ))}

        {/* Amendments */}
        <section className="ballot__section">
          <h3 className="ballot__section-title">Statewide Questions</h3>
          <p className="ballot__section-desc">
            Constitutional amendments — vote For or Against each one
          </p>
          
          {AMENDMENTS.map((measure) => (
            <MeasureCard key={measure.id} measure={measure} />
          ))}
        </section>

        {/* Charlotte Bonds */}
        {bonds.length > 0 && (
          <section className="ballot__section">
            <h3 className="ballot__section-title">Charlotte Bond Votes</h3>
            <p className="ballot__section-desc">
              For Charlotte city voters — vote Yes or No on each bond
            </p>
            
            {bonds.map((measure) => (
              <MeasureCard key={measure.id} measure={measure} showAmount />
            ))}
          </section>
        )}

        {/* Official resources */}
        <section className="ballot__section">
          <div className="ballot__official">
            <h3 className="ballot__official-title">Want the official version?</h3>
            <p className="ballot__official-desc">
              Get your complete sample ballot with every race from the NC State Board of Elections.
            </p>
            <a
              href={NC_VOTER_SEARCH_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--secondary btn--full"
            >
              Go to NCSBE Voter Lookup →
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="ballot__footer">
          <p>
            VOTR shows candidates in their own words. We inform — we never tell you who to vote for.
          </p>
        </footer>
      </main>

      <style>{ballotStyles}</style>
    </div>
  );
}

function DatesView({ onBack }: { onBack: () => void }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="dates">
      <header className="dates__header">
        <button className="dates__back" onClick={onBack}>
          <ChevronLeftIcon />
          <span>Back to ballot</span>
        </button>
        <h1 className="dates__title">Key Dates</h1>
        <p className="dates__subtitle">Mark your calendar for these important deadlines</p>
      </header>

      <main className="dates__content">
        {DEADLINES.map((d) => {
          const days = getDaysUntil(d.date);
          const isPast = days < 0;
          const isToday = days === 0;
          const isSoon = days > 0 && days <= 3;

          return (
            <div
              key={d.date}
              className={`dates__item ${isPast ? 'dates__item--past' : ''} ${d.critical ? 'dates__item--critical' : ''}`}
            >
              <div className="dates__date">
                <span className="dates__month">{formatShortDate(d.date).split(' ')[0]}</span>
                <span className="dates__day">{formatShortDate(d.date).split(' ')[1]}</span>
              </div>
              <div className="dates__info">
                <span className="dates__name">{d.name}</span>
                {!isPast && (
                  <span className={`dates__countdown ${isSoon ? 'dates__countdown--soon' : ''}`}>
                    {isToday ? 'Today!' : `${days} days`}
                  </span>
                )}
                {isPast && <span className="dates__countdown">Passed</span>}
              </div>
            </div>
          );
        })}
      </main>

      <style>{datesStyles}</style>
    </div>
  );
}

function MeasureCard({ measure, showAmount }: { measure: BallotMeasure; showAmount?: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="measure">
      <div className="measure__header">
        <h4 className="measure__title">{measure.shortTitle}</h4>
        {showAmount && measure.principal && (
          <span className="measure__amount">{formatMoney(measure.principal)}</span>
        )}
      </div>
      
      <p className="measure__question">{measure.ballotQuestion}</p>
      
      {measure.explanation && expanded && (
        <div className="measure__detail">
          <p className="measure__explanation">{measure.explanation}</p>
          {measure.estimatedTaxImpact && (
            <p className="measure__tax">Estimated tax impact: {measure.estimatedTaxImpact}</p>
          )}
        </div>
      )}
      
      {measure.explanation && (
        <button className="measure__toggle" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show less' : 'What does this mean?'}
        </button>
      )}
      
      <div className="measure__choices">
        {measure.choices.map((choice) => (
          <span key={choice} className="measure__choice">{choice}</span>
        ))}
      </div>
    </div>
  );
}

// Icons
function MapPinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

const ballotStyles = `
  .ballot {
    min-height: 100vh;
    min-height: 100dvh;
    background-color: var(--color-bg);
  }

  .ballot__header {
    position: sticky;
    top: 0;
    z-index: 100;
    background-color: var(--color-surface);
    border-bottom: 1px solid var(--color-border-light);
    padding: var(--space-4) var(--space-5);
    padding-top: max(var(--space-4), env(safe-area-inset-top));
  }

  .ballot__header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-3);
  }

  .ballot__title {
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0;
  }

  .ballot__dates-btn {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    background: var(--color-surface-subtle);
    border-radius: var(--radius-full);
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--color-text-secondary);
    transition: all var(--transition-fast);
  }

  .ballot__dates-btn:hover {
    background: var(--color-accent-light);
    color: var(--color-accent);
  }

  .ballot__location {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    background: var(--color-surface-subtle);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    color: var(--color-text-primary);
    width: 100%;
    text-align: left;
    transition: all var(--transition-fast);
    border: 1px solid transparent;
  }

  .ballot__location:hover {
    border-color: var(--color-border);
  }

  .ballot__location svg {
    color: var(--color-accent);
    flex-shrink: 0;
  }

  .ballot__location-text {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ballot__location-district {
    font-weight: 600;
    color: var(--color-accent);
    flex-shrink: 0;
  }

  .ballot__deadline {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    margin-top: var(--space-3);
    padding: var(--space-4);
    background: var(--color-warning-light);
    border-radius: var(--radius-md);
  }

  .ballot__deadline svg {
    color: var(--color-warning);
    flex-shrink: 0;
    margin-top: 2px;
  }

  .ballot__deadline-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .ballot__deadline-label {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .ballot__deadline-date {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }

  .ballot__content {
    max-width: 540px;
    margin: 0 auto;
    padding: var(--space-5);
    padding-bottom: var(--space-16);
  }

  .ballot__section {
    margin-bottom: var(--space-8);
  }

  .ballot__section-title {
    font-size: var(--text-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-tertiary);
    margin: 0 0 var(--space-4);
  }

  .ballot__section-desc {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin: calc(-1 * var(--space-2)) 0 var(--space-4);
  }

  .ballot__election-card {
    padding: var(--space-5);
    background: var(--color-accent-light);
    border-radius: var(--radius-lg);
  }

  .ballot__election-name {
    font-size: var(--text-lg);
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 var(--space-1);
  }

  .ballot__election-date {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin: 0 0 var(--space-3);
  }

  .ballot__election-desc {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    line-height: var(--leading-relaxed);
    margin: 0;
  }

  .ballot__race {
    background: var(--color-surface);
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border-light);
    overflow: hidden;
    margin-bottom: var(--space-3);
  }

  .ballot__office {
    font-size: var(--text-base);
    font-weight: 600;
    color: var(--color-text-primary);
    padding: var(--space-4) var(--space-5);
    margin: 0;
    background: var(--color-surface-subtle);
    border-bottom: 1px solid var(--color-border-light);
  }

  .ballot__candidates {
    display: flex;
    flex-direction: column;
  }

  .ballot__candidate {
    display: flex;
    align-items: center;
    padding: var(--space-4) var(--space-5);
    border-bottom: 1px solid var(--color-border-light);
    transition: background-color var(--transition-fast);
    text-align: left;
    min-height: 64px;
  }

  .ballot__candidate:last-child {
    border-bottom: none;
  }

  .ballot__candidate:hover {
    background-color: var(--color-surface-subtle);
  }

  .ballot__candidate-info {
    flex: 1;
    min-width: 0;
  }

  .ballot__candidate-name {
    display: block;
    font-size: var(--text-base);
    font-weight: 500;
    color: var(--color-text-primary);
  }

  .ballot__candidate-party {
    display: block;
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin-top: var(--space-1);
  }

  .ballot__candidate svg {
    color: var(--color-text-tertiary);
    flex-shrink: 0;
  }

  .ballot__official {
    padding: var(--space-6);
    background: var(--color-surface);
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border-light);
    text-align: center;
  }

  .ballot__official-title {
    font-size: var(--text-lg);
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 var(--space-2);
  }

  .ballot__official-desc {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    line-height: var(--leading-relaxed);
    margin: 0 0 var(--space-5);
  }

  .ballot__footer {
    text-align: center;
    padding: var(--space-8) 0;
  }

  .ballot__footer p {
    font-size: var(--text-sm);
    color: var(--color-text-tertiary);
    line-height: var(--leading-relaxed);
    margin: 0;
  }

  /* Measure cards */
  .measure {
    background: var(--color-surface);
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border-light);
    padding: var(--space-5);
    margin-bottom: var(--space-3);
  }

  .measure__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-4);
    margin-bottom: var(--space-3);
  }

  .measure__title {
    font-size: var(--text-base);
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
  }

  .measure__amount {
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--color-accent);
    flex-shrink: 0;
  }

  .measure__question {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    line-height: var(--leading-relaxed);
    margin: 0 0 var(--space-3);
  }

  .measure__detail {
    padding: var(--space-4);
    background: var(--color-surface-subtle);
    border-radius: var(--radius-md);
    margin-bottom: var(--space-3);
  }

  .measure__explanation {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    font-style: italic;
    line-height: var(--leading-relaxed);
    margin: 0;
  }

  .measure__tax {
    font-size: var(--text-sm);
    color: var(--color-success);
    margin: var(--space-3) 0 0;
  }

  .measure__toggle {
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--color-accent);
    margin-bottom: var(--space-4);
    padding: 0;
    cursor: pointer;
  }

  .measure__toggle:hover {
    text-decoration: underline;
  }

  .measure__choices {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
  }

  .measure__choice {
    display: inline-flex;
    align-items: center;
    padding: var(--space-2) var(--space-4);
    background: var(--color-surface-subtle);
    border-radius: var(--radius-full);
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--color-text-secondary);
  }
`;

const datesStyles = `
  .dates {
    min-height: 100vh;
    min-height: 100dvh;
    background-color: var(--color-bg);
  }

  .dates__header {
    background-color: var(--color-surface);
    border-bottom: 1px solid var(--color-border-light);
    padding: var(--space-4) var(--space-5);
    padding-top: max(var(--space-4), env(safe-area-inset-top));
  }

  .dates__back {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--color-accent);
    margin-bottom: var(--space-4);
    padding: 0;
  }

  .dates__title {
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0 0 var(--space-2);
  }

  .dates__subtitle {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin: 0;
  }

  .dates__content {
    max-width: 540px;
    margin: 0 auto;
    padding: var(--space-5);
  }

  .dates__item {
    display: flex;
    align-items: center;
    gap: var(--space-5);
    padding: var(--space-5);
    background: var(--color-surface);
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border-light);
    margin-bottom: var(--space-3);
  }

  .dates__item--past {
    opacity: 0.5;
  }

  .dates__item--critical {
    border-left: 3px solid var(--color-warning);
  }

  .dates__date {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 56px;
  }

  .dates__month {
    font-size: var(--text-xs);
    font-weight: 600;
    text-transform: uppercase;
    color: var(--color-text-tertiary);
  }

  .dates__day {
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--color-text-primary);
    line-height: 1;
  }

  .dates__info {
    flex: 1;
  }

  .dates__name {
    display: block;
    font-size: var(--text-base);
    font-weight: 500;
    color: var(--color-text-primary);
  }

  .dates__countdown {
    display: block;
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin-top: var(--space-1);
  }

  .dates__countdown--soon {
    color: var(--color-warning);
    font-weight: 600;
  }
`;
