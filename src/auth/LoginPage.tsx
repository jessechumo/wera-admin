import { useState, type FormEvent } from 'react';
import { LoaderCircle, ShieldCheck } from 'lucide-react';
import { useLogin } from '../api/auth';
import { errorOrNull } from '../api/client';
import { Field } from '../components/Field';
import { Logo } from '../components/Logo';
import { INPUT_CLS } from '../lib/styles';
import { ThemeToggle } from '../lib/theme';
import { useDocumentTitle } from '../lib/useDocumentTitle';

/** Sign in with a Wera account; only admins get past the gate. */
export function LoginPage() {
  useDocumentTitle('Sign in');
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    login.mutate({ email, password });
  };
  const error = errorOrNull(login.error);
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <ThemeToggle className="fixed top-4 right-4" />
      <form onSubmit={submit} className="anim-rise w-full max-w-sm space-y-4 rounded-card border border-border bg-surface p-6">
        <div className="space-y-2">
          <Logo />
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <ShieldCheck className="size-3.5 text-accent" /> Admin console. Sign in with your Wera account.
          </p>
        </div>
        <Field label="Email">
          <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className={INPUT_CLS} autoFocus />
        </Field>
        <Field label="Password">
          <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={INPUT_CLS} />
        </Field>
        {error && <p role="alert" className="text-xs text-bad">{error}</p>}
        <button type="submit" disabled={login.isPending}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg hover:bg-accent/85 disabled:opacity-60">
          {login.isPending && <LoaderCircle className="size-4 animate-spin" />} Sign in
        </button>
      </form>
    </main>
  );
}
