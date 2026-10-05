import { useEffect, useState } from 'react';
import { sampleNews, type NewsEvent } from '../lib/news';
import { api, hasServer } from '../services/api';

const WEEK = 7 * 86_400_000;
const cache = new Map<string, NewsEvent[]>();

export type NewsSource = 'forexfactory' | 'sample';

/**
 * Calendar events around the replay cursor (three weeks back, four ahead). With the API server the
 * events come from ForexFactory; otherwise from the built-in sample calendar.
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
      setState({ key, events: hit, source: 'forexfactory', loading: false });
      return;
    }
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    api<{ events: NewsEvent[] }>(`/api/news?from=${start}&to=${end}`)
      .then((r) => {
        cache.set(key, r.events);
        if (alive) setState({ key, events: r.events, source: 'forexfactory', loading: false });
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
