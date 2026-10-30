import { describe, expect, it } from 'vitest';
import { UNINCORPORATED, placeName, zipFromAddress } from './place';

describe('placeName', () => {
  it('uses Charlotte city limits first', () => {
    expect(placeName({ isCharlotte: true, zip: '28078', address: '123 FOLKSTON DR, 28078' })).toBe(
      'Charlotte'
    );
  });

  it('maps town ZIPs outside the city', () => {
    expect(placeName({ isCharlotte: false, address: '12316 FOLKSTON DR, 28078' })).toBe(
      'Huntersville'
    );
    expect(placeName({ isCharlotte: false, address: '9837 IDLEWILD RD, 28105' })).toBe('Matthews');
    expect(placeName({ isCharlotte: false, zip: '28031' })).toBe('Cornelius');
  });

  it('falls back when the ZIP is not a single town', () => {
    expect(placeName({ isCharlotte: false, address: '4501 MATTHEWS-MINT HILL RD, 28227' })).toBe(
      UNINCORPORATED
    );
  });

  it('reads the trailing ZIP, not a 5-digit house number', () => {
    expect(zipFromAddress('12316 FOLKSTON DR, 28078')).toBe('28078');
    expect(zipFromAddress('12316 FOLKSTON DR')).toBeUndefined();
    expect(zipFromAddress('100 MAIN ST, 28202-1234')).toBe('28202');
    expect(zipFromAddress('28202')).toBe('28202');
    expect(zipFromAddress('28202 MAIN')).toBeUndefined();
  });

  it('maps remaining town ZIPs', () => {
    expect(placeName({ isCharlotte: false, zip: '28036' })).toBe('Davidson');
    expect(placeName({ isCharlotte: false, zip: '28134' })).toBe('Pineville');
  });
});
