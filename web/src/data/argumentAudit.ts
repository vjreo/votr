import type { MeasureExplainer } from './offices';
import { LOADED_RE } from './loadedWords';

export interface ArgumentAudit {
  ok: boolean;
  reasons: string[];
}

function words(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * A pair can drop the draft label only when both sides are present, sourced,
 * within 20% of each other's length, and free of loaded words or a push to vote.
 */
export function auditPairedArguments(
  explainer: MeasureExplainer | null | undefined
): ArgumentAudit {
  const reasons: string[] = [];
  if (!explainer) return { ok: false, reasons: ['No explainer.'] };
  const forSide = explainer.caseFor ?? [];
  const againstSide = explainer.caseAgainst ?? [];
  if (!forSide.length || !againstSide.length) {
    reasons.push('One side has no claims.');
  }

  const forText = forSide.map((claim) => claim.text).join(' ');
  const againstText = againstSide.map((claim) => claim.text).join(' ');
  const forWords = words(forText);
  const againstWords = words(againstText);
  const longer = Math.max(forWords, againstWords);
  if (longer > 0 && Math.abs(forWords - againstWords) / longer > 0.2) {
    reasons.push(
      `Length differs by more than 20% (${forWords} words for, ${againstWords} against).`
    );
  }

  for (const claim of [...forSide, ...againstSide]) {
    if (!claim.source?.title?.trim() || !claim.source.url?.startsWith('https://')) {
      reasons.push('A claim is missing an https source.');
    }
    const loaded = claim.text.match(LOADED_RE);
    if (loaded) reasons.push(`Loaded word "${loaded[0]}".`);
    if (/!/.test(claim.text) || /\b(you should|vote yes|vote no|vote for|vote against)\b/i.test(claim.text)) {
      reasons.push('A claim tells the reader how to vote or uses an exclamation.');
    }
  }

  return { ok: reasons.length === 0, reasons };
}
