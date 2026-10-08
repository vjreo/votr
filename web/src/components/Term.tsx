import { useId, useState, type ReactNode } from 'react';

export const JARGON: Record<string, string> = {
  incumbent: 'currently holds this seat',
  'at-large': 'elected by the whole county',
  'at large': 'elected by the whole county',
};

const TERM_RE = /(incumbent|at-large|at large)/gi;

export function Term({
  term,
  expanded,
  onToggle,
  defId,
}: {
  term: string;
  expanded: boolean;
  onToggle: () => void;
  defId: string;
}) {
  return (
    <button
      type="button"
      className="term"
      aria-expanded={expanded}
      aria-controls={defId}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
    >
      {term}
    </button>
  );
}

/** Wraps incumbent / at-large inline. Definition on tap, as a muted parenthetical. */
export default function JargonText({ text }: { text: string }) {
  const defId = useId();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const nodes: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const match of text.matchAll(TERM_RE)) {
    const raw = match[0];
    const start = match.index ?? 0;
    if (start > last) nodes.push(text.slice(last, start));
    const key = raw.toLowerCase();
    const tokenKey = `${key}-${i++}`;
    const expanded = openKey === tokenKey;
    const meaning = JARGON[key];
    nodes.push(
      <span key={tokenKey} className="term-wrap">
        <Term
          term={raw}
          expanded={expanded}
          onToggle={() => setOpenKey((cur) => (cur === tokenKey ? null : tokenKey))}
          defId={defId}
        />
        {expanded && meaning && (
          <span id={defId} className="term__def" role="note">
            {' '}
            ({meaning})
          </span>
        )}
      </span>
    );
    last = start + raw.length;
  }
  if (!i) return <>{text}</>;
  if (last < text.length) nodes.push(text.slice(last));

  return (
    <span className="jargon">
      {nodes}
      <style>{termStyles}</style>
    </span>
  );
}

export const termStyles = `
  .term-wrap {
    display: inline;
  }
  .term {
    all: unset;
    position: relative;
    display: inline;
    cursor: pointer;
    color: inherit;
    font: inherit;
    font-size: inherit;
    font-weight: inherit;
    line-height: inherit;
    letter-spacing: inherit;
    text-decoration: underline dotted;
    text-decoration-color: currentColor;
    text-decoration-thickness: 1px;
    text-underline-offset: 0.18em;
    text-underline-position: under;
    box-decoration-break: clone;
    -webkit-box-decoration-break: clone;
  }
  .term::after {
    content: "";
    position: absolute;
    left: 50%;
    top: 50%;
    width: max(100%, var(--tap-target-min));
    height: var(--tap-target-min);
    transform: translate(-50%, -50%);
  }
  .term[aria-expanded="true"] {
    text-decoration-style: solid;
  }
  .term__def {
    display: inline;
    font-size: 0.92em;
    font-weight: 400;
    color: var(--color-text-tertiary);
  }
`;
