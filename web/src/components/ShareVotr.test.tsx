import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SITE_URL } from '../site';
import ShareVotr from './ShareVotr';

describe('ShareVotr', () => {
  it('uses the Web Share API when it is available', async () => {
    const user = userEvent.setup();
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });
    render(<ShareVotr />);
    await user.click(screen.getByRole('button', { name: /Share VOTR/ }));
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ url: SITE_URL }));
    expect(await screen.findByRole('status')).toHaveTextContent('Shared.');
  });

  it('ignores a share abort and copies the link otherwise', async () => {
    const user = userEvent.setup();
    const abort = Object.assign(new Error('nope'), { name: 'AbortError' });
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: vi.fn().mockRejectedValue(abort),
    });
    render(<ShareVotr />);
    await user.click(screen.getByRole('button', { name: /Share VOTR/ }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('copies the link when share fails for a reason other than abort', async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: vi.fn().mockRejectedValue(new Error('share failed')),
    });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    render(<ShareVotr />);
    await user.click(screen.getByRole('button', { name: /Share VOTR/ }));
    expect(await screen.findByRole('status')).toHaveTextContent('Link copied.');
  });

  it('falls back to clipboard, then to showing the URL', async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    const { unmount } = render(<ShareVotr />);
    await user.click(screen.getByRole('button', { name: /Share VOTR/ }));
    expect(writeText).toHaveBeenCalledWith(SITE_URL);
    expect(await screen.findByRole('status')).toHaveTextContent('Link copied.');
    unmount();

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('blocked')) },
    });
    render(<ShareVotr />);
    await user.click(screen.getByRole('button', { name: /Share VOTR/ }));
    expect(await screen.findByRole('status')).toHaveTextContent(SITE_URL);
  });
});
