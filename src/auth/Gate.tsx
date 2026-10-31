import { useEffect, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ShieldAlert } from 'lucide-react';
import { signOutLocally, useLogout, useMe } from '../api/auth';
import { UNAUTHORIZED_EVENT } from '../api/client';
import { ErrorState, Skeleton } from '../components/States';
import { LoginPage } from './LoginPage';

/**
 * Shows its children only to a signed-in admin. A session that ends (any
 * 401) returns to the sign-in page; a non-admin account is told so and can
 * sign out. The API checks every admin request on its own as well.
 */
export function Gate({ children }: { children: ReactNode }) {
  const me = useMe();
  const qc = useQueryClient();
  const logout = useLogout();
  useEffect(() => {
    const onUnauthorized = () => signOutLocally(qc);
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [qc]);

  if (me.isLoading) return <div className="p-8"><Skeleton className="h-40 w-full" /></div>;
  // A session known from before stays on screen through a failed check.
  if (me.data === undefined) return <div className="p-8"><ErrorState message="The Wera API did not answer. Retrying by itself." onRetry={() => void me.refetch()} /></div>;
  if (!me.data) return <LoginPage />;
  if (!me.data.is_admin) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-sm space-y-3 rounded-card border border-border bg-surface p-6 text-center">
          <ShieldAlert className="mx-auto size-7 text-warn" />
          <h1 className="text-base font-semibold">This account is not an admin</h1>
          <p className="text-xs text-muted">{me.data.email} can use the Wera dashboard, but not the admin console.</p>
          <button onClick={() => logout.mutate()} className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium hover:border-accent/40">
            Sign out
          </button>
        </div>
      </main>
    );
  }
  return <>{children}</>;
}
