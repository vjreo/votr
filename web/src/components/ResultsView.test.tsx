import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { charlotteLocation, huntersvilleLocation } from '../test/fixtures';
import type { OfficialResults } from '../results/types';
import ResultsView from './ResultsView';

const fixture: OfficialResults = {
  statusLabel: 'Unofficial',
  statusTitle: '11/03/2026 UNOFFICIAL GENERAL ELECTION RESULTS - MECKLENBURG',
  sourceUrl: 'https://er.ncsbe.gov/example',
  sourceTitle: 'NC State Board of Elections results',
  lastUpdated: 'November 3, 2026 9:00 pm',
  precinctsReported: '10',
  precinctsTotal: '195',
  contests: [
    {
      name: 'US SENATE (VOTE FOR 1)',
      choices: [
        { name: 'Lower total', party: 'Republican', votes: '10', percent: '0.2000' },
        { name: 'Higher total', party: 'Democratic', votes: '40', percent: '0.8000' },
      ],
    },
  ],
};

describe('ResultsView', () => {
  it('shows an empty state before the polls close and does not read totals', async () => {
    const load = vi.fn(async () => fixture);
    render(
      <ResultsView
        location={charlotteLocation}
        onBack={vi.fn()}
        now={new Date('2026-11-03T12:00:00-05:00')}
        load={load}
      />
    );
    expect(screen.getByRole('heading', { name: 'Official results' })).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('Results not yet available');
    expect(screen.queryByText(/Higher total/)).not.toBeInTheDocument();
    expect(load).not.toHaveBeenCalled();
  });

  it('lists every choice in file order, with one style and no winner label', async () => {
    render(
      <ResultsView
        location={charlotteLocation}
        onBack={vi.fn()}
        now={new Date('2026-11-15T12:00:00-05:00')}
        load={async () => fixture}
      />
    );
    const contest = await screen.findByRole('region', { name: 'US SENATE (VOTE FOR 1)' });
    const rows = contest.querySelectorAll('.results__choice');
    expect([...rows].map((row) => row.textContent)).toEqual([
      'Lower totalRepublican10 votes, 20.00%',
      'Higher totalDemocratic40 votes, 80.00%',
    ]);
    expect(new Set([...rows].map((row) => row.className)).size).toBe(1);
    expect(screen.getByText('Unofficial')).toBeInTheDocument();
    expect(screen.getByText(/Last updated November 3, 2026 9:00 pm/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'NC State Board of Elections results' })).toHaveAttribute(
      'href',
      'https://er.ncsbe.gov/example'
    );
    expect(screen.queryByText(/leading|winner|projected/i)).not.toBeInTheDocument();
  });

  it('says results are not available when no source covers the county', async () => {
    render(
      <ResultsView
        location={charlotteLocation}
        onBack={vi.fn()}
        now={new Date('2026-11-15T12:00:00-05:00')}
        load={async () => null}
      />
    );
    expect(await screen.findByRole('status')).toHaveTextContent(/No official results file is connected/);
  });

  it('says results are not available when the file cannot be read', async () => {
    render(
      <ResultsView
        location={charlotteLocation}
        onBack={vi.fn()}
        now={new Date('2026-11-15T12:00:00-05:00')}
        load={() => Promise.reject(new Error('offline'))}
      />
    );
    expect(await screen.findByRole('status')).toHaveTextContent('Results not yet available');
  });

  it('returns to the ballot from the back button', async () => {
    const onBack = vi.fn();
    const user = userEvent.setup();
    render(
      <ResultsView
        location={charlotteLocation}
        onBack={onBack}
        now={new Date('2026-11-03T12:00:00-05:00')}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Go back to ballot' }));
    expect(onBack).toHaveBeenCalled();
  });

  it('hides city bonds outside Charlotte', async () => {
    render(
      <ResultsView
        location={huntersvilleLocation}
        onBack={vi.fn()}
        now={new Date('2026-11-15T12:00:00-05:00')}
      />
    );
    expect(await screen.findByRole('region', { name: /DISTRICT 12/ })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /HOUSING BONDS/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /DISTRICT 14/ })).not.toBeInTheDocument();
  });

  it('loads the bundled Mecklenburg file after poll close', async () => {
    render(
      <ResultsView
        location={charlotteLocation}
        onBack={vi.fn()}
        now={new Date('2026-11-15T12:00:00-05:00')}
      />
    );
    await waitFor(() => {
      expect(screen.getByText('Official')).toBeInTheDocument();
    });
    expect(screen.getByText(/Last updated November 13, 2026 12:03 pm/)).toBeInTheDocument();
    expect(screen.getByText('Roy Cooper')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /HOUSING BONDS/ })).toBeInTheDocument();
  });
});
