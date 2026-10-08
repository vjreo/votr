import type { OfficeExplainer } from '../data/offices';
import { currentHolderFor } from '../data/offices';
import JargonText from './Term';

function asSentence(s: string) {
  return /[.!?]$/.test(s.trim()) ? s : `${s}.`;
}

interface Props {
  explainer: OfficeExplainer;
  district?: string | null;
}

/** One-liner as the summary; term, impact, and source stay collapsed. */
export default function Explainer({ explainer, district }: Props) {
  const now = currentHolderFor(explainer, district);
  const meta = explainer.hideMeta
    ? ''
    : [explainer.term, explainer.seats, now ? `Now: ${asSentence(now)}` : '']
        .filter(Boolean)
        .join(' · ');

  return (
    <details className="xpl">
      <summary className="xpl__summary">
        <span>
          {explainer.oneLiner}{' '}
          <span className="xpl__more-label">More</span>
        </span>
      </summary>
      <div className="xpl__more">
        <ul>
          {explainer.localImpact.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        {meta && (
          <p className="xpl__meta">
            <JargonText text={meta} />
          </p>
        )}
        <p className="xpl__src">
          <a href={explainer.source.url} target="_blank" rel="noopener noreferrer">
            {explainer.source.title}
          </a>
        </p>
      </div>
      <style>{xplStyles}</style>
    </details>
  );
}

export const xplStyles = `
  .xpl {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    line-height: var(--leading-snug);
  }
  .xpl__summary {
    cursor: pointer;
    list-style: none;
    min-height: var(--tap-target-min);
    display: flex;
    align-items: center;
    color: var(--color-text-secondary);
    font-weight: 400;
  }
  .xpl__summary::-webkit-details-marker { display: none; }
  .xpl__more-label {
    color: var(--color-accent);
    font-weight: 500;
    white-space: nowrap;
  }
  .xpl[open] .xpl__more-label { display: none; }
  .xpl__more {
    padding-bottom: var(--space-2);
  }
  .xpl__more p {
    margin: 0 0 var(--space-2);
  }
  .xpl ul {
    margin: 0 0 var(--space-2);
    padding-left: 1.15em;
  }
  .xpl li {
    margin-bottom: var(--space-1);
  }
  .xpl__meta {
    margin: 0 0 var(--space-2);
  }
  .xpl__src {
    margin: 0 !important;
  }
  .xpl__src a {
    color: var(--color-accent);
    font-weight: 500;
  }
`;
