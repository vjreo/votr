import api from '../../../shared/services/api';

export interface ContestCandidate {
  name: string;
  party?: string;
  candidateUrl?: string;
  email?: string;
  phone?: string;
}

export interface Contest {
  type: string;
  office: string;
  district?: { name: string };
  candidates?: ContestCandidate[];
}

export interface SampleBallotResponse {
  success: boolean;
  message?: string;
  election?: { id: string; name: string; electionDay: string };
  contests: Contest[];
  pollingLocations?: Array<{ address: { locationName?: string; line1: string; city: string; state: string; zip: string } }>;
  earlyVoteSites?: unknown[];
  otherElections?: unknown[];
}

export const sampleBallotApi = {
  getByAddress: (location: string, options?: { state?: string; lat?: number; lng?: number }) =>
    api.get<SampleBallotResponse>('/sample-ballot', {
      params: { location, state: options?.state, lat: options?.lat, lng: options?.lng },
    }),
};
