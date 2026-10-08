import { describe, expect, it } from 'vitest';
import { formatDaysLeft, formatDaysShort } from './ballot';

describe('deadline copy', () => {
  it('pluralizes and uses Last day / Today at zero', () => {
    expect(formatDaysLeft(0)).toBe('Last day');
    expect(formatDaysLeft(1)).toBe('1 day left');
    expect(formatDaysLeft(12)).toBe('12 days left');
    expect(formatDaysShort(0)).toBe('Today');
    expect(formatDaysShort(1)).toBe('1 day');
    expect(formatDaysShort(12)).toBe('12 days');
  });
});
