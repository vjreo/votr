import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearAllData, loadData, saveData, type StoredData } from './storage';
import { charlotteLocation } from '../test/fixtures';

describe('on-device storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts empty when nothing is stored', () => {
    const data = loadData();
    expect(data.location).toBeNull();
    expect(data.candidatePicks).toEqual([]);
    expect(data.measurePicks).toEqual([]);
  });

  it('writes only to votr_data and never posts the payload', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response());
    saveData({
      location: charlotteLocation,
      candidatePicks: [{ candidateId: 'x', leaning: 'likely', timestamp: 1 }],
      measurePicks: [{ measureId: 'y', leaning: 'for', timestamp: 2 }],
    });

    expect(localStorage.getItem('votr_data')).toBeTruthy();
    expect(Object.keys(localStorage)).toEqual(['votr_data']);
    const stored = JSON.parse(localStorage.getItem('votr_data')!) as StoredData;
    expect(stored.location?.address).toBe(charlotteLocation.address);
    expect(stored.candidatePicks[0].leaning).toBe('likely');
    expect(stored.lastUpdated).toBeGreaterThan(0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('merges partial updates and reloads them', () => {
    saveData({ location: charlotteLocation });
    saveData({ candidatePicks: [{ candidateId: 'a', leaning: 'considering', timestamp: 9 }] });
    const data = loadData();
    expect(data.location?.district).toBe('NC-14');
    expect(data.candidatePicks).toHaveLength(1);
  });

  it('returns defaults when stored JSON is corrupt', () => {
    localStorage.setItem('votr_data', '{not-json');
    expect(loadData().location).toBeNull();
  });

  it('clears the device key', () => {
    saveData({ location: charlotteLocation });
    clearAllData();
    expect(localStorage.getItem('votr_data')).toBeNull();
    expect(loadData().location).toBeNull();
  });

  it('swallows localStorage failures', () => {
    const proto = Object.getPrototypeOf(localStorage) as Storage;
    vi.spyOn(proto, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(proto, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(proto, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(loadData().candidatePicks).toEqual([]);
    expect(() => saveData({ location: charlotteLocation })).not.toThrow();
    expect(() => clearAllData()).not.toThrow();
  });
});
