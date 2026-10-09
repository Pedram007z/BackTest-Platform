import { useEffect, useState } from 'react';
import { sampleNews, type NewsEvent } from '../lib/news';
import { api, hasServer } from '../services/api';

const WEEK = 7 * 86_400_000;
const cache = new Map<string, NewsEvent[]>();

/** schedule: only the server's official release schedule (times of USD, EUR and GBP news, no values) */
export type NewsSource = 'forexfactory' | 'schedule' | 'sample';

/**
 * Calendar events around the replay cursor (three weeks back, four ahead). With the API server the
 * events come from ForexFactory (weeks it cannot provide come from the server's official release
 * schedule, and weeks outside that from the sample calendar); otherwise from the built-in sample calendar.
 */
export function useNews(cursor: number): { events: NewsEvent[]; source: NewsSource; loading: boolean } {
  const start = Math.floor(cursor / WEEK) * WEEK - 3 * WEEK;
  const end = start + 7 * WEEK;
  const key = `${start}`;
  const [state, setState] = useState<{ key: string; events: NewsEvent[]; source: NewsSource; loading: boolean }>(() => ({
    key,
    events: hasServer ? (cache.get(key) ?? []) : sampleNews(start, end),
    source: hasServer ? 'forexfactory' : 'sample',
    loading: hasServer && !cache.has(key),
  }));

  useEffect(() => {
    if (!hasServer) {
      setState({ key, events: sampleNews(start, end), source: 'sample', loading: false });
      return;
    }
    const hit = cache.get(key);
    if (hit) {
      setState({ key, events: hit, source: hit.length && hit.every((e) => e.scheduled) ? 'schedule' : 'forexfactory', loading: false });
      return;
    }
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    api<{ events: NewsEvent[]; missing?: number[] }>(`/api/news?from=${start}&to=${end}`)
      .then((r) => {
        // weeks ForexFactory could not provide are filled from the sample calendar
        const missing = r.missing ?? [];
        const filled = missing.length
          ? [...r.events, ...missing.flatMap((w) => sampleNews(Math.max(start, w), Math.min(end, w + WEEK)))].sort((a, b) => a.time - b.time)
          : r.events;
        const source: NewsSource = r.events.some((e) => !e.scheduled) ? 'forexfactory' : r.events.length ? 'schedule' : missing.length ? 'sample' : 'forexfactory';
        if (source !== 'sample') cache.set(key, filled);
        if (alive) setState({ key, events: filled, source, loading: false });
      })
      .catch(() => {
        if (alive) setState({ key, events: sampleNews(start, end), source: 'sample', loading: false });
      });
    return () => {
      alive = false;
    };
  }, [key, start, end]);

  return state;
}
