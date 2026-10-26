import '@fontsource-variable/vazirmatn';
import '@fontsource-variable/readex-pro';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { PREVIEW, appHref } from './lib/nav';
import { installPageGuard } from './lib/pageGuard';
import { setupPwa } from './lib/pwa';

// Addresses from before clean URLs (site/#/login, the admin's site/#/k/…, bank returns) keep working.
if (!PREVIEW && location.hash.startsWith('#/')) history.replaceState(null, '', appHref(location.hash.slice(1)));

// The page is Persian and right-to-left (also when embedded without our index.html).
document.documentElement.lang = 'fa';
document.documentElement.dir = 'rtl';

// installable app: service worker and the browser's install offer
setupPwa();

const root = document.getElementById('root')!;
installPageGuard(root);

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
