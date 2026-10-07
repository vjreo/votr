import type { Candidate } from '../data/ballot';

interface Props {
  candidate: Candidate;
  onBack: () => void;
}

export default function CandidateDetail({ candidate, onBack }: Props) {
  return (
    <div className="candidate-detail">
      <header className="detail-header">
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>
      </header>

      <main className="detail-content">
        <div className="detail-hero">
          <div className="detail-avatar">
            {candidate.name.charAt(0)}
          </div>
          <h1 className="detail-name">{candidate.name}</h1>
          <p className="detail-party">{candidate.party}</p>
          <p className="detail-office">{candidate.office}</p>
        </div>

        {candidate.bio && (
          <section className="detail-section">
            <h2 className="detail-section-title">About</h2>
            <p className="detail-bio">{candidate.bio}</p>
          </section>
        )}

        {candidate.positions.length > 0 && (
          <section className="detail-section">
            <h2 className="detail-section-title">Positions</h2>
            <div className="positions-list">
              {candidate.positions.map((pos, idx) => (
                <div key={idx} className="position-item">
                  <h3 className="position-issue">{pos.issueName}</h3>
                  <p className="position-stance">{pos.stance}</p>
                  {pos.source && (
                    <a
                      href={pos.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="position-source"
                    >
                      Source →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {candidate.sources.length > 0 && (
          <section className="detail-section">
            <h2 className="detail-section-title">Sources</h2>
            <div className="sources-list">
              {candidate.sources.map((src, idx) => (
                <a
                  key={idx}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="source-link"
                >
                  {src.title}
                  <ExternalLinkIcon />
                </a>
              ))}
            </div>
          </section>
        )}

        {candidate.dataStatus === 'incomplete' && (
          <div className="data-status">
            <InfoIcon />
            <span>
              {candidate.dataStatusNote || 'Some information for this candidate is still being gathered.'}
            </span>
          </div>
        )}

        <footer className="detail-footer">
          <p>
            VOTR presents candidate positions from their own campaign materials and news coverage. 
            We do not endorse any candidate.
          </p>
        </footer>
      </main>

      <style>{`
        .candidate-detail {
          min-height: 100vh;
          min-height: 100dvh;
          background-color: var(--color-bg);
        }

        .detail-header {
          position: sticky;
          top: 0;
          background-color: var(--color-bg);
          padding: 16px;
          padding-top: max(16px, env(safe-area-inset-top));
          z-index: 100;
        }

        .back-btn {
          font-size: 15px;
          color: var(--color-primary);
          padding: 8px 0;
          cursor: pointer;
        }

        .detail-content {
          padding: 0 16px 32px;
          max-width: 600px;
          margin: 0 auto;
        }

        .detail-hero {
          text-align: center;
          padding: 24px 0 32px;
        }

        .detail-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--color-primary), #8b5cf6);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: 700;
          color: var(--color-white);
          margin: 0 auto 16px;
        }

        .detail-name {
          font-size: 24px;
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 0 0 4px;
        }

        .detail-party {
          font-size: 15px;
          font-weight: 500;
          color: var(--color-text-secondary);
          margin: 0 0 4px;
        }

        .detail-office {
          font-size: 14px;
          color: var(--color-text-tertiary);
          margin: 0;
        }

        .detail-section {
          margin-bottom: 24px;
        }

        .detail-section-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 12px;
        }

        .detail-bio {
          font-size: 15px;
          color: var(--color-text-secondary);
          line-height: 1.6;
          margin: 0;
        }

        .positions-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .position-item {
          background-color: var(--color-card);
          border-radius: var(--radius-lg);
          padding: 16px;
        }

        .position-issue {
          font-size: 15px;
          font-weight: 600;
          color: var(--color-text-primary);
          margin: 0 0 8px;
        }

        .position-stance {
          font-size: 14px;
          color: var(--color-text-secondary);
          line-height: 1.5;
          margin: 0;
        }

        .position-source {
          display: inline-block;
          margin-top: 8px;
          font-size: 13px;
        }

        .sources-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .source-link {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: var(--color-primary);
        }

        .source-link svg {
          width: 14px;
          height: 14px;
          opacity: 0.7;
        }

        .data-status {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 14px;
          background-color: var(--color-surface);
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border-light);
          margin-top: 24px;
        }

        .data-status svg {
          flex-shrink: 0;
          color: var(--color-text-tertiary);
          margin-top: 2px;
        }

        .data-status span {
          font-size: 13px;
          color: var(--color-text-secondary);
          line-height: 1.5;
        }

        .detail-footer {
          margin-top: 32px;
          padding-top: 16px;
          border-top: 1px solid var(--color-border-light);
        }

        .detail-footer p {
          font-size: 12px;
          color: var(--color-text-tertiary);
          line-height: 1.5;
          margin: 0;
        }
      `}</style>
    </div>
  );
}

function ExternalLinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}
