import type { OfficeExplainer } from '../data/offices';
import { currentHolderFor } from '../data/offices';

interface Props {
  explainer: OfficeExplainer;
  district?: string | null;
}

export function ExplainerBody({ explainer, district }: Props) {
  const now = currentHolderFor(explainer, district);
  return (
    <>
      <p className="xpl__line">{explainer.oneLiner}</p>
      <p>{explainer.controls}</p>
      <p>
        Term: {explainer.term}. Seats: {explainer.seats}.
      </p>
      {now && <p>Now: {now}.</p>}
      {explainer.jargon?.map((j) => (
        <p key={j.term}>
          {j.term}: {j.meaning}.
        </p>
      ))}
      <p className="xpl__you-label">What this means for you</p>
      <ul>
        {explainer.localImpact.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className="xpl__src">
        <a href={explainer.source.url} target="_blank" rel="noopener noreferrer">
          {explainer.source.title}
        </a>
      </p>
    </>
  );
}

export default function Explainer({ explainer, district }: Props) {
  return (
    <div className="xpl">
      <ExplainerBody explainer={explainer} district={district} />
      <style>{xplStyles}</style>
    </div>
  );
}

export const xplStyles = `
  .xpl {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    line-height: var(--leading-snug);
  }
  .xpl__line {
    margin: 0 0 var(--space-2);
    color: var(--color-text-primary);
  }
  .xpl p {
    margin: 0 0 var(--space-2);
  }
  .xpl ul {
    margin: 0 0 var(--space-3);
    padding-left: 1.15em;
  }
  .xpl li {
    margin-bottom: var(--space-1);
  }
  .xpl__you-label {
    font-weight: 600;
    color: var(--color-text-primary);
    margin: var(--space-3) 0 var(--space-2) !important;
  }
  .xpl__src {
    margin: 0 !important;
  }
  .xpl__src a {
    color: var(--color-accent);
    font-weight: 500;
  }
`;
