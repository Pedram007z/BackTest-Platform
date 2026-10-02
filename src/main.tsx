import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// The page is Persian and right-to-left (also when embedded without our index.html).
document.documentElement.lang = 'fa';
document.documentElement.dir = 'rtl';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
