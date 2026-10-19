import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { me, stubApi } from '../test/fixtures';
import { jsonResponse, renderAdmin, jsonBody } from '../test/render';

describe('Gate', () => {
  it('signs an admin in and opens the overview', async () => {
    let signedIn = false;
    let sent: Record<string, string> = {};
    stubApi({
      'GET /api/auth/me': () => (signedIn ? { user: me } : jsonResponse(401, { error: 'not signed in' })),
      'POST /api/auth/login': (init) => {
        sent = jsonBody(init);
        signedIn = true;
        return { user: me };
      },
    });
    renderAdmin();
    await userEvent.type(await screen.findByLabelText('Email'), 'jesse@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'correct horse');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Nothing right now.')).toBeInTheDocument();
    expect(sent).toEqual({ email: 'jesse@example.com', password: 'correct horse' });
  });

  it('shows the server error for a wrong password', async () => {
    stubApi({
      'GET /api/auth/me': () => jsonResponse(401, { error: 'not signed in' }),
      'POST /api/auth/login': () => jsonResponse(401, { error: 'wrong email or password' }),
    });
    renderAdmin();
    await userEvent.type(await screen.findByLabelText('Email'), 'jesse@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'nope nope nope');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('wrong email or password');
  });

  it('turns away an account that is not an admin', async () => {
    let out = false;
    stubApi({
      'GET /api/auth/me': () => (out ? jsonResponse(401, {}) : { user: { ...me, is_admin: false } }),
      'POST /api/auth/logout': () => ((out = true), undefined),
    });
    renderAdmin();
    expect(await screen.findByText('This account is not an admin')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('returns to sign-in when the session ends mid-use', async () => {
    let expired = false;
    stubApi({
      'GET /api/admin/users': () => (expired ? jsonResponse(401, { error: 'session expired' }) : { users: [] }),
    });
    const { client } = renderAdmin('/users');
    expect(await screen.findByRole('heading', { name: 'Users' })).toBeInTheDocument();
    expired = true;
    await client.invalidateQueries({ queryKey: ['users'] });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument());
  });
});
