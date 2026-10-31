import { useState } from 'react';
import { Eye, EyeOff, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { CONTENT_PAGE, useContent, useDeleteContent, useSetContentStatus, type ContentFilter } from '../api/admin';
import { errorMessage } from '../api/client';
import type { ContentItem } from '../api/types';
import { Badge } from '../components/Badge';
import { BUTTON, BUTTON_DANGER, PageHeader } from '../components/Page';
import { EmptyState, ErrorState, SkeletonRows } from '../components/States';
import { absTime, relTime } from '../lib/format';
import { toast } from '../lib/toast';

const KINDS: { id: ContentFilter['kind']; label: string }[] = [{ id: '', label: 'Posts and comments' }, { id: 'post', label: 'Posts' }, { id: 'comment', label: 'Comments' }];
const STATUSES: { id: ContentFilter['status']; label: string }[] = [{ id: '', label: 'Any status' }, { id: 'rejected', label: 'Hidden' }, { id: 'published', label: 'Published' }];

function Item({ item }: { item: ContentItem }) {
  const setStatus = useSetContentStatus();
  const del = useDeleteContent();
  const [confirming, setConfirming] = useState(false);
  const hidden = item.status === 'rejected';
  const what = item.kind === 'post' ? 'post' : 'comment';
  return (
    <li className="space-y-2 py-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge variant={item.kind === 'post' ? 'accent-2' : 'neutral'}>{item.kind}</Badge>
        <Badge variant={hidden ? 'warn' : 'good'}>{hidden ? 'hidden' : 'published'}</Badge>
        <span className="text-muted">{item.author}</span>
        <span className="text-faint" title={absTime(item.created_at)}>{relTime(item.created_at)}</span>
      </div>
      <div>
        <p className="text-sm font-semibold text-text">{item.kind === 'comment' ? `On “${item.title}”` : item.title}</p>
        <p className="mt-0.5 line-clamp-4 text-xs whitespace-pre-wrap text-muted">{item.body}</p>
      </div>
      {item.moderation?.reason && (
        <p className={clsx('rounded-md px-2 py-1 text-[11px]', hidden ? 'bg-warn/10 text-warn' : 'bg-surface-2 text-faint')}>
          AI moderation: {item.moderation.reason}
          {!!item.moderation.categories?.length && ` (${item.moderation.categories.join(', ')})`}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button className={BUTTON} disabled={setStatus.isPending}
          onClick={() => setStatus.mutate({ kind: item.kind, id: item.id, status: hidden ? 'published' : 'rejected' }, {
            onSuccess: () => toast.success(hidden ? `The ${what} is published.` : `The ${what} is hidden.`),
            onError: (e) => toast.error(errorMessage(e, 'Could not change it')),
          })}>
          {hidden ? <><Eye className="size-3.5" /> Publish</> : <><EyeOff className="size-3.5" /> Hide</>}
        </button>
        {confirming ? (
          <button className={BUTTON_DANGER} disabled={del.isPending}
            onClick={() => del.mutate({ kind: item.kind, id: item.id }, {
              onSuccess: () => toast.success(`The ${what} is deleted.`),
              onError: (e) => toast.error(errorMessage(e, 'Could not delete it')),
            })}>
            <Trash2 className="size-3.5" /> Delete for good{item.kind === 'post' && ', with its comments'}
          </button>
        ) : (
          <button className={BUTTON} onClick={() => setConfirming(true)}><Trash2 className="size-3.5" /> Delete…</button>
        )}
      </div>
    </li>
  );
}

function Pills<T extends string>({ options, value, onChange, label }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div className="flex flex-wrap gap-1" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.id || 'all'} onClick={() => onChange(o.id)} aria-pressed={value === o.id}
          className={clsx('rounded-full border px-2.5 py-1 text-xs font-medium', value === o.id ? 'border-accent/50 bg-accent/10 text-accent' : 'border-border text-muted hover:text-text')}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Community moderation: everything the AI published or hid, and overrides. */
export default function ContentPage() {
  const [filter, setFilter] = useState<ContentFilter>({ kind: '', status: 'rejected', offset: 0 });
  const q = useContent(filter);
  const items = q.data?.items ?? [];
  return (
    <div className="space-y-4">
      <PageHeader title="Community" hint="The AI moderates every post and comment as it is written. Publish what it hid by mistake, hide what it let through, or delete." />
      <div className="flex flex-wrap items-center gap-3">
        <Pills label="Status" options={STATUSES} value={filter.status} onChange={(status) => setFilter({ ...filter, status, offset: 0 })} />
        <Pills label="Kind" options={KINDS} value={filter.kind} onChange={(kind) => setFilter({ ...filter, kind, offset: 0 })} />
      </div>
      {q.isLoading ? (
        <SkeletonRows rows={4} />
      ) : q.isLoadingError ? (
        <ErrorState message={errorMessage(q.error)} onRetry={() => void q.refetch()} />
      ) : !items.length ? (
        <EmptyState title={filter.status === 'rejected' ? 'Nothing is hidden' : 'Nothing here'} hint="Posts and comments show up here as people write them." />
      ) : (
        <section className="rounded-card border border-border bg-surface px-4">
          <ul className="divide-y divide-border">{items.map((i) => <Item key={`${i.kind}-${i.id}`} item={i} />)}</ul>
        </section>
      )}
      {(filter.offset > 0 || items.length === CONTENT_PAGE) && (
        <div className="flex justify-between">
          <button className={BUTTON} disabled={filter.offset === 0} onClick={() => setFilter({ ...filter, offset: Math.max(0, filter.offset - CONTENT_PAGE) })}>Newer</button>
          <button className={BUTTON} disabled={items.length < CONTENT_PAGE} onClick={() => setFilter({ ...filter, offset: filter.offset + CONTENT_PAGE })}>Older</button>
        </div>
      )}
    </div>
  );
}
