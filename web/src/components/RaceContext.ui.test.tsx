import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { candidate, charlotteLocation } from '../test/fixtures';
import RaceContext from './RaceContext';

describe('RaceContext', () => {
  it('renders nothing when the office is not on the ballot', () => {
    const { container } = render(<RaceContext office="Unknown Office" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('uses the candidate or location district for U.S. House and commission seats', () => {
    const { rerender } = render(
      <RaceContext office="U.S. House NC-14" location={charlotteLocation} compact />
    );
    expect(screen.getByText(/Now: Tim Moore/)).toBeInTheDocument();

    rerender(
      <RaceContext
        office="Mecklenburg Commission District 2"
        candidate={candidate({ office: 'Mecklenburg Commission District 2', district: '2' })}
      />
    );
    expect(screen.getByText(/Now: Vilma D. Leake/)).toBeInTheDocument();
  });
});
