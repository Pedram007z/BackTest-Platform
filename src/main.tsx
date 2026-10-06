import '@fontsource-variable/vazirmatn';
import '@fontsource-variable/readex-pro';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { installPageGuard } from './lib/pageGuard';

// The page is Persian and right-to-left (also when embedded without our index.html).
document.documentElement.lang = 'fa';
document.documentElement.dir = 'rtl';

const root = document.getElementById('root')!;
installPageGuard(root);

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
