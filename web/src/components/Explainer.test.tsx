import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OFFICES } from '../data/offices';
import Explainer from './Explainer';

describe('Explainer', () => {
  it('shows a one-liner and district holder with a period', () => {
    render(<Explainer explainer={OFFICES['us-house']} district="NC-12" />);
    expect(screen.getByText(/Writes federal laws/)).toBeInTheDocument();
    expect(screen.getByText(/Now: Alma S. Adams\./)).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://www.house.gov/the-house-explained');
  });

  it('hides seat metadata on the county place row', () => {
    render(<Explainer explainer={OFFICES['meck-county']} />);
    expect(screen.queryByText(/Now:/)).not.toBeInTheDocument();
  });
});
