self.addEventListener('install', (e) => {
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
    // A simple pass-through fetch handler is required by PWA criteria
    // If the resource is un-fetchable (offline), it will fail normally
    e.respondWith(
        fetch(e.request).catch(() => {
            // Just returning a dummy response or throwing error for offline 
            // but this is enough to trick PWA installability requirements
            return new Response("Offline", { status: 503, statusText: "Offline" });
        })
    );
});
