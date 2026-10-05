import { TriangleAlert } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface Props {
  children: ReactNode;
  onHome: () => void;
}

/** Shows a message instead of a blank page when a page fails to render. */
class ErrorBoundary extends Component<Props, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[page error]', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div role="alert" className="flex min-h-[100dvh] items-center justify-center bg-bg p-6">
        <div className="card flex w-full max-w-md flex-col items-center gap-3 p-6 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-loss/15 text-loss">
            <TriangleAlert size={22} />
          </span>
          <h1 className="text-lg font-bold">این صفحه باز نشد</h1>
          <p className="text-sm leading-7 text-muted">خطایی در نمایش صفحه رخ داد. اطلاعات شما سر جایش است؛ دوباره امتحان کنید یا به صفحه‌ی اصلی برگردید.</p>
          <p className="w-full overflow-x-auto rounded-lg bg-raised px-3 py-2 text-left font-mono text-[11px] text-faint" dir="ltr">
            {error.message}
          </p>
          <div className="mt-1 flex flex-wrap justify-center gap-2">
            <button type="button" className="btn-primary" onClick={() => this.setState({ error: null })}>
              تلاش دوباره
            </button>
            <button type="button" className="btn-soft" onClick={this.props.onHome}>
              صفحه‌ی اصلی
            </button>
          </div>
        </div>
      </div>
    );
  }
}

/** Error boundary that clears itself when the user moves to another page. */
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  return (
    <ErrorBoundary key={pathname} onHome={() => navigate('/')}>
      {children}
    </ErrorBoundary>
  );
}
