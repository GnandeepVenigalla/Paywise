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

// Global Ad Transparency System
// Monitors for dynamic 3rd-party ad injections (Monetag, etc.) and tags them
const startAdObserver = () => {
  const adKeywords = ['monetag', 'izcle', 'propush', 'vignette', 'onsite', 'ad-', 'ads-', 'google-ads'];
  
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) { // Is Element
          const nodeId = (node.id || '').toLowerCase();
          const nodeClass = (node.className?.toString() || '').toLowerCase();
          const root = document.getElementById('root');
          
          // Exclusion list for legitimate application components (Portals, PrimeReact, etc.)
          const appClasses = ['p-', 'pi-', 'toast', 'modal', 'headlessui', 'radix'];
          const isAppElement = appClasses.some(ac => nodeId.includes(ac) || nodeClass.includes(ac));
          
          // Check if it's an ad container or a high-z-index overlay outside the React root
          const isKeywordMatch = adKeywords.some(kw => nodeId.includes(kw) || nodeClass.includes(kw));
          const isHighZOverlay = (window.getComputedStyle(node).zIndex >= 9999) && !root?.contains(node) && !isAppElement;
          
          const isAdContainer = isKeywordMatch || isHighZOverlay;

          if (isAdContainer && !node.dataset.adTagged) {
            node.dataset.adTagged = 'true';
            
            // Create a very prominent "ADS" badge
            const badge = document.createElement('div');
            badge.innerHTML = `
              <div style="display:flex;align-items:center;gap:6px;">
                <div style="width:6px;height:6px;border-radius:50%;background:#ef4444;box-shadow:0 0 4px #ef4444;"></div>
                <span>ADS / SPONSORED CONTENT</span>
              </div>
            `;
            
            badge.style.cssText = `
              position: fixed;
              top: 10px;
              left: 50%;
              transform: translateX(-50%);
              z-index: 2147483647 !important;
              background: rgba(0, 0, 0, 0.95);
              color: #ffffff;
              font-family: system-ui, -apple-system, sans-serif;
              font-size: 10px;
              font-weight: 950;
              padding: 6px 16px;
              border: 1px solid rgba(255,255,255,0.3);
              border-radius: 999px;
              pointer-events: none;
              box-shadow: 0 10px 30px rgba(0,0,0,0.8), 0 0 10px rgba(239, 68, 68, 0.4);
              letter-spacing: 1.5px;
              text-transform: uppercase;
              backdrop-filter: blur(8px);
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              white-space: nowrap;
            `;
            
            document.body.appendChild(badge);
            
            // Periodically check if the triggering node is still present or visible
            const checkInterval = setInterval(() => {
              if (!document.body.contains(node)) {
                badge.style.opacity = '0';
                badge.style.transform = 'translateX(-50%) translateY(-20px)';
                setTimeout(() => {
                  badge.remove();
                  clearInterval(checkInterval);
                }, 300);
              }
            }, 1000);
          }
        }
      });
    });
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
};
if (typeof window !== 'undefined') startAdObserver();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
      <PrimeReactProvider>
        <App />
      </PrimeReactProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
);
