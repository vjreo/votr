import { describe, expect, it } from 'vitest';
import { JARGON, termStyles } from './Term';

describe('jargon dictionary', () => {
  it('defines incumbent and at-large', () => {
    expect(JARGON.incumbent).toBe('currently holds this seat');
    expect(JARGON['at-large']).toBe('elected by the whole county');
  });

  it('keeps the term inline without a 44px layout box', () => {
    expect(termStyles).toMatch(/\.term\s*\{[^}]*display:\s*inline;/);
    expect(termStyles).not.toMatch(/\.term\s*\{[^}]*min-height/);
    expect(termStyles).not.toMatch(/\.term\s*\{[^}]*min-width/);
    expect(termStyles).toMatch(/\.term::after\s*\{[^}]*height:\s*var\(--tap-target-min\)/);
    expect(termStyles).toMatch(/\.term__label\s*\{[^}]*border-bottom:\s*1px dotted/);
    expect(termStyles).toMatch(/\.term__def\s*\{[^}]*display:\s*inline;/);
  });
});

