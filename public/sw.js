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
            // Add Content-Type to prevent browser downloading it
            return new Response("Paywise is Offline. Please check your network or wait for server to start.", {
                status: 503,
                statusText: "Offline",
                headers: { 'Content-Type': 'text/plain' }
            });
        })
    );
});
