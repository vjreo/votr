import { useState, useEffect, useCallback } from 'react';
import YourBallot from './components/YourBallot';
import AddressEntry from './components/AddressEntry';
import {
  loadData,
  saveData,
  clearAllData,
  type UserLocation,
  type CandidatePick,
  type MeasurePick,
} from './utils/storage';

export type { UserLocation, CandidatePick, MeasurePick };

export interface AppState {
  location: UserLocation | null;
  candidatePicks: CandidatePick[];
  measurePicks: MeasurePick[];
}

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const stored = loadData();
    return {
      location: stored.location,
      candidatePicks: stored.candidatePicks,
      measurePicks: stored.measurePicks,
    };
  });

  // Persist to localStorage whenever state changes
  useEffect(() => {
    saveData(state);
  }, [state]);

  const setLocation = useCallback((location: UserLocation | null) => {
    setState(s => ({ ...s, location }));
  }, []);

  const setCandidatePick = useCallback((candidateId: string, leaning: CandidatePick['leaning'] | null) => {
    setState(s => {
      const filtered = s.candidatePicks.filter(p => p.candidateId !== candidateId);
      if (leaning === null) {
        return { ...s, candidatePicks: filtered };
      }
      return {
        ...s,
        candidatePicks: [...filtered, { candidateId, leaning, timestamp: Date.now() }]
      };
    });
  }, []);

  const setMeasurePick = useCallback((measureId: string, leaning: MeasurePick['leaning'] | null) => {
    setState(s => {
      const filtered = s.measurePicks.filter(p => p.measureId !== measureId);
      if (leaning === null) {
        return { ...s, measurePicks: filtered };
      }
      return {
        ...s,
        measurePicks: [...filtered, { measureId, leaning, timestamp: Date.now() }]
      };
    });
  }, []);

  const clearAll = useCallback(() => {
    clearAllData();
    setState({
      location: null,
      candidatePicks: [],
      measurePicks: [],
    });
  }, []);

  if (!state.location) {
    return <AddressEntry onSubmit={setLocation} />;
  }

  return (
    <YourBallot
      location={state.location}
      candidatePicks={state.candidatePicks}
      measurePicks={state.measurePicks}
      onChangeAddress={() => setLocation(null)}
      onCandidatePick={setCandidatePick}
      onMeasurePick={setMeasurePick}
      onClearAll={clearAll}
    />
  );
}
