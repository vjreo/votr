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
    <div className="address-entry">
      <div className="address-entry__content">
        <div className="address-entry__header">
          <span className="address-entry__emoji">🗳️</span>
          <h1 className="address-entry__title">VOTR</h1>
          <p className="address-entry__subtitle">
            See what's on your ballot for the 2026 NC General Election
          </p>
        </div>

        {!showDistrictPicker ? (
          <form onSubmit={handleSubmit} className="address-entry__form">
            <label className="address-entry__label">
              Enter your Mecklenburg County address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 525 N Tryon St, Charlotte, NC"
              className="address-entry__input"
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
        ) : (
          <div className="address-entry__district-picker">
            <p className="address-entry__label">
              Which congressional district are you in?
            </p>
            <p className="address-entry__helper">
              If you're not sure, check the{' '}
              <a href={NC_VOTER_SEARCH_URL} target="_blank" rel="noopener noreferrer">
                NC voter lookup
              </a>
            </p>
            <div className="address-entry__districts">
              <button
                className="address-entry__district-btn"
                onClick={() => handleDistrictSelect('NC-12')}
              >
                <span className="address-entry__district-name">NC-12</span>
                <span className="address-entry__district-desc">
                  Most of Charlotte, central Mecklenburg
                </span>
              </button>
              <button
                className="address-entry__district-btn"
                onClick={() => handleDistrictSelect('NC-14')}
              >
                <span className="address-entry__district-name">NC-14</span>
                <span className="address-entry__district-desc">
                  Western/northern Mecklenburg edges
                </span>
              </button>
              <button
                className="address-entry__district-btn"
                onClick={() => handleDistrictSelect('NC-8')}
              >
                <span className="address-entry__district-name">NC-8</span>
                <span className="address-entry__district-desc">
                  Parts of eastern Mecklenburg
                </span>
              </button>
            </div>
            <button
              className="address-entry__back"
              onClick={() => setShowDistrictPicker(false)}
            >
              ← Back
            </button>
          </div>
        )}

        <div className="address-entry__footer">
          <p className="address-entry__disclaimer">
            VOTR helps you prepare to vote. We inform, never endorse — we'll never tell you who to vote for.
          </p>
          <a
            href={NC_VOTER_SEARCH_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="address-entry__official-link"
          >
            Confirm your registration at NCSBE →
          </a>
        </div>
      </div>

      <style>{`
        .address-entry {
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 24px 16px;
          background: linear-gradient(180deg, var(--color-bg) 0%, var(--color-surface) 100%);
        }

        .address-entry__content {
          width: 100%;
          max-width: 400px;
        }

        .address-entry__header {
          text-align: center;
          margin-bottom: 40px;
        }

        .address-entry__emoji {
          font-size: 48px;
          display: block;
          margin-bottom: 12px;
        }

        .address-entry__title {
          font-size: 32px;
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 0 0 8px;
          letter-spacing: -0.5px;
        }

        .address-entry__subtitle {
          font-size: 16px;
          color: var(--color-text-secondary);
          margin: 0;
          line-height: 1.5;
        }

        .address-entry__form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .address-entry__label {
          font-size: 14px;
          font-weight: 500;
          color: var(--color-text-primary);
        }

        .address-entry__helper {
          font-size: 13px;
          color: var(--color-text-tertiary);
          margin-top: -8px;
          margin-bottom: 12px;
        }

        .address-entry__input {
          font-size: 16px;
        }

        .address-entry__district-picker {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .address-entry__districts {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .address-entry__district-btn {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 16px;
          background-color: var(--color-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .address-entry__district-btn:hover {
          border-color: var(--color-primary);
          background-color: var(--color-primary-muted);
        }

        .address-entry__district-name {
          font-size: 17px;
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .address-entry__district-desc {
          font-size: 13px;
          color: var(--color-text-secondary);
          margin-top: 4px;
        }

        .address-entry__back {
          margin-top: 8px;
          font-size: 14px;
          color: var(--color-text-secondary);
          cursor: pointer;
          padding: 8px;
        }

        .address-entry__back:hover {
          color: var(--color-text-primary);
        }

        .address-entry__footer {
          margin-top: 40px;
          text-align: center;
        }

        .address-entry__disclaimer {
          font-size: 12px;
          color: var(--color-text-tertiary);
          line-height: 1.5;
          margin-bottom: 16px;
        }

        .address-entry__official-link {
          font-size: 13px;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
