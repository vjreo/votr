import { useState } from 'react';
import type { UserLocation } from '../utils/storage';
import { NC_VOTER_SEARCH_URL } from '../data/ballot';
import {
  DISTRICTS_ATTRIBUTION,
  formatLocationSummary,
  lookupFromAddress,
  lookupFromGeolocation,
  manualLocation,
  type LookupResult,
} from '../utils/lookup';

interface Props {
  onSubmit: (location: UserLocation) => void;
}

type Step = 'home' | 'result' | 'manual';

const DISTRICTS: { id: 'NC-8' | 'NC-12' | 'NC-14'; name: string; desc: string }[] = [
  { id: 'NC-12', name: 'NC-12', desc: 'Most of Charlotte, central Mecklenburg' },
  { id: 'NC-14', name: 'NC-14', desc: 'Western and northern edges' },
  { id: 'NC-8', name: 'NC-8', desc: 'Eastern Mecklenburg' },
];

function geoErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as GeolocationPositionError).code;
    if (code === 1) {
      return 'Location is blocked for this site. Type an address, or pick your area by hand.';
    }
    if (code === 2 || code === 3) {
      return 'We could not read your location. Type an address, or pick your area by hand.';
    }
  }
  if (err instanceof Error && err.message) return err.message;
  return 'Something went wrong. Try again, or pick your area by hand.';
}

