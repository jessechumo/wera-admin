import type { ReactNode } from 'react';
import clsx from 'clsx';
import { useDocumentTitle } from '../lib/useDocumentTitle';

/** A page's title row: heading, one-line purpose, and its actions. */
export function PageHeader({ title, hint, actions }: { title: string; hint?: ReactNode; actions?: ReactNode }) {
  useDocumentTitle(title);
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[26px] leading-tight font-semibold">{title}</h1>
        {hint && <p className="mt-1 max-w-2xl text-xs text-muted">{hint}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Card({ title, actions, className, children }: { title?: ReactNode; actions?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={clsx('rounded-card border border-border bg-surface p-4', className)}>
      {(title || actions) && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {title && <h2 className="text-sm font-semibold text-text">{title}</h2>}
          {actions && <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

/** Column headers styled the same in every table. */
export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return <th className={clsx('py-2 pr-3 text-left text-[10px] font-medium tracking-wide text-faint uppercase', className)}>{children}</th>;
}

export const BUTTON =
  'inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-text transition-colors hover:border-accent/40 disabled:opacity-50';
export const BUTTON_PRIMARY =
  'inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-bg transition-colors hover:bg-accent/85 disabled:opacity-60';
export const BUTTON_DANGER =
  'inline-flex items-center justify-center gap-1.5 rounded-lg border border-bad/40 bg-bad/10 px-3 py-1.5 text-xs font-semibold text-bad transition-colors hover:bg-bad/20 disabled:opacity-50';
