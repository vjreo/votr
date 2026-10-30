import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import JargonText from './Term';

describe('JargonText', () => {
  it('returns plain text when there is no jargon', () => {
    render(<JargonText text="Attorney in Charlotte." />);
    expect(screen.getByText('Attorney in Charlotte.')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('expands incumbent and at-large on tap', async () => {
    const user = userEvent.setup();
    render(<JargonText text="Incumbent at-large member." />);
    const incumbent = screen.getByRole('button', { name: 'Incumbent' });
    await user.click(incumbent);
    expect(screen.getByText(/currently holds this seat/)).toBeInTheDocument();
    await user.click(incumbent);
    expect(screen.queryByText(/currently holds this seat/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'at-large' }));
    expect(screen.getByText(/elected by the whole county/)).toBeInTheDocument();
  });
});
