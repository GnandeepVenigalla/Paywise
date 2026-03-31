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
  const adKeywords = ['monetag', 'izcle', 'propush', 'vignette', 'onsite', 'ad-', 'ads-', 'google-ads', 'sponsored', 'onclick', 'popcash', 'popads'];
  const suspiciousText = [
    'vpn recommended', 'install and continue', 'tap to install', 'download now', 'system update', 
    'security warning', 'download is ready', 'tap to proceed', 'please wait...', 'recommended app',
    'security scan', 'threats found', 'optimize your', 'free download', 'urgent action', 'cleaning system'
  ];
  
  const tagAd = (node) => {
    if (node.nodeType !== 1 || node.dataset.adTagged) return;
    
    const nodeId = (node.id || '').toLowerCase();
    const nodeClass = (node.className?.toString() || '').toLowerCase();
    const nodeText = (node.innerText || '').toLowerCase();
    const root = document.getElementById('root');
    const style = window.getComputedStyle(node);
    
    // Exclusion: Identify legitimate PrimeReact or App components
    // PrimeReact components almost always have 'p-component' or follow a strict 'p-' prefix
    const isPrimeReact = nodeClass.includes('p-component') || nodeClass.includes('p-toast') || nodeClass.includes('p-dialog');
    const isAppRoot = root?.contains(node);
    const isInternal = isPrimeReact || (isAppRoot && !nodeClass.includes('monetag'));

    // Heuristics for Ads
    const hasAdKeyword = adKeywords.some(kw => nodeId.includes(kw) || nodeClass.includes(kw));
    const hasSuspiciousText = suspiciousText.some(st => nodeText.includes(st));
    const isHighZOverlay = parseInt(style.zIndex) >= 1000 && (style.position === 'fixed' || style.position === 'absolute');
    
    // Check if it's an iframe with an ad source
    let hasAdSource = false;
    if (node.tagName === 'IFRAME') {
      const src = (node.src || '').toLowerCase();
      hasAdSource = adKeywords.some(kw => src.includes(kw));
    }
    
    // If it's a high-z overlay outside root (or specifically branded), it's probably an ad
    if ((hasAdKeyword || hasAdSource || (isHighZOverlay && !isInternal) || hasSuspiciousText)) {
      node.dataset.adTagged = 'true';
      
      const badge = document.createElement('div');
      badge.innerHTML = `
        <div style="display:flex;align-items:center;gap:6px;">
          <div style="width:7px;height:7px;border-radius:50%;background:#ef4444;box-shadow:0 0 6px #ef4444;animation:pulse 2s infinite;"></div>
          <span>ADS / SPONSORED CONTENT</span>
        </div>
        <style>@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }</style>
      `;
      
      badge.style.cssText = `
        position: fixed;
        top: 8px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 2147483647 !important;
        background: rgba(0, 0, 0, 0.9);
        color: #ffffff;
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 10px;
        font-weight: 900;
        padding: 8px 20px;
        border: 1px solid rgba(255,255,255,0.25);
        border-radius: 999px;
        pointer-events: none;
        box-shadow: 0 10px 40px rgba(0,0,0,0.9), 0 0 15px rgba(239, 68, 68, 0.3);
        letter-spacing: 1px;
        text-transform: uppercase;
        backdrop-filter: blur(12px);
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        white-space: nowrap;
      `;
      
      document.body.appendChild(badge);
      
      const checkInterval = setInterval(() => {
        if (!document.body.contains(node) || style.display === 'none' || style.visibility === 'hidden') {
          badge.style.opacity = '0';
          badge.style.transform = 'translateX(-50%) translateY(-20px)';
          setTimeout(() => { badge.remove(); clearInterval(checkInterval); }, 500);
        }
      }, 800);
    }
  };

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach(tagAd);
    });
  });
  
  observer.observe(document.body, { childList: true, subtree: true });

  // Fallback: periodic scan for ads that change properties without being re-added
  setInterval(() => {
    const overlays = Array.from(document.querySelectorAll('body > div, body > iframe, [style*="z-index"]'));
    overlays.forEach(tagAd);
  }, 2000);
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
