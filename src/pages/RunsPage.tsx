import { Fragment, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import { useRuns } from '../api/admin';
import { errorMessage } from '../api/client';
import { NewJobsChart } from '../components/Charts';
import { Card, PageHeader, Th } from '../components/Page';
import { RunNowButton } from '../components/RunNowButton';
import { RunStatus } from '../components/RunStatus';
import { EmptyState, ErrorState, Skeleton } from '../components/States';
import { money, relTime, runDuration } from '../lib/format';

/** Pipeline runs: what each fetched, scored and cost, and why one failed. */
export default function RunsPage() {
  const runs = useRuns(50);
  const [open, setOpen] = useState<number | null>(null);
  const list = runs.data?.runs ?? [];
  // Oldest first for the chart, one bar per run.
  const perRun = [...list].reverse().map((r) => ({ day: r.started_at, count: r.jobs_new }));
  return (
    <div className="space-y-4">
      <PageHeader title="Runs" hint="Each run fetches every company, filters new jobs for every user, and scores the ones that pass." actions={<RunNowButton />} />
      {runs.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : runs.isLoadingError ? (
        <ErrorState message={errorMessage(runs.error)} onRetry={() => void runs.refetch()} />
      ) : !list.length ? (
        <EmptyState title="No runs yet" hint="Start one with Run now, or wait for the schedule." />
      ) : (
        <>
          <Card title="New jobs per run"><NewJobsChart data={perRun} /></Card>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-xs">
                <thead className="border-b border-border">
                  <tr><Th>Started</Th><Th>Duration</Th><Th>Status</Th><Th>Companies ok/failed</Th><Th>Seen</Th><Th>New</Th><Th>Excluded</Th><Th>Scored</Th><Th>Cost</Th><Th /></tr>
                </thead>
                <tbody className="font-mono">
                  {list.map((r) => (
                    <Fragment key={r.id}>
                      <tr className={clsx('border-b border-border/50', r.error && 'cursor-pointer hover:bg-surface-2/50')} onClick={() => r.error && setOpen(open === r.id ? null : r.id)}>
                        <td className="py-2 pr-3 text-muted" title={r.started_at}>{relTime(r.started_at)}</td>
                        <td className="py-2 pr-3 text-muted">{runDuration(r.started_at, r.finished_at)}</td>
                        <td className="py-2 pr-3"><RunStatus status={r.status} /></td>
                        <td className="py-2 pr-3"><span className="text-good">{r.companies_ok}</span><span className="text-faint">/</span><span className={r.companies_failed ? 'text-bad' : 'text-faint'}>{r.companies_failed}</span></td>
                        <td className="py-2 pr-3 text-muted">{r.jobs_seen.toLocaleString()}</td>
                        <td className="py-2 pr-3 text-text">{r.jobs_new.toLocaleString()}</td>
                        <td className="py-2 pr-3 text-faint">{r.jobs_excluded.toLocaleString()}</td>
                        <td className="py-2 pr-3 text-text">{r.jobs_scored.toLocaleString()}</td>
                        <td className="py-2 pr-3 text-muted">{money(r.cost_usd)}</td>
                        <td className="py-2 pr-1">{r.error && <ChevronDown aria-label="Show the error" className={clsx('size-3.5 text-faint transition-transform', open === r.id && 'rotate-180')} />}</td>
                      </tr>
                      {open === r.id && r.error && (
                        <tr><td colSpan={10} className="bg-bad/5 px-3 py-2 font-mono text-[11px] whitespace-pre-wrap text-bad">{r.error}</td></tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
