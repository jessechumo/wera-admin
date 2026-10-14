import { useState, type FormEvent } from 'react';
import { LoaderCircle, LogOut, Trash2 } from 'lucide-react';
import { useDeleteUser, useSignOutUser, useUpdateUser, useUser } from '../api/admin';
import { useMe } from '../api/auth';
import { errorMessage } from '../api/client';
import type { AdminUser } from '../api/types';
import { Badge } from '../components/Badge';
import { Field } from '../components/Field';
import { Modal } from '../components/Modal';
import { BUTTON, BUTTON_DANGER, BUTTON_PRIMARY } from '../components/Page';
import { Skeleton } from '../components/States';
import { absTime, money, relTime } from '../lib/format';
import { INPUT_CLS } from '../lib/styles';
import { toast } from '../lib/toast';

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] text-faint">{label}</dt>
      <dd className="font-mono text-sm text-text">{value}</dd>
    </div>
  );
}

function EditForm({ user, self }: { user: AdminUser; self: boolean }) {
  const update = useUpdateUser(user.id);
  const [name, setName] = useState(user.name);
  const [budget, setBudget] = useState(String(user.monthly_budget_usd));
  const [admin, setAdmin] = useState(user.is_admin);
  const budgetNum = Number(budget);
  const budgetOk = budget.trim() !== '' && Number.isFinite(budgetNum) && budgetNum >= 0 && budgetNum <= 1000;
  const dirty = name !== user.name || budgetNum !== user.monthly_budget_usd || admin !== user.is_admin;
  const save = (e: FormEvent) => {
    e.preventDefault();
    update.mutate(
      { name, monthly_budget_usd: budgetNum, is_admin: admin },
      { onSuccess: () => toast.success('Saved.'), onError: (err) => toast.error(errorMessage(err, 'Could not save')) },
    );
  };
  return (
    <form onSubmit={save} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name"><input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className={INPUT_CLS} /></Field>
        <Field label="Monthly AI budget (USD)" hint="Scoring and AI drafts stop for this user once it is spent.">
          <input type="number" min={0} max={1000} step="0.5" value={budget} onChange={(e) => setBudget(e.target.value)} className={INPUT_CLS} aria-invalid={!budgetOk} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={admin} disabled={self} onChange={(e) => setAdmin(e.target.checked)} className="accent-accent" />
        Admin: can use this console
        {self && <span className="text-xs text-faint">(you cannot remove your own role)</span>}
      </label>
      <button type="submit" disabled={!dirty || !budgetOk || update.isPending} className={BUTTON_PRIMARY}>
        {update.isPending && <LoaderCircle className="size-3.5 animate-spin" />} Save changes
      </button>
    </form>
  );
}

function DangerZone({ user, onDeleted }: { user: AdminUser; onDeleted: () => void }) {
  const signOut = useSignOutUser(user.id);
  const del = useDeleteUser(user.id);
  const [confirm, setConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  return (
    <div className="space-y-3 rounded-lg border border-bad/30 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={BUTTON} disabled={signOut.isPending}
          onClick={() => signOut.mutate(undefined, {
            onSuccess: (r) => toast.success(`Ended ${r.ended} session${r.ended === 1 ? '' : 's'} and extension connection${r.ended === 1 ? '' : 's'}.`),
            onError: (e) => toast.error(errorMessage(e, 'Could not sign out')),
          })}>
          <LogOut className="size-3.5" /> Sign out everywhere
        </button>
        <button type="button" className={BUTTON_DANGER} onClick={() => setDeleting((d) => !d)}>
          <Trash2 className="size-3.5" /> Delete account
        </button>
      </div>
      {deleting && (
        <form className="space-y-2" onSubmit={(e) => {
          e.preventDefault();
          del.mutate(confirm, {
            onSuccess: () => { toast.success(`Deleted ${user.email}.`); onDeleted(); },
            onError: (err) => toast.error(errorMessage(err, 'Could not delete')),
          });
        }}>
          <p className="text-xs text-text">
            This deletes {user.email}'s profile, matches, tracker, resumes and letters for good. Jobs they added stay for everyone else.
            Type the email to confirm.
          </p>
          <input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={user.email} aria-label="Type the email to confirm" className={INPUT_CLS} />
          <button type="submit" disabled={confirm.trim().toLowerCase() !== user.email.toLowerCase() || del.isPending} className={BUTTON_DANGER}>
            {del.isPending && <LoaderCircle className="size-3.5 animate-spin" />} Delete {user.email}
          </button>
        </form>
      )}
    </div>
  );
}

/** One account: what it uses, and an admin's controls for it. */
export function UserPanel({ id, onClose }: { id: number; onClose: () => void }) {
  const q = useUser(id);
  const me = useMe().data;
  const u = q.data;
  const self = me?.id === id;
  return (
    <Modal title={u ? u.name || u.email : 'Account'} hint={u?.name ? u.email : undefined} onClose={onClose}>
      {!u ? (
        q.error ? <p className="text-sm text-bad">{errorMessage(q.error)}</p> : <Skeleton className="h-64 w-full" />
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-1.5">
            {u.is_admin && <Badge variant="accent">admin</Badge>}
            <Badge variant={u.email_verified ? 'good' : 'neutral'}>{u.email_verified ? 'email confirmed' : 'email not confirmed'}</Badge>
            <Badge variant={u.has_profile ? 'good' : 'warn'}>{u.has_profile ? 'profile ready' : 'no profile'}</Badge>
            {u.extensions > 0 && <Badge variant="accent-2">extension connected</Badge>}
          </div>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Fact label="Joined" value={<span title={absTime(u.created_at)}>{relTime(u.created_at)}</span>} />
            <Fact label="Last sign-in" value={u.last_login_at ? <span title={absTime(u.last_login_at)}>{relTime(u.last_login_at)}</span> : 'never'} />
            <Fact label="Spend this month" value={`${money(u.month_spend_usd)} / ${money(u.monthly_budget_usd)}`} />
            <Fact label="Active sessions" value={u.sessions} />
            <Fact label="Matches" value={u.matches.toLocaleString()} />
            <Fact label="Scored" value={u.scored.toLocaleString()} />
            <Fact label="Tracked / applied" value={`${u.tracked} / ${u.applied}`} />
            <Fact label="Jobs added" value={u.jobs_added} />
          </dl>
          <EditForm key={`${u.id}-${u.monthly_budget_usd}-${u.is_admin}-${u.name}`} user={u} self={self} />
          {!self && <DangerZone user={u} onDeleted={onClose} />}
        </div>
      )}
    </Modal>
  );
}
