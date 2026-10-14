/** The signed-in account (GET /api/auth/me). */
export interface Me {
  id: number;
  email: string;
  name: string;
  is_admin: boolean;
  created_at: string;
}

/** GET /api/admin/overview */
export interface Overview {
  users: number;
  users_with_profile: number;
  signups_7d: number;
  active_7d: number;
  admins: number;
  companies_enabled: number;
  companies_failing: number;
  jobs_open: number;
  jobs_new_24h: number;
  jobs_added_open: number;
  pending_scores: number;
  month_spend_usd: number;
  email_queued: number;
  email_failed_7d: number;
  content_hidden: number;
  last_run_at: string | null;
  last_run_status: RunStatus | null;
}

export interface OverviewResponse {
  overview: Overview;
  monthly_cap_usd: number;
  email_enabled: boolean;
  run_trigger: boolean;
}

/** One account as admins see it. */
export interface AdminUser {
  id: number;
  email: string;
  name: string;
  is_admin: boolean;
  created_at: string;
  last_login_at: string | null;
  email_verified: boolean;
  monthly_budget_usd: number;
  month_spend_usd: number;
  has_profile: boolean;
  matches: number;
  scored: number;
  tracked: number;
  applied: number;
  sessions: number;
  extensions: number;
  jobs_added: number;
}

export interface UserChange {
  name?: string;
  is_admin?: boolean;
  monthly_budget_usd?: number;
}

/** 'ok' | 'partial' | 'failed', or null while the run is in flight. */
export type RunStatus = 'ok' | 'partial' | 'failed' | null;

export interface Run {
  id: number;
  started_at: string;
  finished_at: string | null;
  status: RunStatus;
  companies_ok: number;
  companies_failed: number;
  jobs_seen: number;
  jobs_new: number;
  jobs_excluded: number;
  jobs_scored: number;
  prompt_tokens: number;
  cached_tokens: number;
  completion_tokens: number;
  cost_usd: number;
  error: string | null;
}

export interface DayCount {
  day: string;
  count: number;
}

export interface UsageDay {
  day: string;
  prompt_tokens: number;
  cached_tokens: number;
  completion_tokens: number;
  cost_usd: number;
}

export interface UsageTotals {
  analyses: number;
  prompt_tokens: number;
  cached_tokens: number;
  completion_tokens: number;
  cost_usd: number;
  cached_percent: number;
}

export interface UserSpend {
  id: number;
  email: string;
  name: string;
  monthly_budget_usd: number;
  month_spend_usd: number;
}

export interface Usage {
  per_day: UsageDay[];
  totals: UsageTotals;
  users: UserSpend[];
}

export interface Company {
  id: number;
  name: string;
  ats: string;
  token: string;
  industry: string;
  enabled: boolean;
  last_fetch_at: string | null;
  last_fetch_ok: boolean | null;
  last_fetch_error: string | null;
  jobs_open: number;
  jobs_scored: number;
}

export type ContentKind = 'post' | 'comment';
export type ContentStatus = 'published' | 'rejected';

/** A community post or comment, whatever the moderation decided. */
export interface ContentItem {
  kind: ContentKind;
  id: number;
  post_id: number;
  title: string;
  body: string;
  status: ContentStatus;
  moderation: { allowed?: boolean; categories?: string[]; reason?: string } | null;
  author_id: number;
  author: string;
  created_at: string;
}

export interface AuditEntry {
  id: number;
  actor_id: number | null;
  actor: string;
  action: string;
  target: string;
  detail: Record<string, unknown>;
  created_at: string;
}

export interface OutboxEmail {
  id: number;
  to: string;
  tag: string;
  subject: string;
  status: 'queued' | 'sending' | 'sent' | 'failed';
  attempts: number;
  last_error: string | null;
  created_at: string;
  sent_at: string | null;
}

export interface EmailOverview {
  config: { enabled: boolean; provider?: string; from?: string; public_url?: string };
  templates: string[];
  outbox: OutboxEmail[];
}
