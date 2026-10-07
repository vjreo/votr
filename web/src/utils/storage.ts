/**
 * Local storage utilities for VOTR
 * 
 * All user data stays on device. Nothing is sent to any server.
 * Each device is independent — friends can share the link and 
 * each person's picks are private to their own device.
 */

const STORAGE_KEY = 'votr_data';

export interface UserLocation {
  address: string;
  district: 'NC-8' | 'NC-12' | 'NC-14';
  isCharlotte: boolean;
  ncSenate?: string;
  ncHouse?: string;
  commission?: string;
  lookupSource?: 'geolocation' | 'census' | 'manual';
}

export interface CandidatePick {
  candidateId: string;
  leaning: 'considering' | 'likely' | 'unlikely';
  timestamp: number;
}

export interface MeasurePick {
  measureId: string;
  leaning: 'for' | 'against' | 'undecided';
  timestamp: number;
}

export interface StoredData {
  location: UserLocation | null;
  candidatePicks: CandidatePick[];
  measurePicks: MeasurePick[];
  lastUpdated: number;
}

const DEFAULT_DATA: StoredData = {
  location: null,
  candidatePicks: [],
  measurePicks: [],
  lastUpdated: Date.now(),
};

export function loadData(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DATA;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_DATA, ...parsed };
  } catch {
    return DEFAULT_DATA;
  }
}

export function saveData(data: Partial<StoredData>): void {
  try {
    const current = loadData();
    const updated = { 
      ...current, 
      ...data, 
      lastUpdated: Date.now() 
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage unavailable (private browsing, etc.) — silently fail
  }
}

export function clearAllData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silently fail
  }
}

export function getLocation(): UserLocation | null {
  return loadData().location;
}

export function setLocation(location: UserLocation | null): void {
  saveData({ location });
}

export function getCandidatePicks(): CandidatePick[] {
  return loadData().candidatePicks;
}

export function setCandidatePick(candidateId: string, leaning: CandidatePick['leaning']): void {
  const data = loadData();
  const existing = data.candidatePicks.filter(p => p.candidateId !== candidateId);
  saveData({
    candidatePicks: [...existing, { candidateId, leaning, timestamp: Date.now() }]
  });
}

export function removeCandidatePick(candidateId: string): void {
  const data = loadData();
  saveData({
    candidatePicks: data.candidatePicks.filter(p => p.candidateId !== candidateId)
  });
}

export function getMeasurePicks(): MeasurePick[] {
  return loadData().measurePicks;
}

export function setMeasurePick(measureId: string, leaning: MeasurePick['leaning']): void {
  const data = loadData();
  const existing = data.measurePicks.filter(p => p.measureId !== measureId);
  saveData({
    measurePicks: [...existing, { measureId, leaning, timestamp: Date.now() }]
  });
}

export function removeMeasurePick(measureId: string): void {
  const data = loadData();
  saveData({
    measurePicks: data.measurePicks.filter(p => p.measureId !== measureId)
  });
}

export function hasAnyPicks(): boolean {
  const data = loadData();
  return data.candidatePicks.length > 0 || data.measurePicks.length > 0 || data.location !== null;
}
