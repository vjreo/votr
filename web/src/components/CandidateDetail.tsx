import type { Candidate } from '../data/ballot';
import type { CandidatePick } from '../App';

interface Props {
  candidate: Candidate;
  pick?: CandidatePick;
  onBack: () => void;
  onPick: (leaning: CandidatePick['leaning'] | null) => void;
}

export default function CandidateDetail({ candidate, pick, onBack, onPick }: Props) {
  const hasPositions = candidate.positions.length > 0;
  const hasSources = candidate.sources.length > 0;

  const handlePick = (leaning: CandidatePick['leaning']) => {
    if (pick?.leaning === leaning) {
      onPick(null); // toggle off
    } else {
      onPick(leaning);
    }
  };

  return (
    <div className="detail">
      <header className="detail__header">
        <button 
          className="detail__back" 
          onClick={onBack}
          aria-label="Go back to ballot"
        >
          <ChevronLeftIcon aria-hidden="true" />
          <span>Back to ballot</span>
        </button>
      </header>

      <main className="detail__content">
        {/* Hero */}
        <div className="detail__hero">
          <div className="detail__avatar">
            {candidate.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <h1 className="detail__name">{candidate.name}</h1>
          <p className="detail__party">{candidate.party}</p>
          <p className="detail__office">{candidate.office}</p>
        </div>

        {/* Pick buttons */}
        <fieldset className="detail__pick-section">
          <legend className="detail__pick-label">I'm leaning:</legend>
          <div className="detail__pick-buttons" role="group" aria-label="Mark your preference for this candidate">
            <button
              className={`detail__pick-btn detail__pick-btn--likely ${pick?.leaning === 'likely' ? 'detail__pick-btn--selected' : ''}`}
              onClick={() => handlePick('likely')}
              aria-pressed={pick?.leaning === 'likely'}
            >
              <span className="detail__pick-icon" aria-hidden="true">✓</span>
              <span>Likely voting for</span>
            </button>
            <button
              className={`detail__pick-btn detail__pick-btn--considering ${pick?.leaning === 'considering' ? 'detail__pick-btn--selected' : ''}`}
              onClick={() => handlePick('considering')}
              aria-pressed={pick?.leaning === 'considering'}
            >
              <span className="detail__pick-icon" aria-hidden="true">?</span>
              <span>Still considering</span>
            </button>
            <button
              className={`detail__pick-btn detail__pick-btn--unlikely ${pick?.leaning === 'unlikely' ? 'detail__pick-btn--selected' : ''}`}
              onClick={() => handlePick('unlikely')}
              aria-pressed={pick?.leaning === 'unlikely'}
            >
              <span className="detail__pick-icon" aria-hidden="true">✗</span>
              <span>Probably not</span>
            </button>
          </div>
        </fieldset>

        {/* About */}
        {candidate.bio && (
          <section className="detail__section">
            <h2 className="detail__section-title">About</h2>
            <p className="detail__bio">{candidate.bio}</p>
          </section>
        )}

        {/* Positions */}
        {hasPositions && (
          <section className="detail__section">
            <h2 className="detail__section-title">On the Issues</h2>
            <div className="detail__positions">
              {candidate.positions.map((pos, idx) => (
                <div key={idx} className="detail__position">
                  <h3 className="detail__position-issue">{pos.issueName}</h3>
                  <p className="detail__position-stance">{pos.stance}</p>
                  {pos.source && (
                    <a
                      href={pos.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="detail__position-source"
                    >
                      View source →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty state for no positions */}
        {!hasPositions && (
          <section className="detail__section">
            <div className="detail__empty">
              <div className="detail__empty-icon">📋</div>
              <h3 className="detail__empty-title">Positions coming soon</h3>
              <p className="detail__empty-desc">
                We're still gathering this candidate's positions from their campaign materials. Check back closer to Election Day.
              </p>
            </div>
          </section>
        )}

        {/* Sources */}
        {hasSources && (
          <section className="detail__section">
            <h2 className="detail__section-title">Sources</h2>
            <div className="detail__sources">
              {candidate.sources.map((src, idx) => (
                <a
                  key={idx}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="detail__source"
                >
                  <span className="detail__source-title">{src.title}</span>
                  <ExternalLinkIcon />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Data status notice */}
        {candidate.dataStatus === 'incomplete' && (
          <div className="detail__notice">
            <InfoIcon />
            <p>
              {candidate.dataStatusNote || 'Some information for this candidate is still being gathered from official sources.'}
            </p>
          </div>
        )}

        {/* Footer */}
        <footer className="detail__footer">
          <p>
            All positions are from the candidate's own campaign materials or verified news coverage. VOTR does not endorse any candidate.
          </p>
        </footer>
      </main>

      <style>{`
        .detail {
          min-height: 100vh;
          min-height: 100dvh;
          background-color: var(--color-bg);
        }

        .detail__header {
          position: sticky;
          top: 0;
          z-index: 100;
          background-color: var(--color-surface);
          border-bottom: 1px solid var(--color-border-light);
          padding: var(--space-4) var(--space-5);
          padding-top: max(var(--space-4), env(safe-area-inset-top));
        }

        .detail__back {
          display: flex;
          align-items: center;
          gap: var(--space-1);
          font-size: var(--text-sm);
          font-weight: 500;
          color: var(--color-accent);
          padding: var(--space-2) 0;
          min-height: var(--tap-target-min);
        }

        .detail__content {
          max-width: 540px;
          margin: 0 auto;
          padding: var(--space-5);
          padding-bottom: var(--space-16);
        }

        .detail__hero {
          text-align: center;
          padding: var(--space-6) 0 var(--space-6);
        }

        .detail__avatar {
          width: 88px;
          height: 88px;
          margin: 0 auto var(--space-5);
          background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-dark) 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--text-2xl);
          font-weight: 700;
          color: var(--color-text-inverse);
          letter-spacing: -0.02em;
        }

        .detail__name {
          font-size: var(--text-2xl);
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 0 0 var(--space-2);
        }

        .detail__party {
          font-size: var(--text-base);
          font-weight: 500;
          color: var(--color-text-secondary);
          margin: 0 0 var(--space-1);
        }

        .detail__office {
          font-size: var(--text-sm);
          color: var(--color-text-tertiary);
          margin: 0;
        }

        .detail__pick-section {
          background: var(--color-surface);
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border-light);
          padding: var(--space-5);
          margin-bottom: var(--space-8);
        }

        .detail__pick-label {
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          color: var(--color-text-secondary);
          margin: 0 0 var(--space-4);
          padding: 0;
        }

        .detail__pick-buttons {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .detail__pick-btn {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-4);
          background: var(--color-surface-subtle);
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          color: var(--color-text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: left;
          min-height: var(--tap-target-min);
        }

        .detail__pick-btn:hover {
          border-color: var(--color-text-tertiary);
        }

        .detail__pick-btn:active {
          transform: scale(0.98);
        }

        .detail__pick-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          flex-shrink: 0;
        }

        .detail__pick-btn--likely .detail__pick-icon {
          background: var(--color-success-light);
          color: var(--color-success);
        }

        .detail__pick-btn--considering .detail__pick-icon {
          background: var(--color-warning-light);
          color: var(--color-warning);
        }

        .detail__pick-btn--unlikely .detail__pick-icon {
          background: var(--color-surface-subtle);
          color: var(--color-text-tertiary);
        }

        .detail__pick-btn--selected {
          border-color: var(--color-accent);
          background: var(--color-accent-light);
          color: var(--color-text-primary);
        }

        .detail__section {
          margin-bottom: var(--space-8);
        }

        .detail__section-title {
          font-size: var(--text-xs);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-tertiary);
          margin: 0 0 var(--space-4);
        }

        .detail__bio {
          font-size: var(--text-base);
          color: var(--color-text-secondary);
          line-height: var(--leading-relaxed);
          margin: 0;
        }

        .detail__positions {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .detail__position {
          background: var(--color-surface);
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border-light);
          padding: var(--space-5);
        }

        .detail__position-issue {
          font-size: var(--text-base);
          font-weight: 600;
          color: var(--color-text-primary);
          margin: 0 0 var(--space-3);
        }

        .detail__position-stance {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          line-height: var(--leading-relaxed);
          margin: 0;
        }

        .detail__position-source {
          display: inline-block;
          margin-top: var(--space-3);
          font-size: var(--text-sm);
          font-weight: 500;
        }

        .detail__empty {
          text-align: center;
          padding: var(--space-8) var(--space-5);
          background: var(--color-surface);
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border-light);
        }

        .detail__empty-icon {
          font-size: 40px;
          margin-bottom: var(--space-4);
        }

        .detail__empty-title {
          font-size: var(--text-lg);
          font-weight: 600;
          color: var(--color-text-primary);
          margin: 0 0 var(--space-2);
        }

        .detail__empty-desc {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          line-height: var(--leading-relaxed);
          margin: 0;
        }

        .detail__sources {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .detail__source {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-3);
          padding: var(--space-4);
          background: var(--color-surface);
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border-light);
          font-size: var(--text-sm);
          color: var(--color-accent);
          transition: all var(--transition-fast);
        }

        .detail__source:hover {
          border-color: var(--color-accent);
          background: var(--color-accent-light);
          text-decoration: none;
        }

        .detail__source-title {
          flex: 1;
        }

        .detail__source svg {
          flex-shrink: 0;
          opacity: 0.7;
        }

        .detail__notice {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
          padding: var(--space-4);
          background: var(--color-info-light);
          border-radius: var(--radius-md);
          margin-bottom: var(--space-8);
        }

        .detail__notice svg {
          flex-shrink: 0;
          color: var(--color-info);
          margin-top: 2px;
        }

        .detail__notice p {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          line-height: var(--leading-relaxed);
          margin: 0;
        }

        .detail__footer {
          text-align: center;
          padding-top: var(--space-6);
          border-top: 1px solid var(--color-border-light);
        }

        .detail__footer p {
          font-size: var(--text-sm);
          color: var(--color-text-tertiary);
          line-height: var(--leading-relaxed);
          margin: 0;
        }

        /* Responsive: Desktop layout */
        @media (min-width: 768px) {
          .detail__content {
            max-width: var(--content-width-lg);
            padding: var(--space-8);
          }

          .detail__header {
            padding: var(--space-5) var(--space-8);
          }

          .detail__positions {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: var(--space-5);
          }

          .detail__pick-buttons {
            flex-direction: row;
          }

          .detail__pick-btn {
            flex: 1;
          }
        }

        @media (min-width: 1024px) {
          .detail__content {
            padding: var(--space-10) var(--space-8);
          }
        }
      `}</style>
    </div>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}
