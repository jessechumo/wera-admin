import { useAudit } from '../api/admin';
import { errorMessage } from '../api/client';
import type { AuditEntry } from '../api/types';
import { BUTTON, Card, PageHeader, Th } from '../components/Page';
import { EmptyState, ErrorState, SkeletonRows } from '../components/States';
import { absTime, relTime } from '../lib/format';

const ACTION: Record<string, string> = {
  'user.update': 'Changed an account',
  'user.sign_out': 'Signed an account out everywhere',
  'user.delete': 'Deleted an account',
  'run.trigger': 'Started a pipeline run',
  'content.published': 'Published community content',
  'content.rejected': 'Hid community content',
  'content.delete': 'Deleted community content',
  'email.test': 'Sent a test email',
};

function detailText(e: AuditEntry): string {
  const d = e.detail ?? {};
  return Object.entries(d)
    .filter(([, v]) => v != null)
    .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${typeof v === 'object' ? JSON.stringify(v) : String(v as string | number | boolean)}`)
    .join(' · ');
}

/** Every change made in this console: who, what, and when. */
export default function AuditPage() {
  const q = useAudit();
  const entries = q.data?.pages.flatMap((p) => p.entries) ?? [];
  return (
    <div className="space-y-4">
      <PageHeader title="Audit log" hint="Every change made in this console is recorded here, and cannot be edited." />
      {q.isLoading ? (
        <SkeletonRows rows={5} />
      ) : q.isLoadingError ? (
        <ErrorState message={errorMessage(q.error)} onRetry={() => void q.refetch()} />
      ) : !entries.length ? (
        <EmptyState title="No admin changes yet" hint="Changes to accounts, moderation and runs will show up here." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-xs">
              <thead className="border-b border-border"><tr><Th>When</Th><Th>Admin</Th><Th>What</Th><Th>Target</Th><Th>Details</Th></tr></thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-b border-border/50 align-top">
                    <td className="py-2 pr-3 text-muted" title={absTime(e.created_at)}>{relTime(e.created_at)}</td>
                    <td className="py-2 pr-3 text-text">{e.actor}</td>
                    <td className="py-2 pr-3 text-text">{ACTION[e.action] ?? e.action}</td>
                    <td className="py-2 pr-3 font-mono text-muted">{e.target}</td>
                    <td className="py-2 pr-3 text-muted">{detailText(e)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {q.hasNextPage && (
            <button className={`${BUTTON} mt-3`} disabled={q.isFetchingNextPage} onClick={() => void q.fetchNextPage()}>
              {q.isFetchingNextPage ? 'Loading…' : 'Older'}
            </button>
          )}
        </Card>
      )}
    </div>
  );
}
