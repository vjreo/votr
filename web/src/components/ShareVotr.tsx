import { useState } from 'react';
import { SHARE_TEXT, SHARE_TITLE, SITE_URL } from '../site';

export default function ShareVotr({ className = '' }: { className?: string }) {
  const [status, setStatus] = useState('');

  const share = async () => {
    setStatus('');
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: SHARE_TITLE, text: SHARE_TEXT, url: SITE_URL });
        setStatus('Shared.');
        return;
      }
    } catch (err) {
      if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'AbortError') {
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(SITE_URL);
      setStatus('Link copied.');
    } catch {
      setStatus(SITE_URL);
    }
  };

  return (
    <div className={`share ${className}`.trim()}>
      <button type="button" className="share__btn" onClick={share}>
        Share VOTR with a friend.
      </button>
      {status && (
        <p className="share__status" role="status">{status}</p>
      )}
      <style>{`
        .share {
          text-align: center;
        }
        .share__btn {
          min-height: var(--tap-target-min);
          font-size: var(--text-sm);
          font-weight: 500;
          color: var(--color-accent);
          padding: var(--space-2) var(--space-3);
        }
        .share__btn:hover {
          text-decoration: underline;
        }
        .share__status {
          margin: var(--space-2) 0 0;
          font-size: var(--text-xs);
          color: var(--color-text-tertiary);
        }
      `}</style>
    </div>
  );
}
