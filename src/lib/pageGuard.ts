import { API_URL } from '../services/api';

/**
 * Keeps a visitor from being left on a blank page.
 *
 * - Browser translators and some extensions move or wrap text that React manages; React's next update
 *   then fails with "removeChild / insertBefore: not a child of this node" and unmounts the whole app.
 *   The DOM patch below lets React carry on in that case.
 * - Any error the page hits is sent to the API server's log (`[client-error]` lines), so a problem
 *   that only happens on someone else's machine can be seen.
 * - If the app still goes blank, the page reloads once by itself; a second blank within a minute
 *   shows a short message with the error instead of an empty screen.
 */
export function installPageGuard(root: HTMLElement) {
  patchDomForExtensions();

  let lastError = '';
  const report = (message: string, stack?: string) => {
    lastError = message;
    if (!API_URL) return;
    try {
      void fetch(`${API_URL}/api/client-errors`, {
        method: 'POST',
        keepalive: true,
        // text/plain keeps this a simple request (no CORS preflight); the server reads the JSON anyway
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ message: message.slice(0, 300), stack: (stack ?? '').slice(0, 800), url: location.href.slice(0, 200) }),
      }).catch(() => {});
    } catch {
      /* reporting is best effort */
    }
  };
  window.addEventListener('error', (e) => report(e.message || 'error', e.error?.stack));
  window.addEventListener('unhandledrejection', (e) => {
    const r = e.reason as { message?: string; stack?: string } | undefined;
    report(`unhandled rejection: ${r?.message ?? String(e.reason)}`, r?.stack);
  });

  const KEY = 'btl:blank-reload';
  const check = () => {
    if (root.childElementCount > 0) return;
    report(`blank page after: ${lastError || 'unknown error'}`);
    let last = 0;
    try {
      last = Number(sessionStorage.getItem(KEY) ?? 0);
      sessionStorage.setItem(KEY, String(Date.now()));
    } catch {
      /* storage blocked */
    }
    if (Date.now() - last > 60_000) {
      location.reload();
      return;
    }
    const box = document.createElement('div');
    box.setAttribute('role', 'alert');
    box.style.cssText =
      'min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:Vazirmatn Variable,Vazirmatn,Tahoma,sans-serif;text-align:center';
    const inner = document.createElement('div');
    inner.style.cssText = 'max-width:420px;display:flex;flex-direction:column;gap:12px;align-items:center';
    const title = document.createElement('strong');
    title.textContent = 'صفحه نمایش داده نشد';
    const text = document.createElement('p');
    text.style.cssText = 'margin:0;line-height:1.9;opacity:.75';
    text.textContent = 'اگر مترجم مرورگر یا افزونه‌ای روی این صفحه فعال است، آن را خاموش کنید و دوباره امتحان کنید.';
    const detail = document.createElement('code');
    detail.dir = 'ltr';
    detail.style.cssText = 'font-size:11px;opacity:.6;word-break:break-all';
    detail.textContent = lastError;
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'بارگذاری دوباره';
    button.style.cssText = 'padding:10px 20px;border-radius:12px;border:0;background:#6a45f5;color:#fff;font:inherit;cursor:pointer';
    button.onclick = () => location.reload();
    inner.append(title, text, detail, button);
    box.append(inner);
    root.append(box);
  };
  // React empties #root when it unmounts after an error it could not recover from
  new MutationObserver(() => setTimeout(check, 50)).observe(root, { childList: true });
}

/** React issue #11538: tolerate nodes that something outside React moved. */
function patchDomForExtensions() {
  if (typeof Node !== 'function' || !Node.prototype) return;
  const proto = Node.prototype as Node & { __btlPatched?: boolean };
  if (proto.__btlPatched) return;
  proto.__btlPatched = true;
  const removeChild = proto.removeChild;
  proto.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) return child;
    return removeChild.call(this, child) as T;
  };
  const insertBefore = proto.insertBefore;
  proto.insertBefore = function <T extends Node>(this: Node, node: T, ref: Node | null): T {
    if (ref && ref.parentNode !== this) return node;
    return insertBefore.call(this, node, ref) as T;
  };
}
