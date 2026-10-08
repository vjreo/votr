import type { Candidate } from '../data/ballot';
import { explainerForOffice, currentHolderFor } from '../data/offices';
import type { UserLocation } from '../utils/storage';

function districtFor(candidate: Candidate | undefined, office: string, location?: UserLocation | null): string | undefined {
  if (office.startsWith('U.S. House')) {
    return candidate?.district || location?.district;
  }
  if (office.includes('Commission District')) {
    return candidate?.district || location?.commission;
  }
  return candidate?.district || undefined;
}

export function jargonForCandidate(candidate: Candidate): { term: string; meaning: string }[] {
  const bits: { term: string; meaning: string }[] = [];
  if (/incumbent/i.test(candidate.bio || '')) {
    bits.push({ term: 'incumbent', meaning: 'currently holds this seat' });
  }
  if (/at-large|at large/i.test(candidate.office) || candidate.district === 'At-Large') {
    bits.push({ term: 'at-large', meaning: 'elected by the whole county' });
  }
  return bits;
}

export default function RaceContext({
  office,
  location,
  candidate,
  compact = false,
}: {
  office: string;
  location?: UserLocation | null;
  candidate?: Candidate;
  compact?: boolean;
}) {
  const explainer = explainerForOffice(office);
  if (!explainer) return null;
  const district = districtFor(candidate, office, location);
  const extraJargon = candidate ? jargonForCandidate(candidate) : [];
  const now = currentHolderFor(explainer, district);

  return (
    <div className={`race-ctx${compact ? ' race-ctx--compact' : ''}`}>
      <p className="race-ctx__line">{explainer.oneLiner}</p>
      {extraJargon.length > 0 && (
        <p className="race-ctx__jargon">
          {extraJargon.map((j) => `${j.term}: ${j.meaning}`).join('. ')}.
        </p>
      )}
      <details className="race-ctx__more">
        <summary>What this means for you</summary>
        <ul>
          {explainer.localImpact.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>
          Term: {explainer.term}. Seats: {explainer.seats}.
        </p>
        {now && <p>Now: {now}.</p>}
        <p>{explainer.controls}</p>
        <p>
          <a href={explainer.source.url} target="_blank" rel="noopener noreferrer">
            {explainer.source.title}
          </a>
        </p>
      </details>
      <style>{`
        .race-ctx {
          padding: 0 var(--space-5) var(--space-3);
        }
        .race-ctx--compact {
          padding: 0;
          margin: var(--space-4) 0 var(--space-5);
          text-align: left;
        }
        .race-ctx__line,
        .race-ctx__jargon {
          margin: 0 0 var(--space-2);
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          line-height: var(--leading-snug);
        }
        .race-ctx__more summary {
          cursor: pointer;
          color: var(--color-accent);
          font-size: var(--text-sm);
          font-weight: 500;
          min-height: 40px;
          display: flex;
          align-items: center;
          list-style: none;
        }
        .race-ctx__more summary::-webkit-details-marker { display: none; }
        .race-ctx__more ul {
          margin: var(--space-2) 0;
          padding-left: 1.15em;
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
        }
        .race-ctx__more li { margin-bottom: var(--space-1); }
        .race-ctx__more p {
          margin: 0 0 var(--space-2);
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
        }
        .race-ctx__more a { color: var(--color-accent); font-weight: 500; }
      `}</style>
    </div>
  );
}
