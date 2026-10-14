import { useUsage } from '../api/admin';
import { errorMessage } from '../api/client';
import { CostChart, TokensChart } from '../components/Charts';
import { Card, PageHeader, Th } from '../components/Page';
import { ErrorState, Skeleton } from '../components/States';
import { StatTile } from '../components/StatTile';
import { compact, money, pct } from '../lib/format';

/** What the AI costs: per day, in total, and per user this month. */
export default function UsagePage() {
  const usage = useUsage();
  const t = usage.data?.totals;
  const perDay = usage.data?.per_day ?? [];
  const users = [...(usage.data?.users ?? [])].sort((a, b) => b.month_spend_usd - a.month_spend_usd);
  const spark = perDay.map((d) => d.cost_usd);
  return (
    <div className="space-y-4">
      <PageHeader title="AI usage" hint="Tokens and cost of scoring, letters, resumes and drafts. Cached input is billed at a fraction of the price." />
      {usage.error ? (
        <ErrorState message={errorMessage(usage.error)} onRetry={() => void usage.refetch()} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatTile label="Cost" value={money(t?.cost_usd)} spark={spark} />
            <StatTile label="AI calls" value={t ? compact(t.analyses) : '—'} />
            <StatTile label="Tokens in / out" value={t ? `${compact(t.prompt_tokens)} / ${compact(t.completion_tokens)}` : '—'} />
            <StatTile label="Cache hit" value={pct(t?.cached_percent)} />
          </div>
          <div className="grid gap-3 xl:grid-cols-2">
            <Card title="Cost per day">{usage.isLoading ? <Skeleton className="h-56 w-full" /> : <CostChart data={perDay} />}</Card>
            <Card title="Tokens per day">{usage.isLoading ? <Skeleton className="h-56 w-full" /> : <TokensChart data={perDay} />}</Card>
          </div>
          <Card title="Spend by user this month">
            <table className="w-full text-xs">
              <thead className="border-b border-border"><tr><Th>User</Th><Th className="text-right">Spent</Th><Th className="text-right">Budget</Th><Th className="text-right">Used</Th></tr></thead>
              <tbody className="font-mono">
                {users.map((u) => {
                  const used = u.monthly_budget_usd > 0 ? (u.month_spend_usd / u.monthly_budget_usd) * 100 : 0;
                  return (
                    <tr key={u.id} className="border-b border-border/50">
                      <td className="py-2 pr-3 font-sans text-text">{u.name || u.email}</td>
                      <td className="py-2 pr-3 text-right text-text">{money(u.month_spend_usd)}</td>
                      <td className="py-2 pr-3 text-right text-muted">{money(u.monthly_budget_usd)}</td>
                      <td className={used >= 100 ? 'py-2 pr-3 text-right text-bad' : 'py-2 pr-3 text-right text-muted'}>{pct(used, 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}
