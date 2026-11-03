import { keyToMs } from './calendar';
import { replayBars } from './market';
import { followIdeal, processBar, type FillEvent } from './trading';
import type { ReplayCheckpoint, Session, Trade } from './types';

/**
 * Rewinding a replay session. After every order action (place, change, close, cancel, delete) the
 * session keeps a checkpoint: the cursor and its live trades. A rewind goes back to the last
 * checkpoint before its target, drops the orders placed from the target on, and replays the bars
 * from the checkpoint to the target with the same rules as the forward replay.
 */

/** A trade that bars can still change: an open or pending order, or a closed one whose ideal-R follow-up runs. */
export const isLive = (t: Trade) => t.status === 'open' || t.status === 'pending' || (t.status === 'closed' && !t.idealDone);

/** One trade through the bars between two replay positions: fills, stops and targets, then the ideal-R follow-up. */
export function simulateTrade(t: Trade, from: number, to: number, events: FillEvent[]): Trade {
  if (!isLive(t)) return t;
  let trade = t;
  for (const bar of replayBars(t.symbol, from, to)) {
    if (trade.status === 'open' || trade.status === 'pending') {
      if (trade.status === 'pending' && bar.time < trade.placedTime) continue;
      trade = processBar(trade, bar, events);
    } else if (trade.status === 'closed' && !trade.idealDone) {
      trade = followIdeal(trade, bar);
    } else break;
  }
  return trade;
}

/** Checkpoints kept per session (the oldest go first; a rewind before the oldest keeps the older trades as they are). */
export const MAX_CHECKPOINTS = 300;

/**
 * The session's checkpoints after an order action at its cursor, with `trades` (all trades, or the
 * session's) as they are now. The live trades are kept without their journals (a rewind keeps a
 * trade's journal from the current trade). One checkpoint per cursor: a later action there replaces it.
 */
export function withCheckpoint(session: Session, trades: Trade[]): ReplayCheckpoint[] {
  const live = trades.filter((t) => t.sessionId === session.id && isLive(t)).map(({ journal: _journal, ...t }) => t as Trade);
  const kept = (session.checkpoints ?? []).filter((c) => c.cursor < session.cursor);
  return [...kept, { cursor: session.cursor, live }].slice(-MAX_CHECKPOINTS);
}

export interface RewindPlan {
  /** The new cursor: the target, kept between the session's start and the current cursor. */
  to: number;
  /** Orders placed after `to`: a rewind removes them (with their journals). */
  removed: Trade[];
  /** Orders that go back to how they were at `to` (open or pending again, an earlier stop or target…). */
  changed: Trade[];
  /** The session's trades after the rewind. */
  trades: Trade[];
  /** The session's checkpoints that stay (those up to `to`). */
  checkpoints: ReplayCheckpoint[];
  /** Where the bars are replayed from (the checkpoint used), or null when nothing is replayed. */
  from: number | null;
}

/**
 * What a rewind of a session to `target` does: the session goes back to how it was at the new
 * cursor. Orders placed after it never happened and go. The others go back to the last checkpoint
 * at or before it (see `withCheckpoint`), and the bars from there to the new cursor are replayed
 * with the same rules as the forward replay: fills, stops, targets and the trader's changes after
 * it are undone, and everything done up to it (at the new cursor itself too) stays.
 * Trades from before checkpoints existed (and before the oldest kept one) stay as they are.
 * Null when the target is not before the cursor. The session's start is the limit.
 */
export function planRewind(session: Session, all: Trade[], target: number): RewindPlan | null {
  const to = Math.max(keyToMs(session.startDate), Math.min(target, session.cursor));
  if (to >= session.cursor) return null;
  const checkpoints = (session.checkpoints ?? []).filter((c) => c.cursor <= to);
  const base = checkpoints[checkpoints.length - 1];
  const live = new Map((base?.live ?? []).map((t) => [t.id, t]));
  const mine = all.filter((t) => t.sessionId === session.id);
  const removed = mine.filter((t) => t.placedTime > to);
  const now = new Map(mine.map((t) => [t.id, t]));
  let trades = mine
    .filter((t) => t.placedTime <= to)
    .map((t) => {
      const was = live.get(t.id);
      return was ? ({ ...was, journal: t.journal } as Trade) : t;
    });
  if (base) trades = trades.map((t) => (live.has(t.id) ? simulateTrade(t, base.cursor, to, []) : t));
  const changed = trades.filter((t) => {
    const n = now.get(t.id);
    return !!n && (n.status !== t.status || n.sl !== t.sl || n.tp !== t.tp || n.entry !== t.entry || n.lots !== t.lots || n.partials.length !== t.partials.length);
  });
  return { to, removed, changed, trades, checkpoints, from: base ? base.cursor : null };
}
