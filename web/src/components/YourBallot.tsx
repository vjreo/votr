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
  federal: { label: 'Federal', order: 1 },
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
  const [showCalendar, setShowCalendar] = useState(false);

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

  if (showCalendar) {
    return (
      <div className="calendar-view">
        <header className="ballot-header">
          <button className="back-btn" onClick={() => setShowCalendar(false)}>
            ← Back
          </button>
          <h1 className="ballot-header__title">Key Dates</h1>
        </header>
        <div className="calendar-content">
          {DEADLINES.map((d) => {
            const days = getDaysUntil(d.date);
            const isPast = days < 0;
            return (
              <div
                key={d.date}
                className={`calendar-item ${d.critical ? 'calendar-item--critical' : ''} ${isPast ? 'calendar-item--past' : ''}`}
              >
                <div className="calendar-item__date">
                  <span className="calendar-item__month">
                    {formatShortDate(d.date).split(' ')[0]}
                  </span>
                  <span className="calendar-item__day">
                    {formatShortDate(d.date).split(' ')[1]}
                  </span>
                </div>
                <div className="calendar-item__info">
                  <span className="calendar-item__name">{d.name}</span>
                  {!isPast && (
                    <span className="calendar-item__days">
                      {days === 0 ? 'Today' : `${days} days`}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <style>{calendarStyles}</style>
      </div>
    );
  }

  return (
    <div className="ballot">
      <header className="ballot-header">
        <div className="ballot-header__row">
          <div className="ballot-header__left">
            <h1 className="ballot-header__title">Your ballot</h1>
            <button className="location-chip" onClick={onChangeAddress}>
              <LocationIcon />
              <span className="location-chip__text">{location.address}</span>
              <ChevronDownIcon />
            </button>
          </div>
          <button className="calendar-btn" onClick={() => setShowCalendar(true)}>
            <CalendarIcon />
          </button>
        </div>

        {nextDeadline && (
          <div className="deadline-strip">
            <ClockIcon />
            <span>
              {nextDeadline.name}:{' '}
              <strong>
                {formatShortDate(nextDeadline.date)} ({getDaysUntil(nextDeadline.date)} days)
              </strong>
            </span>
          </div>
        )}
      </header>

      <main className="ballot-content">
        {/* Election info */}
        <div className="card card--primary">
          <h2 className="election-name">{ELECTION.name}</h2>
          <p className="election-date">{formatDate(ELECTION.date)}</p>
          <p className="election-desc">{ELECTION.description}</p>
        </div>

        {/* Contests */}
        {contestGroups.map((group) => (
          <section key={group.level} className="section">
            <h3 className="section-title">{group.label}</h3>
            {group.contests.map((contest) => (
              <div key={contest.office} className="card">
                <h4 className="office-name">{contest.office}</h4>
                {contest.candidates.map((candidate, idx) => (
                  <button
                    key={candidate.id}
                    className={`candidate-row ${idx === contest.candidates.length - 1 ? 'candidate-row--last' : ''}`}
                    onClick={() => setSelectedCandidate(candidate)}
                  >
                    <div className="candidate-info">
                      <span className="candidate-name">{candidate.name}</span>
                      <span className="candidate-party">{candidate.party}</span>
                    </div>
                    <ChevronRightIcon />
                  </button>
                ))}
              </div>
            ))}
          </section>
        ))}

        {/* Amendments */}
        <section className="section">
          <h3 className="section-title">Statewide Amendments</h3>
          <p className="section-subtitle">
            Constitutional amendments on every NC ballot
          </p>
          {AMENDMENTS.map((measure) => (
            <MeasureCard key={measure.id} measure={measure} />
          ))}
        </section>

        {/* Charlotte Bonds */}
        {bonds.length > 0 && (
          <section className="section">
            <h3 className="section-title">Charlotte Bonds</h3>
            <p className="section-subtitle">
              Bond referendums for Charlotte city voters
            </p>
            {bonds.map((measure) => (
              <MeasureCard key={measure.id} measure={measure} showAmount />
            ))}
          </section>
        )}

        {/* Official link */}
        <div className="official-section">
          <h3 className="official-title">Official sample ballot</h3>
          <p className="official-desc">
            For the complete official ballot including all races, use the NC State Board of Elections lookup.
          </p>
          <a
            href={NC_VOTER_SEARCH_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--secondary btn--full"
          >
            View official ballot →
          </a>
        </div>

        <footer className="ballot-footer">
          <p>VOTR informs, never endorses. We'll never tell you who to vote for.</p>
        </footer>
      </main>

      <style>{styles}</style>
    </div>
  );
}

function MeasureCard({ measure, showAmount }: { measure: BallotMeasure; showAmount?: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card measure-card">
      <div className="measure-header">
        <h4 className="measure-title">{measure.shortTitle}</h4>
        {showAmount && measure.principal && (
          <span className="measure-amount">{formatMoney(measure.principal)}</span>
        )}
      </div>
      <p className="measure-question">{measure.ballotQuestion}</p>
      {measure.explanation && expanded && (
        <p className="measure-explanation">{measure.explanation}</p>
      )}
      {measure.estimatedTaxImpact && expanded && (
        <p className="measure-tax">Est. tax impact: {measure.estimatedTaxImpact}</p>
      )}
      {measure.explanation && (
        <button className="measure-toggle" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show less' : 'What does this mean?'}
        </button>
      )}
      <div className="measure-choices">
        {measure.choices.map((choice) => (
          <span key={choice} className="pill">{choice}</span>
        ))}
      </div>
    </div>
  );
}

// Icons
function LocationIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

const styles = `
  .ballot {
    min-height: 100vh;
    min-height: 100dvh;
    background-color: var(--color-bg);
  }

  .ballot-header {
    position: sticky;
    top: 0;
    background-color: var(--color-bg);
    padding: 16px;
    padding-top: max(16px, env(safe-area-inset-top));
    border-bottom: 1px solid var(--color-border-light);
    z-index: 100;
  }

  .ballot-header__row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .ballot-header__left {
    flex: 1;
    min-width: 0;
  }

  .ballot-header__title {
    font-size: 28px;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0 0 8px;
  }

  .location-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background-color: var(--color-surface);
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-full);
    font-size: 13px;
    color: var(--color-text-primary);
    max-width: 100%;
    cursor: pointer;
    transition: border-color 0.2s;
  }

  .location-chip:hover {
    border-color: var(--color-primary);
  }

  .location-chip__text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }

  .location-chip svg:first-child {
    color: var(--color-primary);
    flex-shrink: 0;
  }

  .location-chip svg:last-child {
    color: var(--color-text-tertiary);
    flex-shrink: 0;
  }

  .calendar-btn {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-primary);
  }

  .deadline-strip {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    padding: 10px 12px;
    background-color: var(--color-warning-muted);
    border-radius: var(--radius-md);
    font-size: 13px;
    color: var(--color-text-primary);
  }

  .deadline-strip svg {
    color: var(--color-warning);
    flex-shrink: 0;
  }

  .ballot-content {
    padding: 16px;
    max-width: 600px;
    margin: 0 auto;
  }

  .election-name {
    font-size: 17px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 4px;
  }

  .election-date {
    font-size: 13px;
    color: var(--color-text-secondary);
    margin: 0 0 8px;
  }

  .election-desc {
    font-size: 14px;
    color: var(--color-text-secondary);
    line-height: 1.5;
    margin: 0;
  }

  .section {
    margin-top: 24px;
  }

  .section-title {
    font-size: 17px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 8px;
  }

  .section-subtitle {
    font-size: 13px;
    color: var(--color-text-secondary);
    margin: 0 0 12px;
  }

  .office-name {
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 8px;
  }

  .candidate-row {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 12px 0;
    border-top: 1px solid var(--color-border-light);
    cursor: pointer;
    transition: background-color 0.2s;
    text-align: left;
  }

  .candidate-row:hover {
    background-color: var(--color-surface);
    margin: 0 -16px;
    padding-left: 16px;
    padding-right: 16px;
    width: calc(100% + 32px);
  }

  .candidate-row--last {
    padding-bottom: 0;
  }

  .candidate-info {
    flex: 1;
    min-width: 0;
  }

  .candidate-name {
    display: block;
    font-size: 15px;
    font-weight: 500;
    color: var(--color-text-primary);
  }

  .candidate-party {
    display: block;
    font-size: 13px;
    color: var(--color-text-secondary);
    margin-top: 2px;
  }

  .candidate-row svg {
    color: var(--color-text-tertiary);
    flex-shrink: 0;
  }

  .measure-card {
    margin-bottom: 12px;
  }

  .measure-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 8px;
  }

  .measure-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
    flex: 1;
  }

  .measure-amount {
    font-size: 15px;
    font-weight: 700;
    color: var(--color-primary);
    flex-shrink: 0;
  }

  .measure-question {
    font-size: 14px;
    color: var(--color-text-secondary);
    line-height: 1.5;
    margin: 0 0 8px;
  }

  .measure-explanation {
    font-size: 13px;
    color: var(--color-text-tertiary);
    font-style: italic;
    line-height: 1.5;
    margin: 0 0 8px;
  }

  .measure-tax {
    font-size: 13px;
    color: var(--color-success);
    margin: 0 0 8px;
  }

  .measure-toggle {
    font-size: 13px;
    color: var(--color-primary);
    margin-bottom: 12px;
    cursor: pointer;
  }

  .measure-toggle:hover {
    text-decoration: underline;
  }

  .measure-choices {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .official-section {
    margin-top: 32px;
    padding: 16px;
    background-color: var(--color-surface);
    border-radius: var(--radius-lg);
  }

  .official-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 8px;
  }

  .official-desc {
    font-size: 14px;
    color: var(--color-text-secondary);
    line-height: 1.5;
    margin: 0 0 16px;
  }

  .ballot-footer {
    margin-top: 32px;
    padding: 16px 0;
    text-align: center;
  }

  .ballot-footer p {
    font-size: 12px;
    color: var(--color-text-tertiary);
    margin: 0;
  }

  .back-btn {
    font-size: 15px;
    color: var(--color-primary);
    padding: 8px 0;
    cursor: pointer;
  }
`;

const calendarStyles = `
  .calendar-view {
    min-height: 100vh;
    min-height: 100dvh;
    background-color: var(--color-bg);
  }

  .calendar-content {
    padding: 16px;
    max-width: 600px;
    margin: 0 auto;
  }

  .calendar-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background-color: var(--color-card);
    border-radius: var(--radius-lg);
    margin-bottom: 10px;
  }

  .calendar-item--critical {
    border-left: 3px solid var(--color-warning);
  }

  .calendar-item--past {
    opacity: 0.5;
  }

  .calendar-item__date {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 50px;
  }

  .calendar-item__month {
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-secondary);
    text-transform: uppercase;
  }

  .calendar-item__day {
    font-size: 24px;
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .calendar-item__info {
    flex: 1;
  }

  .calendar-item__name {
    display: block;
    font-size: 15px;
    font-weight: 500;
    color: var(--color-text-primary);
  }

  .calendar-item__days {
    display: block;
    font-size: 13px;
    color: var(--color-text-secondary);
    margin-top: 4px;
  }
`;
