import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { charlotteLocation } from '../test/fixtures';
import AddressEntry, { geoErrorMessage } from './AddressEntry';
import * as lookup from '../utils/lookup';

vi.mock('../utils/lookup', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/lookup')>();
  return {
    ...actual,
    lookupFromAddress: vi.fn(),
    lookupFromGeolocation: vi.fn(),
    suggestAddresses: vi.fn(async () => []),
  };
});

const lookupFromAddress = vi.mocked(lookup.lookupFromAddress);
const lookupFromGeolocation = vi.mocked(lookup.lookupFromGeolocation);
const suggestAddresses = vi.mocked(lookup.suggestAddresses);

describe('geoErrorMessage', () => {
  it('maps geolocation codes and error objects', () => {
    expect(geoErrorMessage({ code: 1 })).toMatch(/Location is blocked/);
    expect(geoErrorMessage({ code: 2 })).toMatch(/Could not read your location/);
    expect(geoErrorMessage({ code: 3 })).toMatch(/Could not read your location/);
    expect(geoErrorMessage(new Error('typed failure'))).toBe('typed failure');
    expect(geoErrorMessage('nope')).toMatch(/Something went wrong/);
  });
});

describe('AddressEntry', () => {
  beforeEach(() => {
    lookupFromAddress.mockReset();
    lookupFromGeolocation.mockReset();
    suggestAddresses.mockReset();
    suggestAddresses.mockResolvedValue([]);
  });

  it('looks up a typed address on the device and continues to the ballot', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    lookupFromAddress.mockResolvedValue({ location: charlotteLocation, unmatched: [] });
    render(<AddressEntry onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/Street address and ZIP/), '100 N Tryon St, 28202');
    await user.click(screen.getByRole('button', { name: 'Look up' }));

    await screen.findByRole('heading', { name: 'Your districts' });
    expect(lookupFromAddress).toHaveBeenCalledWith('100 N Tryon St, 28202');
    expect(screen.getByText(charlotteLocation.address)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'See my ballot' }));
    expect(onSubmit).toHaveBeenCalledWith(charlotteLocation);
  });

  it('shows unmatched districts and GPS errors', async () => {
    const user = userEvent.setup();
    lookupFromAddress.mockResolvedValue({
      location: charlotteLocation,
      unmatched: ['NC Senate'],
    });
    lookupFromGeolocation.mockRejectedValue({ code: 1 });
    render(<AddressEntry onSubmit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Use my location' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/Location is blocked/);

    await user.type(screen.getByLabelText(/Street address and ZIP/), '100 Main');
    await user.click(screen.getByRole('button', { name: 'Look up' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Unmatched: NC Senate');
  });

  it('lets the voter pick a district by hand', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<AddressEntry onSubmit={onSubmit} />);
    await user.click(screen.getByRole('button', { name: 'Pick my area by hand' }));
    await user.click(screen.getByLabelText('No'));
    await user.click(screen.getByRole('button', { name: /NC-8/ }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        district: 'NC-8',
        isCharlotte: false,
        lookupSource: 'manual',
      })
    );
  });

  it('fills a suggestion, then shows sources', async () => {
    const user = userEvent.setup();
    suggestAddresses.mockResolvedValue([
      { label: '100 MAIN ST, 28202', query: '100 MAIN ST, 28202' },
    ]);
    lookupFromAddress.mockResolvedValue({ location: charlotteLocation, unmatched: [] });
    render(<AddressEntry onSubmit={vi.fn()} />);

    await user.type(screen.getByLabelText(/Street address and ZIP/), '100 MAIN');
    const option = await screen.findByRole('option', { name: '100 MAIN ST, 28202' });
    await user.click(option);
    await screen.findByRole('heading', { name: 'Your districts' });
    expect(lookupFromAddress).toHaveBeenCalledWith('100 MAIN ST, 28202');

    await user.click(screen.getByRole('button', { name: 'Change' }));
    await user.click(screen.getByRole('button', { name: 'Back' }));
    await user.click(screen.getByRole('button', { name: 'Sources' }));
    expect(screen.getByRole('heading', { name: 'About & sources' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'NCSBE Voter Search' })).toHaveAttribute(
      'href',
      'https://vt.ncsbe.gov/reglkup/'
    );
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('heading', { name: 'Find your ballot' })).toBeInTheDocument();
  });

  it('moves the active suggestion with the keyboard', async () => {
    const user = userEvent.setup();
    suggestAddresses.mockResolvedValue([
      { label: '100 MAIN ST, 28202', query: '100 MAIN ST, 28202' },
      { label: '101 MAIN ST, 28202', query: '101 MAIN ST, 28202' },
    ]);
    lookupFromAddress.mockResolvedValue({ location: charlotteLocation, unmatched: [] });
    render(<AddressEntry onSubmit={vi.fn()} />);
    const input = screen.getByLabelText(/Street address and ZIP/);
    await user.type(input, '100 MAIN');
    await screen.findAllByRole('option');
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowUp}{Enter}');
    await screen.findByRole('heading', { name: 'Your districts' });
    expect(lookupFromAddress).toHaveBeenCalledWith('100 MAIN ST, 28202');
  });

  it('hides suggestions when the on-device lookup fails', async () => {
    const user = userEvent.setup();
    suggestAddresses.mockRejectedValue(new Error('pack missing'));
    render(<AddressEntry onSubmit={vi.fn()} />);
    await user.type(screen.getByLabelText(/Street address and ZIP/), '100 MAIN');
    await waitFor(() => expect(screen.queryByRole('option')).not.toBeInTheDocument());
  });
});
