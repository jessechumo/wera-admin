import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import clsx from 'clsx';
import { useUsers } from '../api/admin';
import { errorMessage } from '../api/client';
import type { AdminUser } from '../api/types';
import { Badge } from '../components/Badge';
import { Card, PageHeader, Th } from '../components/Page';
import { EmptyState, ErrorState, Skeleton } from '../components/States';
import { money, relTime } from '../lib/format';
import { UserPanel } from './UserPanel';

type Filter = 'all' | 'admins' | 'no-profile' | 'over-budget' | 'inactive';

const FILTERS: { id: Filter; label: string; test: (u: AdminUser) => boolean }[] = [
  { id: 'all', label: 'All', test: () => true },
  { id: 'admins', label: 'Admins', test: (u) => u.is_admin },
  { id: 'no-profile', label: 'No profile', test: (u) => !u.has_profile },
  { id: 'over-budget', label: 'Budget used up', test: (u) => u.month_spend_usd >= u.monthly_budget_usd },
  { id: 'inactive', label: 'Inactive 30 days', test: (u) => !u.last_login_at || Date.now() - new Date(u.last_login_at).getTime() > 30 * 86_400_000 },
];

function SpendBar({ u }: { u: AdminUser }) {
  const pct = u.monthly_budget_usd > 0 ? Math.min(100, (u.month_spend_usd / u.monthly_budget_usd) * 100) : 100;
  return (
    <div className="w-32">
      <div className="flex justify-between font-mono text-[11px]">
        <span className={pct >= 100 ? 'text-bad' : 'text-text'}>{money(u.month_spend_usd)}</span>
        <span className="text-faint">{money(u.monthly_budget_usd)}</span>
      </div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-2">
        <div className={clsx('h-full', pct >= 100 ? 'bg-bad' : pct >= 80 ? 'bg-warn' : 'bg-accent')} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** Every account: who uses Wera, how much, and the controls for each. */
export default function UsersPage() {
  const users = useUsers();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [open, setOpen] = useState<number | null>(null);
  const all = useMemo(() => users.data?.users ?? [], [users.data]);
  const needle = q.trim().toLowerCase();
  const test = FILTERS.find((f) => f.id === filter)!.test;
  const rows = all.filter((u) => test(u) && (!needle || u.email.toLowerCase().includes(needle) || u.name.toLowerCase().includes(needle)));

  return (
    <div className="space-y-4">
      <PageHeader title="Users" hint="Open an account to change its AI budget or admin role, sign it out everywhere, or delete it." />
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-60 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email" aria-label="Search users"
            className="w-full rounded-lg border border-border bg-surface py-2 pr-3 pl-9 text-sm placeholder:text-faint focus:border-accent/60 focus:outline-none" />
        </label>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Filter users">
          {FILTERS.map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)} aria-pressed={filter === f.id}
              className={clsx('rounded-full border px-2.5 py-1 text-xs font-medium', filter === f.id ? 'border-accent/50 bg-accent/10 text-accent' : 'border-border text-muted hover:text-text')}>
              {f.label} <span className="font-mono text-faint">{all.filter(f.test).length}</span>
            </button>
          ))}
        </div>
      </div>
      {users.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : users.isLoadingError ? (
        <ErrorState message={errorMessage(users.error)} onRetry={() => void users.refetch()} />
      ) : !rows.length ? (
        <EmptyState title="No users match" hint="Try another search or filter." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-xs">
              <thead className="border-b border-border">
                <tr><Th>User</Th><Th>Joined</Th><Th>Last sign-in</Th><Th>Profile</Th><Th>Matches</Th><Th>Applied</Th><Th>AI spend this month</Th></tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id} onClick={() => setOpen(u.id)} className="cursor-pointer border-b border-border/50 hover:bg-surface-2/50">
                    <td className="py-2 pr-3">
                      <button className="text-left" onClick={(e) => { e.stopPropagation(); setOpen(u.id); }}>
                        <span className="font-medium text-text">{u.name || u.email}</span>
                        {u.is_admin && <Badge variant="accent" className="ml-1.5">admin</Badge>}
                        {u.name && <div className="text-faint">{u.email}</div>}
                      </button>
                    </td>
                    <td className="py-2 pr-3 text-muted">{relTime(u.created_at)}</td>
                    <td className="py-2 pr-3 text-muted">{u.last_login_at ? relTime(u.last_login_at) : 'never'}</td>
                    <td className="py-2 pr-3"><Badge variant={u.has_profile ? 'good' : 'neutral'}>{u.has_profile ? 'ready' : 'none'}</Badge></td>
                    <td className="py-2 pr-3 font-mono text-text">{u.matches.toLocaleString()}</td>
                    <td className="py-2 pr-3 font-mono text-text">{u.applied}</td>
                    <td className="py-2 pr-3"><SpendBar u={u} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      {open != null && <UserPanel id={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
