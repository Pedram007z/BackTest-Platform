/**
 * What the free plan includes. Shared by the web app and the API server (server/ imports it).
 *
 * On the free plan a user has one backtest session, and the journal, analytics and economic
 * calendar are locked. A paid plan whose end date has passed counts as the free plan. Admins and
 * the hosted demo account are never limited.
 */

export const FREE_PLAN_ID = 'free';
/** Sessions a free-plan user can have. */
export const FREE_SESSION_LIMIT = 1;

export type PlanFeature = 'journal' | 'analytics' | 'calendar';
export const PLAN_FEATURE_LABEL: Record<PlanFeature, string> = { journal: 'ژورنال', analytics: 'آنالیز', calendar: 'تقویم اقتصادی' };

export interface PlanHolder {
  planId?: string;
  /** Day key (YYYY-MM-DD) of the last day of the plan. */
  planEndsAt?: string;
  role?: string;
  demo?: boolean;
}

/** Whether the account is on the free plan on `today` (a day key). An account whose plan is not known yet is not limited. */
export function onFreePlan(u: PlanHolder, today: string): boolean {
  if (u.role === 'admin' || u.demo || !u.planId) return false;
  return u.planId === FREE_PLAN_ID || (!!u.planEndsAt && u.planEndsAt < today);
}

/**
 * Whether a free-plan account may end up with `after` sessions: always while no new session is added
 * (an account that had more before keeps them), otherwise up to the limit.
 */
export function freeSessionsAllowed(beforeIds: ReadonlySet<string>, after: readonly { id: string }[]): boolean {
  return after.length <= FREE_SESSION_LIMIT || after.every((s) => beforeIds.has(s.id));
}

export const FREE_SESSION_MESSAGE = `در پلن رایگان فقط ${FREE_SESSION_LIMIT === 1 ? 'یک' : FREE_SESSION_LIMIT} جلسه می‌توانید داشته باشید. برای جلسه‌های بیشتر اشتراک حرفه‌ای بگیرید.`;
export const lockedMessage = (f: PlanFeature) => `${PLAN_FEATURE_LABEL[f]} در پلن رایگان قفل است. برای استفاده از آن اشتراک حرفه‌ای بگیرید.`;
