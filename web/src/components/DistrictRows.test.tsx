import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { charlotteLocation, huntersvilleLocation } from '../test/fixtures';
import DistrictRows from './DistrictRows';

describe('DistrictRows', () => {
  it('keeps the original district scan order and expands an explainer', async () => {
    const user = userEvent.setup();
    render(<DistrictRows location={charlotteLocation} />);
    const labels = [...document.querySelectorAll('.drows__label')].map((el) => el.textContent);
    expect(labels).toEqual([
      'U.S. House',
      'NC Senate',
      'NC House',
      'County',
      'County Commission',
      'City/Town',
    ]);
    expect(screen.getByText('NC-14')).toBeInTheDocument();
    expect(screen.getByText('District 41')).toBeInTheDocument();
    expect(screen.getByText('Charlotte')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /U.S. House/ }));
    expect(screen.getByText(/Writes federal laws/)).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', expect.stringMatching(/^https:\/\//));
    await user.click(screen.getByRole('button', { name: /U.S. House/ }));
    expect(screen.queryByText(/Writes federal laws/)).not.toBeInTheDocument();
  });

  it('marks unmatched districts and names towns outside Charlotte', () => {
    render(
      <DistrictRows
        location={{
          ...huntersvilleLocation,
          ncSenate: undefined,
          ncHouse: undefined,
          commission: undefined,
          place: undefined,
        }}
      />
    );
    expect(screen.getAllByText('Not matched')).toHaveLength(3);
    expect(screen.getByText('Huntersville')).toBeInTheDocument();
  });
});
