import { create } from 'zustand';
import { PREVIEW } from './nav';

/**
 * The site as an installable app (PWA): the service worker (public/sw.js) and the browser's
 * "install app" offer, kept here so a button can show it when the visitor wants.
 */

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallState {
  /** The browser offers to install the app (Chrome, Edge, Samsung Internet on Android and desktop). */
  canInstall: boolean;
  /** Running as the installed app (or the Android app). */
  installed: boolean;
  /** iPhone / iPad Safari: installed through Share → Add to Home Screen. */
  ios: boolean;
}

export const useInstall = create<InstallState>(() => ({
  canInstall: false,
  installed: typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true),
  ios: typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent),
}));

let deferred: InstallPromptEvent | null = null;

/** Shows the browser's install dialog; true when the visitor installed the app. */
export async function installApp(): Promise<boolean> {
  if (!deferred) return false;
  const e = deferred;
  deferred = null;
  useInstall.setState({ canInstall: false });
  await e.prompt();
  return (await e.userChoice).outcome === 'accepted';
}

export function setupPwa() {
  if (PREVIEW || typeof window === 'undefined') return;
  window.addEventListener('beforeinstallprompt', (e) => {
    // shown from our own button instead of the browser's mini bar
    e.preventDefault();
    deferred = e as InstallPromptEvent;
    useInstall.setState({ canInstall: true });
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    useInstall.setState({ canInstall: false, installed: true });
  });
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    });
  }
}
