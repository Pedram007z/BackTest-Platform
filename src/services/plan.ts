/**
 * What the free plan includes. Shared by the web app and the API server (server/ imports it).
 *
 * On the free plan a user has one backtest session, and the journal, analytics and economic
 * calendar are locked. A paid plan whose end date has passed counts as the free plan. Admins and
 * the hosted demo account are never limited.
 */

import type { Plan, PaymentKind } from './types';

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

// ---------- the automatic strategy testing add-on ----------

export const AUTOTEST_LABEL = 'تست خودکار استراتژی';
export const AUTOTEST_LOCKED_MESSAGE = 'اجرای استراتژی (تست خودکار) یک افزونه‌ی جداگانه است. آن را در صفحه‌ی «اشتراک و پرداخت» همراه اشتراک یا جداگانه فعال کنید.';

export interface AutoTestHolder extends PlanHolder {
  autoTestEndsAt?: string;
}

/** Whether the account may run strategies in the tester on `today`. Admins and the hosted demo always may. */
export function hasAutoTest(u: AutoTestHolder, today: string): boolean {
  if (u.role === 'admin' || u.demo) return true;
  return !!u.autoTestEndsAt && u.autoTestEndsAt >= today;
}

/** Whether a paid plan is running on `today` (the add-on can then be bought on its own). */
export const paidPlanRunning = (u: PlanHolder, today: string) => !!u.planId && u.planId !== FREE_PLAN_ID && !!u.planEndsAt && u.planEndsAt >= today;

export const addonOffered = (p: Pick<Plan, 'autoTestToman'>) => (p.autoTestToman ?? 0) > 0;

/** The price before discount and the name of an order. */
export function orderOf(plan: Plan, kind: PaymentKind): { toman: number; name: string } {
  const addon = plan.autoTestToman ?? 0;
  if (kind === 'plan') return { toman: plan.priceToman, name: plan.name };
  if (kind === 'plan_autotest') return { toman: plan.priceToman + addon, name: `${plan.name} + ${AUTOTEST_LABEL}` };
  return { toman: addon, name: `${AUTOTEST_LABEL} (${plan.name})` };
}

/** What a checkout request asks for. */
export const kindOf = (body: { autoTest?: unknown; addonOnly?: unknown }): PaymentKind =>
  body.addonOnly === true ? 'autotest' : body.autoTest === true ? 'plan_autotest' : 'plan';

export const includesPlan = (k: PaymentKind | undefined) => k !== 'autotest';
export const includesAutoTest = (k: PaymentKind | undefined) => k === 'plan_autotest' || k === 'autotest';

/** Default add-on prices of the built-in paid plans (toman). */
export const DEFAULT_AUTOTEST_PRICES: Record<string, number> = { 'pro-1m': 290_000, 'pro-3m': 790_000, 'pro-12m': 2_490_000 };
