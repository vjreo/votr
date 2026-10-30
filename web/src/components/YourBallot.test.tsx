import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { US_HOUSE_NC14, US_SENATE, type Candidate } from '../data/ballot';
import { charlotteLocation, huntersvilleLocation } from '../test/fixtures';
import YourBallot, { groupCandidates } from './YourBallot';

const noop = {
  onChangeAddress: vi.fn(),
  onCandidatePick: vi.fn(),
  onMeasurePick: vi.fn(),
  onClearAll: vi.fn(),
};

function renderBallot(
  overrides: Partial<ComponentProps<typeof YourBallot>> = {}
) {
  return render(
    <YourBallot
      location={charlotteLocation}
      candidatePicks={[]}
      measurePicks={[]}
      {...noop}
      {...overrides}
    />
  );
}

describe('groupCandidates', () => {
  it('sorts last names A–Z and uses the same contest structure for every candidate', () => {
    const groups = groupCandidates([...US_SENATE, ...US_HOUSE_NC14]);
    expect(groups.map((g) => g.level)).toEqual(['federal']);
    const senate = groups[0].contests.find((c) => c.office === 'U.S. Senate');
    expect(senate?.candidates.map((c) => c.name)).toEqual([
      'Shannon W. Bray',
      'Roy Cooper',
      'Michael Dublin',
      'Michael Whatley',
    ]);
    const house = groups[0].contests.find((c) => c.office === 'U.S. House NC-14');
    expect(house?.candidates.map((c) => c.name)).toEqual(['Tim Moore', 'Lakesha Womack']);
  });

  it('orders office levels and falls back for unknown levels', () => {
    const extra: Candidate = {
      id: 'x',
      name: 'Ada Zebra',
      party: 'Unaffiliated',
      office: 'Mystery Office',
      officeLevel: 'mystery' as Candidate['officeLevel'],
      district: null,
      positions: [],
      sources: [],
      dataStatus: 'incomplete',
    };
    const groups = groupCandidates([extra, US_SENATE[0]]);
    expect(groups[0].level).toBe('federal');
    expect(groups[1].label).toBe('mystery');
  });
});

describe('YourBallot', () => {
  it('lists U.S. Senate candidates alphabetically with equal layout and no party colors', () => {
    renderBallot();
    const race = screen.getByRole('article', { name: 'U.S. Senate' });
    const buttons = within(race).getAllByRole('button');
    expect(buttons.map((btn) => within(btn).getByText(/Bray|Cooper|Dublin|Whatley/).textContent)).toEqual([
      'Shannon W. Bray',
      'Roy Cooper',
      'Michael Dublin',
      'Michael Whatley',
    ]);
    for (const btn of buttons) {
      expect(btn.className).toContain('ballot__candidate');
      expect(btn.className).not.toMatch(/democrat|republican/i);
      expect(btn.querySelector('.ballot__candidate-name')).toBeTruthy();
      expect(btn.querySelector('.ballot__candidate-party')).toBeTruthy();
    }
    expect(within(race).getByText('Democratic')).toBeTruthy();
    expect(within(race).getByText('Republican')).toBeTruthy();
  });

  it('puts the Republican last-name-first in NC-14', () => {
    renderBallot();
    const race = screen.getByRole('article', { name: 'U.S. House NC-14' });
    const names = [...race.querySelectorAll('.ballot__candidate-name')].map((el) => el.textContent);
    expect(names).toEqual(['Tim Moore', 'Lakesha Womack']);
  });

  it('shows Charlotte bonds in the city and hides them outside', () => {
    const { unmount } = renderBallot();
    expect(screen.getByText('Charlotte Bond Votes')).toBeInTheDocument();
    expect(screen.getByText('Transportation ($280M)')).toBeInTheDocument();
    unmount();
    renderBallot({ location: huntersvilleLocation });
    expect(screen.queryByText('Charlotte Bond Votes')).not.toBeInTheDocument();
    expect(screen.getByText(huntersvilleLocation.address)).toBeInTheDocument();
  });

  it('opens a candidate, then settings and dates', async () => {
    const user = userEvent.setup();
    const onCandidatePick = vi.fn();
    const onChangeAddress = vi.fn();
    renderBallot({ onCandidatePick, onChangeAddress });

    await user.click(screen.getByText('Tim Moore'));
    expect(screen.getByRole('heading', { name: 'Tim Moore' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Go back to ballot' }));
    expect(screen.getByRole('heading', { name: 'Your Ballot' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /100 N TRYON ST/ }));
    expect(onChangeAddress).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Settings' }));
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByText(/haven't saved any picks/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Go back to ballot' }));

    await user.click(screen.getByRole('button', { name: 'View key dates' }));
    expect(screen.getByRole('heading', { name: 'Key Dates' })).toBeInTheDocument();
    expect(screen.getByText('Election Day')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Go back to ballot' }));
  });

  it('toggles measure picks and confirms clearing saved data', async () => {
    const user = userEvent.setup();
    const onMeasurePick = vi.fn();
    const onClearAll = vi.fn();
    renderBallot({
      onMeasurePick,
      onClearAll,
      candidatePicks: [{ candidateId: US_HOUSE_NC14[0].id, leaning: 'likely', timestamp: 1 }],
      measurePicks: [{ measureId: 'nc-amend-photo-id-2026', leaning: 'for', timestamp: 2 }],
    });

    expect(screen.getByText('✓')).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'For' })[0]);
    expect(onMeasurePick).toHaveBeenCalledWith('nc-amend-photo-id-2026', null);
    await user.click(screen.getAllByRole('button', { name: 'Against' })[0]);
    expect(onMeasurePick).toHaveBeenCalledWith('nc-amend-photo-id-2026', 'against');
    await user.click(screen.getAllByRole('button', { name: 'Not sure' })[0]);
    expect(onMeasurePick).toHaveBeenCalledWith('nc-amend-photo-id-2026', 'undecided');

    await user.click(screen.getAllByRole('button', { name: 'Yes' })[0]);
    expect(onMeasurePick).toHaveBeenCalledWith('clt-bonds-transportation-2026', 'for');

    await user.click(screen.getByRole('button', { name: 'Settings' }));
    await user.click(screen.getByRole('button', { name: 'Clear my picks' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await user.click(screen.getByRole('button', { name: 'Clear my picks' }));
    await user.click(screen.getByRole('button', { name: 'Yes, clear everything' }));
    expect(onClearAll).toHaveBeenCalled();
  });

  it('links official sources with rel=noopener', async () => {
    const user = userEvent.setup();
    renderBallot();
    await user.click(screen.getByText('Sources'));
    const voterSearch = screen.getAllByRole('link', { name: 'NCSBE Voter Search' })[0];
    expect(voterSearch).toHaveAttribute('href', 'https://vt.ncsbe.gov/reglkup/');
    expect(voterSearch).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByRole('link', { name: 'Mecklenburg BOE' })).toHaveAttribute(
      'href',
      'https://www.mecknc.gov/boe'
    );
  });
});
