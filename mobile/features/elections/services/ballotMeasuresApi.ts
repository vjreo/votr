import api from '../../../shared/services/api';

export interface BallotMeasure {
  id: string;
  measure_id: string;
  type: 'amendment' | 'bond' | 'referendum' | 'initiative';
  title: string;
  short_title?: string;
  ballot_question: string;
  official_summary?: string;
  explanation?: string;
  source_law?: string;
  choices: string[];
  state: string;
  county?: string;
  city?: string;
  election_date: string;
  principal?: number;
  estimated_cost?: number;
  estimated_tax_impact?: string;
  sources?: Array<{ url: string; source_type: string; title?: string }>;
}

export interface BallotMeasuresResponse {
  success: boolean;
  count: number;
  measures: BallotMeasure[];
}

interface GetAllOptions {
  state?: string;
  county?: string;
  city?: string;
  electionDate?: string;
  type?: string;
}

export const ballotMeasuresApi = {
  getAll: (options: GetAllOptions = {}) =>
    api.get<BallotMeasuresResponse>('/ballot-measures', {
      params: {
        state: options.state,
        county: options.county,
        city: options.city,
        electionDate: options.electionDate,
        type: options.type,
      },
    }),

  getById: (id: string) => api.get<BallotMeasure>(`/ballot-measures/${id}`),
};
