import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { charlotteLocation } from './test/fixtures';

vi.mock('./utils/lookup', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./utils/lookup')>();
  return {
    ...actual,
    lookupFromAddress: vi.fn(),
    lookupFromGeolocation: vi.fn(),
    suggestAddresses: vi.fn(async () => []),
  };
});

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts on address entry when this device has no saved location', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Find your ballot' })).toBeInTheDocument();
    expect(localStorage.getItem('votr_data')).toBeTruthy();
  });

  it('restores a saved location and persists a candidate pick on this device', async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      'votr_data',
      JSON.stringify({
        location: charlotteLocation,
        candidatePicks: [],
        measurePicks: [],
        lastUpdated: 1,
      })
    );
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Your Ballot' })).toBeInTheDocument();

    await user.click(screen.getByText('Tim Moore'));
    await user.click(screen.getByRole('button', { name: /Likely voting for/ }));
    await user.click(screen.getByRole('button', { name: 'Go back to ballot' }));
    expect(screen.getByText('✓')).toBeInTheDocument();

    const stored = JSON.parse(localStorage.getItem('votr_data')!);
    expect(stored.location.address).toBe(charlotteLocation.address);
    expect(stored.candidatePicks[0].leaning).toBe('likely');
    expect(stored.candidatePicks[0].candidateId).toContain('moore');

    await user.click(screen.getByText('Tim Moore'));
    await user.click(screen.getByRole('button', { name: /Likely voting for/ }));
    await user.click(screen.getByRole('button', { name: 'Go back to ballot' }));
    expect(screen.queryByText('✓')).not.toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'For' })[0]);
    expect(JSON.parse(localStorage.getItem('votr_data')!).measurePicks[0].leaning).toBe('for');

    await user.click(screen.getByRole('button', { name: /100 N TRYON ST/ }));
    expect(screen.getByRole('heading', { name: 'Find your ballot' })).toBeInTheDocument();
  });

  it('clears on-device data from settings', async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      'votr_data',
      JSON.stringify({
        location: charlotteLocation,
        candidatePicks: [{ candidateId: 'x', leaning: 'likely', timestamp: 1 }],
        measurePicks: [],
        lastUpdated: 1,
      })
    );
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    await user.click(screen.getByRole('button', { name: 'Clear my picks' }));
    await user.click(screen.getByRole('button', { name: 'Yes, clear everything' }));
    expect(screen.getByRole('heading', { name: 'Find your ballot' })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('votr_data')!).location).toBeNull();
  });
});
