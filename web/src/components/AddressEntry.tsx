import { useEffect, useId, useRef, useState } from 'react';
import type { UserLocation } from '../utils/storage';
import { DATA_PROVENANCE, NC_VOTER_SEARCH_URL, OFFICIAL_SOURCES } from '../data/ballot';
import {
  DISTRICTS_ATTRIBUTION,
  lookupFromAddress,
  lookupFromGeolocation,
  manualLocation,
  suggestAddresses,
  type AddressSuggestion,
  type LookupResult,
} from '../utils/lookup';

interface Props {
  onSubmit: (location: UserLocation) => void;
}

type Step = 'home' | 'result' | 'manual' | 'about';

const DISTRICTS: { id: 'NC-8' | 'NC-12' | 'NC-14'; name: string; desc: string }[] = [
  { id: 'NC-12', name: 'NC-12', desc: 'Central Charlotte' },
  { id: 'NC-14', name: 'NC-14', desc: 'West and north' },
  { id: 'NC-8', name: 'NC-8', desc: 'East Mecklenburg' },
];

function geoErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as GeolocationPositionError).code;
    if (code === 1) {
      return 'Location is blocked. Type an address, or pick your area by hand.';
    }
    if (code === 2 || code === 3) {
      return 'Could not read your location. Type an address, or pick by hand.';
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
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [openSuggest, setOpenSuggest] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listId = useId();
  const suggestGen = useRef(0);

  const showResult = (next: LookupResult) => {
    setResult(next);
    setError(null);
    setSuggestions([]);
    setOpenSuggest(false);
    setStep('result');
    setStatus('Districts found.');
  };

  const runLookup = async (fn: () => Promise<LookupResult>, pending: string) => {
    setBusy(true);
    setError(null);
    setStatus(pending);
    try {
      showResult(await fn());
    } catch (err) {
      setError(geoErrorMessage(err));
      setStatus('');
    } finally {
      setBusy(false);
    }
  };

  const handleLocation = () => runLookup(lookupFromGeolocation, 'Matching your location on this device…');

  const lookupTyped = (value: string) => {
    if (!value.trim()) return;
    return runLookup(() => lookupFromAddress(value.trim()), 'Looking up that address…');
  };

  const handleAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      const pick = suggestions[activeIndex];
      setAddress(pick.query);
      lookupTyped(pick.query);
      return;
    }
    lookupTyped(address);
  };

  useEffect(() => {
    const q = address.trim();
    if (step !== 'home' || q.length < 3) {
      setSuggestions([]);
      setOpenSuggest(false);
      setActiveIndex(-1);
      return;
    }
    const gen = ++suggestGen.current;
    const timer = window.setTimeout(() => {
      suggestAddresses(q)
        .then((next) => {
          if (gen !== suggestGen.current) return;
          setSuggestions(next);
          setOpenSuggest(next.length > 0);
          setActiveIndex(-1);
        })
        .catch(() => {
          if (gen !== suggestGen.current) return;
          setSuggestions([]);
          setOpenSuggest(false);
        });
    }, 180);
    return () => window.clearTimeout(timer);
  }, [address, step]);

  const handleManualSelect = (district: 'NC-8' | 'NC-12' | 'NC-14') => {
    onSubmit(manualLocation(address, district, isCharlotte));
  };

  const goHome = () => {
    setError(null);
    setStep('home');
  };

  const compactFooter = step !== 'about';

  return (
    <div className="entry">
      <div className="entry__container">
        <a href="#main-content" className="skip-link">Skip to main content</a>

        {step === 'home' && (
          <>
            <header className="entry__header">
              <h1 className="entry__title">Find your ballot</h1>
              <p className="entry__date">Tuesday, November 3, 2026</p>
            </header>

            <main id="main-content">
              <form
                onSubmit={handleAddress}
                className="entry__search-wrap"
                aria-busy={busy}
              >
                <div className="entry__search">
                  <button
                    type="button"
                    className="entry__icon-btn"
                    onClick={handleLocation}
                    disabled={busy}
                    aria-label="Use my location"
                  >
                    <PinIcon />
                  </button>
                  <label className="visually-hidden" htmlFor="address">
                    Street address and ZIP
                  </label>
                  <input
                    id="address"
                    type="text"
                    role="combobox"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    onFocus={() => setOpenSuggest(suggestions.length > 0)}
                    onBlur={() => window.setTimeout(() => setOpenSuggest(false), 120)}
                    onKeyDown={(e) => {
                      if (!openSuggest || suggestions.length === 0) return;
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setActiveIndex((i) => (i + 1) % suggestions.length);
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
                      } else if (e.key === 'Escape') {
                        setOpenSuggest(false);
                        setActiveIndex(-1);
                      }
                    }}
                    placeholder="Street address and ZIP"
                    className="entry__input"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    disabled={busy}
                    aria-autocomplete="list"
                    aria-expanded={openSuggest && suggestions.length > 0}
                    aria-haspopup="listbox"
                    aria-controls={listId}
                    aria-activedescendant={
                      activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined
                    }
                  />
                  <button
                    type="submit"
                    className="entry__icon-btn entry__icon-btn--go"
                    disabled={busy || !address.trim()}
                    aria-label="Look up"
                  >
                    <ArrowIcon />
                  </button>
                </div>
                <ul
                  id={listId}
                  role="listbox"
                  className="entry__suggest"
                  hidden={!openSuggest || suggestions.length === 0}
                >
                  {suggestions.map((s, i) => (
                    <li key={s.label} role="presentation">
                      <button
                        type="button"
                        id={`${listId}-${i}`}
                        role="option"
                        aria-selected={i === activeIndex}
                        className={`entry__suggest-item${i === activeIndex ? ' is-active' : ''}`}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setAddress(s.query);
                          lookupTyped(s.query);
                        }}
                      >
                        {s.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </form>

              <p className="entry__privacy">
                <LockIcon />
                Stays on your device.
              </p>

              {error && (
                <p className="entry__error" role="alert">{error}</p>
              )}
              <p className="visually-hidden" aria-live="polite">{status}</p>

              <button
                type="button"
                className="entry__text-link"
                onClick={() => {
                  setError(null);
                  setStep('manual');
                }}
                disabled={busy}
              >
                Pick my area by hand
              </button>
            </main>
          </>
        )}

        {step === 'result' && result && (
          <main id="main-content" className="entry__result">
            <h1 className="entry__title">Your districts</h1>
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
                <dd>{result.location.isCharlotte ? 'Yes' : 'No'}</dd>
              </div>
            </dl>
            {result.unmatched.length > 0 && (
              <p className="entry__error" role="status">
                Unmatched: {result.unmatched.join(', ')}. You can still continue.
              </p>
            )}
            <button
              type="button"
              className="btn btn--primary btn--full"
              onClick={() => onSubmit(result.location)}
            >
              See my ballot
            </button>
            <button
              type="button"
              className="entry__text-link"
              onClick={() => {
                setResult(null);
                setStep('manual');
              }}
            >
              Change
            </button>
          </main>
        )}

        {step === 'manual' && (
          <main id="main-content" className="entry__districts">
            <h1 className="entry__title">Pick your area</h1>
            <p className="entry__district-help">
              Not sure?{' '}
              <a href={NC_VOTER_SEARCH_URL} target="_blank" rel="noopener noreferrer">
                Confirm with the state
              </a>
            </p>

            <fieldset className="entry__city">
              <legend className="entry__city-legend">Charlotte city limits?</legend>
              <label className="entry__city-option">
                <input
                  type="radio"
                  name="charlotte"
                  checked={isCharlotte}
                  onChange={() => setIsCharlotte(true)}
                />
                Yes
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
                >
                  <span className="entry__district-name">{d.name}</span>
                  <span className="entry__district-desc">{d.desc}</span>
                </button>
              ))}
            </div>

            <button type="button" className="entry__text-link" onClick={goHome}>
              Back
            </button>
          </main>
        )}

        {step === 'about' && (
          <main id="main-content" className="entry__about">
            <h1 className="entry__title">About &amp; sources</h1>
            <p>
              VOTR is nonpartisan. We show candidate positions from their own words. We never tell you who to vote for.
            </p>
            <p>
              Your address and picks stay on this device. Nothing is sent to a server.
            </p>
            <h2 className="entry__about-h">Maps and addresses</h2>
            <p>{DISTRICTS_ATTRIBUTION.summary}</p>
            <p>Last checked {DISTRICTS_ATTRIBUTION.lastCheckedLabel}.</p>
            <h2 className="entry__about-h">Ballot data</h2>
            <p>
              Candidates and measures: {DATA_PROVENANCE.sources.join('; ')}. Last verified{' '}
              {new Date(DATA_PROVENANCE.lastVerified).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}.
            </p>
            <p className="entry__about-links">
              <a href={OFFICIAL_SOURCES.ncVoterSearch} target="_blank" rel="noopener noreferrer">
                NCSBE Voter Search
              </a>
              <a href={OFFICIAL_SOURCES.meckBoe} target="_blank" rel="noopener noreferrer">
                Mecklenburg BOE
              </a>
            </p>
            <button type="button" className="entry__text-link" onClick={goHome}>
              Back
            </button>
          </main>
        )}

        {compactFooter && (
          <footer className="entry__footer">
            <p className="entry__tagline">Nonpartisan. We never tell you who to vote for.</p>
            <p className="entry__footer-links">
              <button type="button" className="entry__footer-link" onClick={() => setStep('about')}>
                Sources
              </button>
              <a
                href={NC_VOTER_SEARCH_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="entry__footer-link"
              >
                Confirm with the state
              </a>
            </p>
          </footer>
        )}
      </div>

      <style>{`
        .entry {
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: var(--space-6) var(--space-5);
          padding-top: max(var(--space-6), env(safe-area-inset-top, 16px));
          padding-bottom: max(var(--space-6), env(safe-area-inset-bottom, 16px));
          background: var(--color-bg);
        }

        .entry__container {
          width: 100%;
          max-width: 400px;
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
        }

        .entry__header {
          text-align: center;
          margin-bottom: var(--space-8);
        }

        .entry__title {
          font-size: var(--text-2xl);
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 0;
          letter-spacing: -0.03em;
          text-align: center;
        }

        .entry__date {
          font-size: var(--text-sm);
          color: var(--color-text-tertiary);
          margin: var(--space-2) 0 0;
        }

        .entry__search-wrap {
          position: relative;
        }

        .entry__search {
          display: flex;
          align-items: center;
          gap: var(--space-1);
          background: var(--color-surface);
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-full);
          padding: 4px;
          min-height: 52px;
        }

        .entry__search:focus-within {
          border-color: var(--color-accent);
          box-shadow: var(--shadow-focus);
        }

        .entry__icon-btn {
          width: var(--tap-target-min);
          height: var(--tap-target-min);
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-accent);
          flex-shrink: 0;
        }

        .entry__icon-btn:hover:not(:disabled) {
          background: var(--color-accent-light);
        }

        .entry__icon-btn--go {
          background: var(--color-accent);
          color: var(--color-text-inverse);
        }

        .entry__icon-btn--go:hover:not(:disabled) {
          background: var(--color-accent-hover);
          color: var(--color-text-inverse);
        }

        .entry__icon-btn:disabled {
          opacity: 0.45;
        }

        .entry__search input.entry__input {
          flex: 1;
          min-width: 0;
          border: none;
          box-shadow: none;
          background: transparent;
          border-radius: 0;
          min-height: var(--tap-target-min);
          padding: var(--space-2) var(--space-1);
          font-size: var(--text-base);
        }

        .entry__search input.entry__input:focus,
        .entry__search input.entry__input:focus-visible {
          outline: none;
          box-shadow: none;
          border: none;
        }

        .entry__suggest[hidden] {
          display: none;
        }

        .entry__suggest {
          position: absolute;
          left: 0;
          right: 0;
          top: calc(100% + 6px);
          z-index: 20;
          margin: 0;
          padding: var(--space-1);
          list-style: none;
          background: var(--color-surface);
          border: 1px solid var(--color-border-light);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-md);
          max-height: 220px;
          overflow: auto;
        }

        .entry__suggest-item {
          display: block;
          width: 100%;
          text-align: left;
          padding: var(--space-3) var(--space-4);
          min-height: var(--tap-target-min);
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
          color: var(--color-text-primary);
        }

        .entry__suggest-item:hover,
        .entry__suggest-item.is-active {
          background: var(--color-accent-light);
        }

        .entry__privacy {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          margin: var(--space-4) 0 0;
          font-size: var(--text-xs);
          color: var(--color-text-tertiary);
        }

        .entry__privacy svg {
          flex-shrink: 0;
        }

        .entry__text-link {
          display: block;
          width: 100%;
          margin-top: var(--space-4);
          min-height: var(--tap-target-min);
          font-size: var(--text-sm);
          font-weight: 500;
          color: var(--color-accent);
          text-align: center;
        }

        .entry__text-link:hover:not(:disabled) {
          text-decoration: underline;
        }

        .entry__text-link:disabled {
          opacity: 0.5;
        }

        .entry__error {
          margin-top: var(--space-4);
          padding: var(--space-3) var(--space-4);
          background: var(--color-warning-light);
          color: var(--color-text-primary);
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
          line-height: var(--leading-snug);
        }

        .entry__result,
        .entry__districts,
        .entry__about {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .entry__result-address {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          margin: 0;
          text-align: center;
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
          padding: var(--space-3) var(--space-5);
          border-bottom: 1px solid var(--color-border-light);
          min-height: var(--tap-target-min);
          align-items: center;
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

        .entry__district-help {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          margin: 0;
          text-align: center;
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
          padding: var(--space-4) var(--space-5);
          background: var(--color-surface);
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-lg);
          cursor: pointer;
          text-align: left;
          min-height: var(--tap-target-min);
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

        .entry__about p {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          line-height: var(--leading-relaxed);
          margin: 0;
        }

        .entry__about-h {
          font-size: var(--text-xs);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-tertiary);
          margin: var(--space-2) 0 0;
        }

        .entry__about-links {
          display: flex;
          gap: var(--space-4);
          justify-content: center;
          flex-wrap: wrap;
        }

        .entry__footer {
          margin-top: auto;
          padding-top: var(--space-8);
          text-align: center;
        }

        .entry__tagline {
          font-size: var(--text-xs);
          color: var(--color-text-tertiary);
          margin: 0 0 var(--space-3);
        }

        .entry__footer-links {
          display: flex;
          gap: var(--space-5);
          justify-content: center;
          align-items: center;
          margin: 0;
        }

        .entry__footer-link {
          font-size: var(--text-sm);
          font-weight: 500;
          color: var(--color-accent);
          min-height: var(--tap-target-min);
          display: inline-flex;
          align-items: center;
        }

        .entry__footer-link:hover {
          text-decoration: underline;
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
            max-width: 440px;
          }

          .entry__title {
            font-size: var(--text-3xl);
          }
        }
      `}</style>
    </div>
  );
}

function PinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
