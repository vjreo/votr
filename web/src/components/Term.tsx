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

/** Wraps incumbent / at-large in a 44px dotted-underline control. Definition on tap. */
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
    nodes.push(
      <Term
        key={tokenKey}
        term={raw}
        expanded={openKey === tokenKey}
        onToggle={() => setOpenKey((cur) => (cur === tokenKey ? null : tokenKey))}
        defId={defId}
      />
    );
    last = start + raw.length;
  }
  if (!i) return <>{text}</>;
  if (last < text.length) nodes.push(text.slice(last));
  const openMeaning = openKey ? JARGON[openKey.replace(/-\d+$/, '')] : null;

  return (
    <span className="jargon">
      {nodes}
      {openMeaning && (
        <span id={defId} className="term__def" role="note">
          {openMeaning}
        </span>
      )}
      <style>{termStyles}</style>
    </span>
  );
}

export const termStyles = `
  .term {
    display: inline-flex;
    align-items: center;
    min-height: var(--tap-target-min);
    min-width: var(--tap-target-min);
    justify-content: center;
    margin: -12px 0;
    padding: 0 2px;
    border: 0;
    border-bottom: 1px dotted var(--color-text-secondary);
    border-radius: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    font-weight: inherit;
    line-height: inherit;
    cursor: pointer;
    vertical-align: baseline;
  }
  .term[aria-expanded="true"] {
    border-bottom-style: solid;
    color: var(--color-accent);
  }
  .term__def {
    display: block;
    margin-top: var(--space-2);
    font-size: var(--text-sm);
    font-weight: 400;
    color: var(--color-text-secondary);
    line-height: var(--leading-snug);
  }
`;
