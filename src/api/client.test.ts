import { describe, expect, it } from 'vitest';
import { failureMessage } from './client';

describe('failureMessage', () => {
  it("keeps the API's own error", () => {
    expect(failureMessage({ status: 409, statusText: 'Conflict' }, '{"error":"you cannot remove your own admin role"}')).toBe('you cannot remove your own admin role');
  });

  it("says the server is not answering instead of showing a proxy's error page", () => {
    expect(failureMessage({ status: 530, statusText: '' }, '<!DOCTYPE html><html>Cloudflare Tunnel error</html>')).toMatch(/isn't answering \(error 530\)/);
    expect(failureMessage({ status: 502, statusText: 'Bad Gateway' }, '')).toMatch(/isn't answering \(error 502\)/);
  });

  it('keeps a short plain-text reason, and the status line otherwise', () => {
    expect(failureMessage({ status: 504, statusText: '' }, 'upstream timed out')).toBe('upstream timed out');
    expect(failureMessage({ status: 400, statusText: 'Bad Request' }, '')).toBe('400 Bad Request');
  });
});