export default function AddressEntry({ onSubmit }: Props) {
  const [step, setStep] = useState<Step>('home');
  const [address, setAddress] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [isCharlotte, setIsCharlotte] = useState(true);
  const [status, setStatus] = useState('');

  const showResult = (next: LookupResult) => {
    setResult(next);
    setError(null);
    setStep('result');
    setStatus('Districts found.');
  };

  const handleLocation = async () => {
    setBusy(true);
    setError(null);
    setStatus('Matching your location to district maps on this device…');
    try {
      showResult(await lookupFromGeolocation());
    } catch (err) {
      setError(geoErrorMessage(err));
      setStatus('');
    } finally {
      setBusy(false);
    }
  };

  const handleAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;
    setBusy(true);
    setError(null);
    setStatus('Looking up that address…');
    try {
      showResult(await lookupFromAddress(address.trim()));
    } catch (err) {
      setError(geoErrorMessage(err));
      setStatus('');
    } finally {
      setBusy(false);
    }
  };

  const handleManualSelect = (district: 'NC-8' | 'NC-12' | 'NC-14') => {
    onSubmit(manualLocation(address, district, isCharlotte));
  };

  return (
    <div className="entry">
      <div className="entry__container">
        <header className="entry__header">
          <a href="#main-content" className="skip-link">Skip to main content</a>
          <div className="entry__logo" aria-hidden="true">
            <span className="entry__logo-icon">🗳️</span>
          </div>
          <h1 className="entry__title">VOTR</h1>
          <p className="entry__subtitle">
            Know your ballot before you vote
          </p>
          <div className="entry__context">
            <div className="entry__election">
              <span className="entry__election-label">Coming up</span>
              <span className="entry__election-name">2026 General Election</span>
              <span className="entry__election-date">Tuesday, November 3</span>
            </div>
          </div>
        </header>

        {step === 'home' && (
          <main id="main-content">
            <div className="entry__form" role="group" aria-labelledby="find-districts">
              <p className="entry__label" id="find-districts">
                Find your Mecklenburg ballot
              </p>
              <button
                type="button"
                className="btn btn--primary btn--full"
                onClick={handleLocation}
                disabled={busy}
              >
                {busy ? 'Looking up…' : 'Use my location'}
              </button>
              <p className="entry__helper entry__helper--tight">
                Your location stays on this device. We match it to maps that ship with VOTR.
              </p>
            </div>

            <p className="entry__or" aria-hidden="true">or</p>

            <form onSubmit={handleAddress} className="entry__form" aria-label="Look up by address">
              <label className="entry__label" htmlFor="address">
                Type your street address
              </label>
              <input
                id="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, Charlotte NC 28202"
                className="entry__input"
                autoComplete="street-address"
                disabled={busy}
              />
              <p className="entry__helper entry__helper--tight">
                Your address stays on this device. A ZIP code helps us load a smaller map.
              </p>
              <button
                type="submit"
                className="btn btn--secondary btn--full"
                disabled={busy || !address.trim()}
              >
                Look up this address
              </button>
            </form>

            {error && (
              <p className="entry__error" role="alert">{error}</p>
            )}
            <p className="visually-hidden" aria-live="polite">{status}</p>

            <button
              type="button"
              className="btn btn--ghost btn--full"
              onClick={() => {
                setError(null);
                setStep('manual');
              }}
              disabled={busy}
            >
              Pick my area by hand
            </button>
          </main>
        )}

        {step === 'result' && result && (
          <main id="main-content" className="entry__result">
            <h2 className="entry__label">Your districts</h2>
            <p className="entry__result-address">{result.location.address}</p>
            <dl className="entry__dl">
              <div>
                <dt>U.S. House</dt>
                <dd>{result.location.district}</dd>
              </div>
              <div>
                <dt>NC Senate</dt>
                <dd>{result.location.ncSenate ? `District ${result.location.ncSenate}` : 'Not matched'}</dd>
              </div>
              <div>
                <dt>NC House</dt>
                <dd>{result.location.ncHouse ? `District ${result.location.ncHouse}` : 'Not matched'}</dd>
              </div>
              <div>
                <dt>County Commission</dt>
                <dd>{result.location.commission ? `District ${result.location.commission}` : 'Not matched'}</dd>
              </div>
              <div>
                <dt>Charlotte city</dt>
                <dd>{result.location.isCharlotte ? 'Yes — bonds apply' : 'No'}</dd>
              </div>
            </dl>
            {result.unmatched.length > 0 && (
              <p className="entry__error" role="status">
                We could not match: {result.unmatched.join(', ')}. You can still continue, or pick by hand.
              </p>
            )}
            <p className="entry__helper">
              {formatLocationSummary(result.location)}
            </p>
            <button
              type="button"
              className="btn btn--primary btn--full"
              onClick={() => onSubmit(result.location)}
            >
              See my ballot
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--full"
              onClick={() => {
                setResult(null);
                setStep('manual');
              }}
            >
              Not right? Change it
            </button>
          </main>
        )}

        {step === 'manual' && (
          <main id="main-content" className="entry__districts" role="group" aria-label="Select your districts">
            <p className="entry__label" id="district-label">
              Which congressional district are you in?
            </p>
            <p className="entry__district-help">
              Not sure?{' '}
              <a href={NC_VOTER_SEARCH_URL} target="_blank" rel="noopener noreferrer">
                Confirm with the state
              </a>
            </p>

            <fieldset className="entry__city">
              <legend className="entry__city-legend">Do you live in Charlotte city limits?</legend>
              <label className="entry__city-option">
                <input
                  type="radio"
                  name="charlotte"
                  checked={isCharlotte}
                  onChange={() => setIsCharlotte(true)}
                />
                Yes — show city bond votes
              </label>
              <label className="entry__city-option">
                <input
                  type="radio"
                  name="charlotte"
                  checked={!isCharlotte}
                  onChange={() => setIsCharlotte(false)}
                />
                No
              </label>
            </fieldset>

            <div className="entry__district-list">
              {DISTRICTS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className="entry__district-option"
                  onClick={() => handleManualSelect(d.id)}
                  aria-label={`${d.name}: ${d.desc}. Charlotte city: ${isCharlotte ? 'yes' : 'no'}`}
                >
                  <span className="entry__district-name">{d.name}</span>
                  <span className="entry__district-desc">{d.desc}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setStep('home')}
              aria-label="Go back to location lookup"
            >
              ← Back
            </button>
          </main>
        )}

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
            Confirm with the state (NCSBE Voter Search) →
          </a>
          <p className="entry__source">
            {DISTRICTS_ATTRIBUTION.summary} Last checked {DISTRICTS_ATTRIBUTION.lastCheckedLabel}.
          </p>
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

        .entry__helper--tight {
          margin-top: 0;
        }

        .entry__or {
          text-align: center;
          margin: var(--space-6) 0;
          font-size: var(--text-sm);
          color: var(--color-text-tertiary);
          text-transform: lowercase;
        }

        .entry__error {
          margin-top: var(--space-4);
          padding: var(--space-4);
          background: var(--color-warning-light);
          color: var(--color-text-primary);
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
          line-height: var(--leading-relaxed);
        }

        .entry__result {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .entry__result-address {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          margin: 0;
        }

        .entry__dl {
          margin: 0;
          background: var(--color-surface);
          border: 1px solid var(--color-border-light);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        .entry__dl > div {
          display: flex;
          justify-content: space-between;
          gap: var(--space-4);
          padding: var(--space-4) var(--space-5);
          border-bottom: 1px solid var(--color-border-light);
        }

        .entry__dl > div:last-child {
          border-bottom: none;
        }

        .entry__dl dt {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
        }

        .entry__dl dd {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--color-text-primary);
          margin: 0;
          text-align: right;
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

        .entry__city {
          border: 1px solid var(--color-border-light);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          background: var(--color-surface);
        }

        .entry__city-legend {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--color-text-primary);
          padding: 0 var(--space-1);
        }

        .entry__city-option {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          min-height: var(--tap-target-min);
          margin-bottom: 0;
          font-weight: var(--font-normal);
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          cursor: pointer;
        }

        .entry__city-option input {
          width: 18px;
          height: 18px;
          accent-color: var(--color-accent);
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
          min-height: var(--tap-target-min);
        }

        .entry__district-option:hover {
          border-color: var(--color-accent);
          background: var(--color-accent-light);
        }

        .entry__district-option:active {
          transform: scale(0.98);
          background: #d5ebeb;
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
          font-weight: var(--font-medium);
        }

        .entry__source {
          margin-top: var(--space-5);
          font-size: var(--text-xs);
          color: var(--color-text-tertiary);
          line-height: var(--leading-relaxed);
        }

        .visually-hidden {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        @media (min-width: 768px) {
          .entry {
            padding: var(--space-10) var(--space-8);
            justify-content: center;
          }

          .entry__container {
            max-width: 480px;
          }

          .entry__header {
            margin-bottom: var(--space-10);
          }

          .entry__title {
            font-size: var(--text-4xl);
          }

          .entry__subtitle {
            font-size: var(--text-xl);
          }
        }
      `}</style>
    </div>
  );
}
