import { useState } from 'react';
import type { UserLocation } from '../App';
import { NC_VOTER_SEARCH_URL } from '../data/ballot';

interface Props {
  onSubmit: (location: UserLocation) => void;
}

export default function AddressEntry({ onSubmit }: Props) {
  const [address, setAddress] = useState('');
  const [showDistrictPicker, setShowDistrictPicker] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;
    setShowDistrictPicker(true);
  };

  const handleDistrictSelect = (district: 'NC-8' | 'NC-12' | 'NC-14') => {
    const addr = address.trim().toLowerCase();
    const isCharlotte = addr.includes('charlotte') || addr.includes('28');
    onSubmit({
      address: address.trim(),
      district,
      isCharlotte,
    });
  };

  return (
    <div className="entry">
      <div className="entry__container">
        {/* Logo and welcome */}
        <header className="entry__header">
          <div className="entry__logo">
            <span className="entry__logo-icon">🗳️</span>
          </div>
          <h1 className="entry__title">VOTR</h1>
          <p className="entry__subtitle">
            Know your ballot before you vote
          </p>
        </header>

        {/* Election context card */}
        <div className="entry__context">
          <div className="entry__election">
            <span className="entry__election-label">Coming up</span>
            <span className="entry__election-name">2026 General Election</span>
            <span className="entry__election-date">Tuesday, November 3</span>
          </div>
        </div>

        {!showDistrictPicker ? (
          <>
            {/* Address form */}
            <form onSubmit={handleSubmit} className="entry__form">
              <label className="entry__label" htmlFor="address">
                Where do you live in Mecklenburg County?
              </label>
              <input
                id="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your address"
                className="entry__input"
                autoComplete="street-address"
                autoFocus
              />
              <button
                type="submit"
                className="btn btn--primary btn--full"
                disabled={!address.trim()}
              >
                See my ballot
              </button>
            </form>

            {/* Helper text */}
            <p className="entry__helper">
              Your address helps us show the right races for your area. We don't store it.
            </p>
          </>
        ) : (
          /* District picker */
          <div className="entry__districts">
            <p className="entry__label">
              Which congressional district are you in?
            </p>
            <p className="entry__district-help">
              Not sure?{' '}
              <a href={NC_VOTER_SEARCH_URL} target="_blank" rel="noopener noreferrer">
                Look it up on the NC voter site
              </a>
            </p>
            
            <div className="entry__district-list">
              {[
                { id: 'NC-12' as const, name: 'NC-12', desc: 'Most of Charlotte, central Mecklenburg' },
                { id: 'NC-14' as const, name: 'NC-14', desc: 'Western and northern edges' },
                { id: 'NC-8' as const, name: 'NC-8', desc: 'Eastern Mecklenburg' },
              ].map((d) => (
                <button
                  key={d.id}
                  className="entry__district-option"
                  onClick={() => handleDistrictSelect(d.id)}
                >
                  <span className="entry__district-name">{d.name}</span>
                  <span className="entry__district-desc">{d.desc}</span>
                </button>
              ))}
            </div>

            <button
              className="btn btn--ghost"
              onClick={() => setShowDistrictPicker(false)}
            >
              ← Change address
            </button>
          </div>
        )}

        {/* Footer */}
        <footer className="entry__footer">
          <p className="entry__disclaimer">
            VOTR helps you prepare to vote. We show candidate positions from their own words — we never tell you who to vote for.
          </p>
          <a
            href={NC_VOTER_SEARCH_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="entry__official"
          >
            Check your registration at NCSBE.gov →
          </a>
        </footer>
      </div>

      <style>{`
        .entry {
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: var(--space-6) var(--space-5);
          padding-top: max(var(--space-10), env(safe-area-inset-top, 20px));
          background: linear-gradient(180deg, var(--color-bg) 0%, var(--color-surface-subtle) 100%);
        }

        .entry__container {
          width: 100%;
          max-width: 400px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .entry__header {
          text-align: center;
          margin-bottom: var(--space-8);
        }

        .entry__logo {
          width: 72px;
          height: 72px;
          margin: 0 auto var(--space-4);
          background: var(--color-accent-light);
          border-radius: var(--radius-xl);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .entry__logo-icon {
          font-size: 36px;
        }

        .entry__title {
          font-size: var(--text-3xl);
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 0 0 var(--space-2);
          letter-spacing: -0.02em;
        }

        .entry__subtitle {
          font-size: var(--text-lg);
          color: var(--color-text-secondary);
          margin: 0;
        }

        .entry__context {
          margin-bottom: var(--space-8);
        }

        .entry__election {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: var(--space-5);
          background: var(--color-surface);
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border-light);
          text-align: center;
        }

        .entry__election-label {
          font-size: var(--text-xs);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-accent);
          margin-bottom: var(--space-1);
        }

        .entry__election-name {
          font-size: var(--text-lg);
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .entry__election-date {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          margin-top: var(--space-1);
        }

        .entry__form {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .entry__label {
          font-size: var(--text-base);
          font-weight: 500;
          color: var(--color-text-primary);
        }

        .entry__input {
          font-size: var(--text-base);
        }

        .entry__helper {
          margin-top: var(--space-4);
          font-size: var(--text-sm);
          color: var(--color-text-tertiary);
          text-align: center;
          line-height: var(--leading-relaxed);
        }

        .entry__districts {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .entry__district-help {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          margin-top: calc(-1 * var(--space-2));
        }

        .entry__district-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .entry__district-option {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: var(--space-5);
          background: var(--color-surface);
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all var(--transition-normal);
          text-align: left;
          min-height: 72px;
        }

        .entry__district-option:hover {
          border-color: var(--color-accent);
          background: var(--color-accent-light);
        }

        .entry__district-name {
          font-size: var(--text-lg);
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .entry__district-desc {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          margin-top: var(--space-1);
        }

        .entry__footer {
          margin-top: auto;
          padding-top: var(--space-10);
          text-align: center;
        }

        .entry__disclaimer {
          font-size: var(--text-sm);
          color: var(--color-text-tertiary);
          line-height: var(--leading-relaxed);
          margin-bottom: var(--space-4);
        }

        .entry__official {
          font-size: var(--text-sm);
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
