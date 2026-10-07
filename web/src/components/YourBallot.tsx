import { useState } from 'react';
import type { UserLocation, CandidatePick, MeasurePick } from '../App';
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
  candidatePicks: CandidatePick[];
  measurePicks: MeasurePick[];
  onChangeAddress: () => void;
  onCandidatePick: (candidateId: string, leaning: CandidatePick['leaning'] | null) => void;
  onMeasurePick: (measureId: string, leaning: MeasurePick['leaning'] | null) => void;
  onClearAll: () => void;
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

export default function YourBallot({
  location,
  candidatePicks,
  measurePicks,
  onChangeAddress,
  onCandidatePick,
  onMeasurePick,
  onClearAll,
}: Props) {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [view, setView] = useState<'ballot' | 'dates' | 'settings'>('ballot');

  const candidates = getCandidatesForDistrict(location.district);
  const contestGroups = groupCandidates(candidates);
  const bonds = location.isCharlotte ? CHARLOTTE_BONDS : [];
  const nextDeadline = getNextCriticalDeadline();

  const getCandidatePick = (id: string) => candidatePicks.find(p => p.candidateId === id);
  const getMeasurePick = (id: string) => measurePicks.find(p => p.measureId === id);
  const hasAnyPicks = candidatePicks.length > 0 || measurePicks.length > 0;

  if (selectedCandidate) {
    const pick = getCandidatePick(selectedCandidate.id);
    return (
      <CandidateDetail
        candidate={selectedCandidate}
        pick={pick}
        onBack={() => setSelectedCandidate(null)}
        onPick={(leaning) => onCandidatePick(selectedCandidate.id, leaning)}
      />
    );
  }

  if (view === 'dates') {
    return <DatesView onBack={() => setView('ballot')} />;
  }

  if (view === 'settings') {
    return (
      <SettingsView
        onBack={() => setView('ballot')}
        onClearAll={onClearAll}
        hasAnyPicks={hasAnyPicks}
      />
    );
  }

  return (
    <div className="ballot">
      {/* Header */}
      <header className="ballot__header">
        <div className="ballot__header-top">
          <h1 className="ballot__title">Your Ballot</h1>
          <div className="ballot__header-actions">
            <button 
              className="ballot__action-btn"
              onClick={() => setView('dates')}
              aria-label="View key dates"
            >
              <CalendarIcon />
            </button>
            <button 
              className="ballot__action-btn"
              onClick={() => setView('settings')}
              aria-label="Settings"
            >
              <SettingsIcon />
            </button>
          </div>
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
        {/* Privacy notice */}
        <div className="ballot__privacy">
          <LockIcon />
          <span>Your picks stay on this device. No account, nothing shared.</span>
        </div>

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
                  {contest.candidates.map((candidate) => {
                    const pick = getCandidatePick(candidate.id);
                    return (
                      <button
                        key={candidate.id}
                        className={`ballot__candidate ${pick ? 'ballot__candidate--picked' : ''}`}
                        onClick={() => setSelectedCandidate(candidate)}
                      >
                        <div className="ballot__candidate-info">
                          <span className="ballot__candidate-name">{candidate.name}</span>
                          <span className="ballot__candidate-party">{candidate.party}</span>
                        </div>
                        {pick && (
                          <span className={`ballot__pick-badge ballot__pick-badge--${pick.leaning}`}>
                            {pick.leaning === 'likely' ? '✓' : pick.leaning === 'considering' ? '?' : '✗'}
                          </span>
                        )}
                        <ChevronRightIcon />
                      </button>
                    );
                  })}
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
            <MeasureCard
              key={measure.id}
              measure={measure}
              pick={getMeasurePick(measure.id)}
              onPick={(leaning) => onMeasurePick(measure.id, leaning)}
            />
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
              <MeasureCard
                key={measure.id}
                measure={measure}
                pick={getMeasurePick(measure.id)}
                onPick={(leaning) => onMeasurePick(measure.id, leaning)}
                showAmount
              />
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

function SettingsView({
  onBack,
  onClearAll,
  hasAnyPicks,
}: {
  onBack: () => void;
  onClearAll: () => void;
  hasAnyPicks: boolean;
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClear = () => {
    onClearAll();
    onBack();
  };

  return (
    <div className="settings">
      <header className="settings__header">
        <button className="settings__back" onClick={onBack}>
          <ChevronLeftIcon />
          <span>Back to ballot</span>
        </button>
        <h1 className="settings__title">Settings</h1>
      </header>

      <main className="settings__content">
        <section className="settings__section">
          <h2 className="settings__section-title">Your Privacy</h2>
          <div className="settings__card">
            <div className="settings__privacy-icon">
              <LockIcon />
            </div>
            <h3 className="settings__card-title">Everything stays on your device</h3>
            <p className="settings__card-desc">
              Your address, your picks, and how you're leaning — all stored only on this phone or computer. Nothing is sent to any server. No account, no sign-up, no tracking.
            </p>
            <p className="settings__card-desc">
              Share this link with friends — each device is completely independent.
            </p>
          </div>
        </section>

        <section className="settings__section">
          <h2 className="settings__section-title">Your Data</h2>
          {hasAnyPicks ? (
            <div className="settings__card">
              {!showConfirm ? (
                <>
                  <p className="settings__card-desc">
                    Want to start fresh? This will clear your saved address and all your picks.
                  </p>
                  <button
                    className="btn btn--secondary btn--full"
                    onClick={() => setShowConfirm(true)}
                  >
                    Clear my picks
                  </button>
                </>
              ) : (
                <>
                  <p className="settings__card-desc settings__card-desc--warning">
                    Are you sure? This will remove your address and all the candidates and measures you've marked.
                  </p>
                  <div className="settings__confirm-buttons">
                    <button
                      className="btn btn--secondary"
                      onClick={() => setShowConfirm(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn--danger"
                      onClick={handleClear}
                    >
                      Yes, clear everything
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="settings__card">
              <p className="settings__card-desc">
                You haven't saved any picks yet. When you mark candidates or measures, they'll be stored here on your device.
              </p>
            </div>
          )}
        </section>
      </main>

      <style>{settingsStyles}</style>
    </div>
  );
}

function DatesView({ onBack }: { onBack: () => void }) {
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

function MeasureCard({
  measure,
  pick,
  onPick,
  showAmount,
}: {
  measure: BallotMeasure;
  pick?: MeasurePick;
  onPick: (leaning: MeasurePick['leaning'] | null) => void;
  showAmount?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const isBond = measure.type === 'bond';

  const handlePick = (leaning: MeasurePick['leaning']) => {
    if (pick?.leaning === leaning) {
      onPick(null); // toggle off
    } else {
      onPick(leaning);
    }
  };

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
      
      <div className="measure__picks">
        <span className="measure__picks-label">I'm leaning:</span>
        <div className="measure__pick-buttons">
          {(isBond ? ['for', 'against'] : ['for', 'against']).map((option) => {
            const leaning = option as MeasurePick['leaning'];
            const isSelected = pick?.leaning === leaning;
            const label = isBond ? (option === 'for' ? 'Yes' : 'No') : (option === 'for' ? 'For' : 'Against');
            return (
              <button
                key={option}
                className={`measure__pick-btn ${isSelected ? 'measure__pick-btn--selected' : ''}`}
                onClick={() => handlePick(leaning)}
              >
                {label}
              </button>
            );
          })}
          <button
            className={`measure__pick-btn ${pick?.leaning === 'undecided' ? 'measure__pick-btn--selected' : ''}`}
            onClick={() => handlePick('undecided')}
          >
            Not sure
          </button>
        </div>
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
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
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

  .ballot__header-actions {
    display: flex;
    gap: var(--space-1);
  }

  .ballot__action-btn {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-full);
    color: var(--color-text-secondary);
    transition: all var(--transition-fast);
  }

  .ballot__action-btn:hover {
    background: var(--color-surface-subtle);
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

  .ballot__privacy {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    background: var(--color-info-light);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin-bottom: var(--space-5);
  }

  .ballot__privacy svg {
    color: var(--color-info);
    flex-shrink: 0;
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
    gap: var(--space-3);
  }

  .ballot__candidate:last-child {
    border-bottom: none;
  }

  .ballot__candidate:hover {
    background-color: var(--color-surface-subtle);
  }

  .ballot__candidate--picked {
    background-color: var(--color-accent-light);
  }

  .ballot__candidate--picked:hover {
    background-color: var(--color-accent-light);
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

  .ballot__pick-badge {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    flex-shrink: 0;
  }

  .ballot__pick-badge--likely {
    background: var(--color-success-light);
    color: var(--color-success);
  }

  .ballot__pick-badge--considering {
    background: var(--color-warning-light);
    color: var(--color-warning);
  }

  .ballot__pick-badge--unlikely {
    background: var(--color-surface-subtle);
    color: var(--color-text-tertiary);
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

  .measure__picks {
    border-top: 1px solid var(--color-border-light);
    padding-top: var(--space-4);
    margin-top: var(--space-3);
  }

  .measure__picks-label {
    display: block;
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin-bottom: var(--space-3);
  }

  .measure__pick-buttons {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
  }

  .measure__pick-btn {
    padding: var(--space-2) var(--space-4);
    background: var(--color-surface-subtle);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .measure__pick-btn:hover {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }

  .measure__pick-btn--selected {
    background: var(--color-accent);
    border-color: var(--color-accent);
    color: var(--color-text-inverse);
  }

  .measure__pick-btn--selected:hover {
    background: var(--color-accent-dark);
    border-color: var(--color-accent-dark);
    color: var(--color-text-inverse);
  }
`;

const settingsStyles = `
  .settings {
    min-height: 100vh;
    min-height: 100dvh;
    background-color: var(--color-bg);
  }

  .settings__header {
    background-color: var(--color-surface);
    border-bottom: 1px solid var(--color-border-light);
    padding: var(--space-4) var(--space-5);
    padding-top: max(var(--space-4), env(safe-area-inset-top));
  }

  .settings__back {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--color-accent);
    margin-bottom: var(--space-4);
    padding: 0;
  }

  .settings__title {
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0;
  }

  .settings__content {
    max-width: 540px;
    margin: 0 auto;
    padding: var(--space-5);
  }

  .settings__section {
    margin-bottom: var(--space-8);
  }

  .settings__section-title {
    font-size: var(--text-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-tertiary);
    margin: 0 0 var(--space-4);
  }

  .settings__card {
    background: var(--color-surface);
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border-light);
    padding: var(--space-5);
  }

  .settings__privacy-icon {
    width: 48px;
    height: 48px;
    background: var(--color-accent-light);
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: var(--space-4);
  }

  .settings__privacy-icon svg {
    width: 24px;
    height: 24px;
    color: var(--color-accent);
  }

  .settings__card-title {
    font-size: var(--text-lg);
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 var(--space-3);
  }

  .settings__card-desc {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    line-height: var(--leading-relaxed);
    margin: 0 0 var(--space-4);
  }

  .settings__card-desc:last-child {
    margin-bottom: 0;
  }

  .settings__card-desc--warning {
    color: var(--color-warning);
  }

  .settings__confirm-buttons {
    display: flex;
    gap: var(--space-3);
  }

  .settings__confirm-buttons .btn {
    flex: 1;
  }

  .btn--danger {
    background: #dc2626;
    color: white;
  }

  .btn--danger:hover {
    background: #b91c1c;
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
