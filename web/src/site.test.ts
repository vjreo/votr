import { describe, expect, it } from 'vitest';
import { SHARE_TEXT, SHARE_TITLE, SITE_URL } from './site';

describe('share copy', () => {
  it('points at the live Pages URL and does not endorse a candidate', () => {
    expect(SITE_URL).toBe('https://vjreo.github.io/votr/');
    expect(SHARE_TITLE).toMatch(/VOTR/);
    expect(SHARE_TEXT).toMatch(/Nonpartisan/);
    expect(SHARE_TEXT).not.toMatch(/vote for/i);
  });
});
