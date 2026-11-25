import { runPine, type RunInput } from './run';

/** Runs Pine scripts off the page's thread, so the page stays responsive during long tests. */
self.onmessage = (e: MessageEvent<{ id: number; input: RunInput }>) => {
  const { id, input } = e.data;
  let result;
  try {
    result = runPine(input);
  } catch (err) {
    result = { ok: false as const, error: { message: `خطای داخلی: ${(err as Error)?.message ?? err}`, line: 0, col: 0 }, inputs: [], logs: [] };
  }
  (self as unknown as Worker).postMessage({ id, result });
};
