import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NO_PUBLIC_POSITIONS_NOTE } from '../data/ballot';
import { candidate, charlotteLocation } from '../test/fixtures';
import CandidateDetail from './CandidateDetail';

const complete = candidate({
  id: 'ada',
  name: 'Ada Lovelace',
  party: 'Unaffiliated',
  office: 'U.S. House NC-12',
  bio: 'Incumbent software pioneer.',
  dataStatus: 'complete',
  positions: [
    {
      issueName: 'Economy',
      issueId: 'economy',
      stance: 'She says public ledgers should be auditable.',
      source: 'https://example.org/economy',
    },
  ],
  sources: [{ url: 'https://example.org/site', source_type: 'official_website', title: 'Campaign site' }],
});

describe('CandidateDetail', () => {
  it('renders the same sections and https sources for a complete record', async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    const onBack = vi.fn();
    render(
      <CandidateDetail
        candidate={complete}
        location={charlotteLocation}
        onBack={onBack}
        onPick={onPick}
      />
    );

    expect(screen.getByRole('heading', { name: 'Ada Lovelace' })).toBeInTheDocument();
    expect(screen.getByText('Unaffiliated')).toBeInTheDocument();
    expect(screen.getByText('On the Issues')).toBeInTheDocument();
    const source = screen.getByRole('link', { name: 'View source →' });
    expect(source).toHaveAttribute('href', 'https://example.org/economy');
    expect(source).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByRole('link', { name: 'Campaign site' })).toHaveAttribute(
      'href',
      'https://example.org/site'
    );

    await user.click(screen.getByRole('button', { name: /Likely voting for/ }));
    expect(onPick).toHaveBeenCalledWith('likely');
    await user.click(screen.getByRole('button', { name: 'Go back to ballot' }));
    expect(onBack).toHaveBeenCalled();
  });

  it('toggles a selected pick off and shows the uniform empty note', async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    const incomplete = candidate({
      name: 'No Data',
      dataStatus: 'incomplete',
      dataStatusNote: NO_PUBLIC_POSITIONS_NOTE,
    });
    render(
      <CandidateDetail
        candidate={incomplete}
        pick={{ candidateId: incomplete.id, leaning: 'considering', timestamp: 1 }}
        onBack={vi.fn()}
        onPick={onPick}
      />
    );
    expect(screen.getByText('No sourced positions')).toBeInTheDocument();
    expect(screen.getByText(NO_PUBLIC_POSITIONS_NOTE)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Still considering/ }));
    expect(onPick).toHaveBeenCalledWith(null);
    await user.click(screen.getByRole('button', { name: /Probably not/ }));
    expect(onPick).toHaveBeenCalledWith('unlikely');
  });

  it('keeps the incomplete notice when some positions exist', () => {
    render(
      <CandidateDetail
        candidate={candidate({
          dataStatus: 'incomplete',
          dataStatusNote: 'Still gathering.',
          positions: [
            { issueName: 'Housing', issueId: 'housing', stance: 'A sourced stance.', source: 'https://example.org' },
          ],
        })}
        onBack={vi.fn()}
        onPick={vi.fn()}
      />
    );
    expect(screen.getByText('Still gathering.')).toBeInTheDocument();
  });
});
