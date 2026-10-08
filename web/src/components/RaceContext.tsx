import type { Candidate } from '../data/ballot';
import { explainerForOffice } from '../data/offices';
import type { UserLocation } from '../utils/storage';
import Explainer from './Explainer';

function districtFor(
  candidate: Candidate | undefined,
  office: string,
  location?: UserLocation | null
): string | undefined {
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
  const jargon = candidate ? jargonForCandidate(candidate) : [];

  return (
    <div className={`race-ctx${compact ? ' race-ctx--compact' : ''}`}>
      <Explainer explainer={explainer} district={district} jargon={jargon} />
      <style>{`
        .race-ctx {
          padding: 0 var(--space-5) var(--space-2);
        }
        .race-ctx--compact {
          padding: 0;
          margin: var(--space-4) 0 var(--space-5);
          text-align: left;
        }
      `}</style>
    </div>
  );
}
