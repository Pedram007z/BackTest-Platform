import { localDayKey } from '../lib/calendar';
import { FREE_SESSION_LIMIT, onFreePlan } from '../services/plan';
import { useAuth } from '../store/useAuth';
import { useStore } from '../store/useStore';

/**
 * The signed-in account's plan limits (services/plan.ts): on the free plan one session, and the
 * journal, analytics and economic calendar are locked. The server checks the same rules.
 */
export function usePlan() {
  const plan = useStore((s) => s.user.plan);
  const sessions = useStore((s) => s.sessions.length);
  const role = useAuth((s) => s.session?.role);
  const demo = useAuth((s) => s.session?.demo);
  const free = onFreePlan({ planId: plan.id, planEndsAt: plan.endsAt, role, demo }, localDayKey());
  return {
    /** On the free plan: the journal, analytics and economic calendar are locked. */
    free,
    /** Whether another session can be made. */
    canAddSession: !free || sessions < FREE_SESSION_LIMIT,
  };
}
