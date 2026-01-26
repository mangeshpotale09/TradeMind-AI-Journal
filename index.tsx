
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * Root Cause Analysis for Blank Page:
 * 1. Missing Script Tag: index.html was missing the <script type="module"> tag to load the JS.
 * 2. ReferenceError (process): Browsers do not have a global 'process' object. 
 *    Directly accessing process.env.API_KEY without a shim causes the app to crash before rendering.
 */
if (typeof (window as any).process === 'undefined') {
  (window as any).process = { env: {} };
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
