import { Component, type ErrorInfo, type ReactNode } from 'react';
import { clearAllData } from '../utils/storage';

interface Props {
  children: ReactNode;
}

interface State {
  failed: boolean;
}

/** Last-resort screen when a render throws. Does not send the error anywhere. */
export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  private reload = () => {
    window.location.reload();
  };

  private clearAndReload = () => {
    clearAllData();
    window.location.reload();
  };

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <main className="recover">
        <h1>This screen could not be shown</h1>
        <p>
          Reload the page. If it keeps happening, clear the data saved on this device and start again.
        </p>
        <div className="recover__actions">
          <button type="button" className="btn btn--primary" onClick={this.reload}>
            Reload
          </button>
          <button type="button" className="btn btn--secondary" onClick={this.clearAndReload}>
            Clear saved data
          </button>
        </div>
        <style>{`
          .recover {
            max-width: 32rem;
            margin: 0 auto;
            padding: var(--space-8) var(--space-5);
          }
          .recover h1 {
            font-size: var(--text-2xl);
            margin: 0 0 var(--space-3);
          }
          .recover p {
            color: var(--color-text-secondary);
            line-height: var(--leading-relaxed);
            margin: 0 0 var(--space-5);
          }
          .recover__actions {
            display: flex;
            flex-wrap: wrap;
            gap: var(--space-3);
          }
        `}</style>
      </main>
    );
  }
}
