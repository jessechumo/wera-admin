import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { me, stubApi, user } from '../test/fixtures';
import { jsonResponse, renderAdmin, jsonBody } from '../test/render';

describe('UsersPage', () => {
  it('searches and filters accounts', async () => {
    stubApi({
      'GET /api/admin/users': () => ({ users: [user(), user({ id: 3, email: 'bob@example.com', name: 'Bob', has_profile: false, month_spend_usd: 11 })] }),
    });
    renderAdmin('/users');
    expect(await screen.findByText('Ada')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /No profile/ }));
    expect(screen.queryByText('Ada')).toBeNull();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /^All/ }));
    await userEvent.type(screen.getByLabelText('Search users'), 'ada@');
    expect(screen.queryByText('Bob')).toBeNull();
  });

  it('changes a budget and the admin role', async () => {
    let patched: Record<string, unknown> = {};
    stubApi({
      'PATCH /api/admin/users/2': (init) => {
        patched = jsonBody(init);
        return user({ monthly_budget_usd: 25, is_admin: true });
      },
    });
    renderAdmin('/users');
    await userEvent.click(await screen.findByText('Ada'));
    const dialog = await screen.findByRole('dialog');
    const budget = within(dialog).getByLabelText(/Monthly AI budget/);
    await userEvent.clear(budget);
    await userEvent.type(budget, '25');
    await userEvent.click(within(dialog).getByLabelText(/Admin: can use this console/));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(patched).toEqual({ name: 'Ada', monthly_budget_usd: 25, is_admin: true }));
    expect(await screen.findByText('Saved.')).toBeInTheDocument();
  });

  it('refuses a budget out of range before sending it', async () => {
    stubApi();
    renderAdmin('/users');
    await userEvent.click(await screen.findByText('Ada'));
    const dialog = await screen.findByRole('dialog');
    const budget = within(dialog).getByLabelText(/Monthly AI budget/);
    await userEvent.clear(budget);
    await userEvent.type(budget, '5000');
    expect(within(dialog).getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });

  it('signs an account out everywhere and deletes it after the email is typed', async () => {
    let deleted = '';
    stubApi({
      'POST /api/admin/users/2/sign-out': () => ({ ended: 3 }),
      'DELETE /api/admin/users/2': (init) => ((deleted = jsonBody<{ confirm_email: string }>(init).confirm_email), undefined),
    });
    renderAdmin('/users');
    await userEvent.click(await screen.findByText('Ada'));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: /Sign out everywhere/ }));
    expect(await screen.findByText('Ended 3 sessions and extension connections.')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: /Delete account/ }));
    const confirm = within(dialog).getByRole('button', { name: /Delete ada@example.com/ });
    expect(confirm).toBeDisabled();
    await userEvent.type(within(dialog).getByLabelText('Type the email to confirm'), 'ada@example.com');
    await userEvent.click(confirm);
    await waitFor(() => expect(deleted).toBe('ada@example.com'));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('does not offer to remove your own role or delete yourself', async () => {
    stubApi({ 'GET /api/admin/users/1': () => user({ id: 1, email: me.email, name: 'Jesse', is_admin: true }) });
    renderAdmin('/users');
    await userEvent.click(within(await screen.findByRole('table')).getByText('Jesse'));
    const dialog = await screen.findByRole('dialog');
    expect(await within(dialog).findByLabelText(/Admin: can use this console/)).toBeDisabled();
    expect(within(dialog).queryByRole('button', { name: /Delete account/ })).toBeNull();
  });

  it('shows why a save failed', async () => {
    stubApi({ 'PATCH /api/admin/users/2': () => jsonResponse(400, { error: 'the name is too long' }) });
    renderAdmin('/users');
    await userEvent.click(await screen.findByText('Ada'));
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText('Name'), 'x');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('the name is too long')).toBeInTheDocument();
  });
});
