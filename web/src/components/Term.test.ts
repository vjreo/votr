import { describe, expect, it } from 'vitest';
import { JARGON } from './Term';

describe('jargon dictionary', () => {
  it('defines incumbent and at-large', () => {
    expect(JARGON.incumbent).toBe('currently holds this seat');
    expect(JARGON['at-large']).toBe('elected by the whole county');
  });
});
