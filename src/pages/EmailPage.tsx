import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Monitor, Send, Smartphone } from 'lucide-react';
import { useEmail, useSendTestEmail } from '../api/admin';
import { errorMessage } from '../api/client';
import { Card, PageHeader } from '../components/Page';
import { ErrorState } from '../components/States';
import { relTime } from '../lib/format';
import { toast } from '../lib/toast';

const LABEL: Record<string, string> = {
  verify: 'Confirm email', reset: 'Password reset', welcome: 'Welcome', digest: 'Daily digest', match: 'Strong match', test: 'Setup test',
};
const STATUS: Record<string, string> = { sent: 'text-good', failed: 'text-bad', queued: 'text-warn', sending: 'text-accent' };

function TestForm() {
  const test = useSendTestEmail();
  const [to, setTo] = useState('');
  return (
    <form className="flex items-center gap-1.5" onSubmit={(e) => {
      e.preventDefault();
      test.mutate(to, {
        onSuccess: (r) => toast.success(`Test queued to ${r.queued_to}.`),
        onError: (err) => toast.error(errorMessage(err, 'Could not send')),
      });
    }}>
      <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="you (or another address)" aria-label="Test recipient"
        className="w-56 rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-xs" />
      <button type="submit" disabled={test.isPending} className="inline-flex items-center gap-1 rounded-lg bg-accent px-2.5 py-1.5 text-xs font-semibold text-bg disabled:opacity-60">
        <Send className="size-3" /> Send test
      </button>
    </form>
  );
}

function Preview({ templates }: { templates: string[] }) {
  const [name, setName] = useState(templates[0] ?? 'verify');
  const [width, setWidth] = useState<'desktop' | 'phone'>('desktop');
  const [format, setFormat] = useState<'html' | 'text'>('html');
  const [text, setText] = useState('');
  useEffect(() => {
    if (format !== 'text') return;
    let live = true;
    fetch(`/api/admin/email/preview/${name}?format=text`, { credentials: 'same-origin' })
      .then((r) => r.text())
      .then((t) => live && setText(t))
      .catch(() => live && setText('Could not load the text version.'));
    return () => { live = false; };
  }, [name, format]);
  return (
    <Card title="Templates">
      <div className="flex flex-wrap items-center gap-1.5">
        {templates.map((t) => (
          <button key={t} type="button" onClick={() => setName(t)} aria-pressed={name === t}
            className={clsx('rounded-full border px-2.5 py-1 text-xs font-medium', name === t ? 'border-accent/50 bg-accent/10 text-accent' : 'border-border text-muted hover:text-text')}>
            {LABEL[t] ?? t}
          </button>
        ))}
        <span className="ml-auto flex items-center gap-1">
          {(['html', 'text'] as const).map((f) => (
            <button key={f} type="button" onClick={() => setFormat(f)} aria-pressed={format === f}
              className={clsx('rounded-md px-2 py-1 text-[11px] font-medium', format === f ? 'bg-surface-2 text-text' : 'text-muted')}>{f === 'html' ? 'HTML' : 'Text'}</button>
          ))}
          <button type="button" onClick={() => setWidth('desktop')} aria-label="Desktop width" className={clsx('rounded-md p-1', width === 'desktop' ? 'text-accent' : 'text-faint')}><Monitor className="size-4" /></button>
          <button type="button" onClick={() => setWidth('phone')} aria-label="Phone width" className={clsx('rounded-md p-1', width === 'phone' ? 'text-accent' : 'text-faint')}><Smartphone className="size-4" /></button>
        </span>
      </div>
      <div className="mt-3 flex justify-center overflow-hidden rounded-lg border border-border bg-[#f4f2ee]">
        {format === 'html' ? (
          // Sandboxed: the email cannot run scripts or reach the console.
          <iframe key={name} title={`${LABEL[name] ?? name} email preview`} src={`/api/admin/email/preview/${name}`} sandbox=""
            className={clsx('h-[640px] border-0 bg-white transition-[width] duration-200', width === 'phone' ? 'w-[390px]' : 'w-full')} />
        ) : (
          <pre className="h-[640px] w-full overflow-auto bg-surface p-4 font-mono text-xs whitespace-pre-wrap text-text">{text}</pre>
        )}
      </div>
      <p className="mt-2 text-[11px] text-faint">The digest preview uses your own matches from the last week when there are any.</p>
    </Card>
  );
}

/** Email: whether it is on, every template, and what went out. */
export default function EmailPage() {
  const q = useEmail();
  const cfg = q.data?.config;
  return (
    <div className="space-y-4">
      <PageHeader title="Email" hint="Sign-up confirmations, password resets, welcome mail and match digests."
        actions={cfg?.enabled && <TestForm />} />
      {q.isLoadingError ? (
        <ErrorState message={errorMessage(q.error)} onRetry={() => void q.refetch()} />
      ) : (
        <>
          {cfg && (
            <p className={clsx('inline-block rounded-full px-2.5 py-1 text-xs font-medium', cfg.enabled ? 'bg-good/10 text-good' : 'bg-surface-2 text-muted')}>
              {cfg.enabled ? `On · ${cfg.provider} · from ${cfg.from} · links to ${cfg.public_url}` : 'Off: set MAIL_PROVIDER on the API to turn it on'}
            </p>
          )}
          {q.data && <Preview templates={q.data.templates} />}
          <Card title="Outbox (latest 50)">
            {!q.data?.outbox.length ? (
              <p className="text-xs text-faint">Nothing sent yet.</p>
            ) : (
              <ul className="divide-y divide-border text-xs">
                {q.data.outbox.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 py-1.5">
                    <span className={clsx('w-14 font-medium', STATUS[m.status])}>{m.status}</span>
                    <span className="w-28 truncate text-muted">{LABEL[m.tag] ?? m.tag}</span>
                    <span className="min-w-0 flex-1 truncate" title={m.last_error ?? m.subject}>{m.to} · {m.subject}</span>
                    {m.status === 'failed' && m.last_error && <span className="max-w-xs truncate text-bad" title={m.last_error}>{m.last_error}</span>}
                    <span className="text-faint">{relTime(m.sent_at ?? m.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
