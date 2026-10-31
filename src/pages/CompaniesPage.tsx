import { useState } from 'react';
import { Search } from 'lucide-react';
import clsx from 'clsx';
import { useCompanies } from '../api/admin';
import { errorMessage } from '../api/client';
import { Badge } from '../components/Badge';
import { Card, PageHeader, Th } from '../components/Page';
import { ErrorState, Skeleton } from '../components/States';
import { relTime } from '../lib/format';

const PAGE = 100;

/** Every watched company and how its last fetch went, failures first. */
export default function CompaniesPage() {
  const companies = useCompanies();
  const [q, setQ] = useState('');
  const [failingOnly, setFailingOnly] = useState(false);
  const [shown, setShown] = useState(PAGE);
  const all = companies.data?.companies ?? [];
  const failing = all.filter((c) => c.enabled && c.last_fetch_ok === false);
  const needle = q.trim().toLowerCase();
  const rows = (failingOnly ? failing : all)
    .filter((c) => !needle || c.name.toLowerCase().includes(needle) || c.ats.includes(needle) || c.industry.includes(needle))
    .sort((a, b) => Number(b.last_fetch_ok === false) - Number(a.last_fetch_ok === false) || b.jobs_open - a.jobs_open);

  return (
    <div className="space-y-4">
      <PageHeader title="Companies" hint={`${all.length.toLocaleString()} companies from config/companies.yaml; ${failing.length} failed their last fetch. The list itself is edited in the API repository.`} />
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-60 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setShown(PAGE); }} placeholder="Search name, job board or industry" aria-label="Search companies"
            className="w-full rounded-lg border border-border bg-surface py-2 pr-3 pl-9 text-sm placeholder:text-faint focus:border-accent/60 focus:outline-none" />
        </label>
        <label className="flex items-center gap-2 text-xs text-muted">
          <input type="checkbox" checked={failingOnly} onChange={(e) => { setFailingOnly(e.target.checked); setShown(PAGE); }} className="accent-accent" />
          Only failing ({failing.length})
        </label>
      </div>
      {companies.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : companies.isLoadingError ? (
        <ErrorState message={errorMessage(companies.error)} onRetry={() => void companies.refetch()} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-xs">
              <thead className="border-b border-border"><tr><Th>Name</Th><Th>Job board</Th><Th>Industry</Th><Th>Watched</Th><Th>Last fetch</Th><Th>Open jobs</Th></tr></thead>
              <tbody>
                {rows.slice(0, shown).map((c) => (
                  <tr key={c.id} className="border-b border-border/50">
                    <td className="py-2 pr-3 font-medium text-text">{c.name}</td>
                    <td className="py-2 pr-3 font-mono text-muted">{c.ats}</td>
                    <td className="py-2 pr-3 text-muted">{c.industry}</td>
                    <td className="py-2 pr-3"><Badge variant={c.enabled ? 'good' : 'neutral'}>{c.enabled ? 'yes' : 'off'}</Badge></td>
                    <td className="py-2 pr-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={clsx('inline-block size-1.5 rounded-full', c.last_fetch_ok === true ? 'bg-good' : c.last_fetch_ok === false ? 'bg-bad' : 'bg-faint')} />
                        <span className="text-muted" title={c.last_fetch_at ?? ''}>{relTime(c.last_fetch_at)}</span>
                      </span>
                      {c.last_fetch_error && <div className="mt-0.5 max-w-md truncate text-[11px] text-bad" title={c.last_fetch_error}>{c.last_fetch_error}</div>}
                    </td>
                    <td className="py-2 pr-3 font-mono text-text">{c.jobs_open.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <p className="py-6 text-center text-xs text-faint">No companies match.</p>}
            {shown < rows.length && (
              <button onClick={() => setShown((n) => n + PAGE)} className="mt-3 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-muted hover:text-text">
                Show more ({rows.length - shown} left)
              </button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
