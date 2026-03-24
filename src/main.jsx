import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.jsx';
import './index.css';

// PrimeReact essential imports
import { PrimeReactProvider } from 'primereact/api';
import "primereact/resources/themes/lara-light-indigo/theme.css";     
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

// Restore custom theme from localStorage immediately (before React mounts)
// so there's no flash of unstyled content on page load
import { restoreCustomThemeFromStorage } from './hooks/useAppSettings';
restoreCustomThemeFromStorage();

// Capture beforeinstallprompt as early as possible
window.deferredPWAEvent = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.deferredPWAEvent = e;
});

// Register minimal service worker for PWA requirements
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`)
      .then(registration => console.log('SW registered: ', registration))
      .catch(error => console.log('SW registration failed: ', error));
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
      <PrimeReactProvider>
        <App />
      </PrimeReactProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
);
