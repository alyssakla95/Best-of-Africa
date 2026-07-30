const CACHE_NAME = 'boa-shell-v4';
const SHELL_URLS = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(SHELL_URLS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    const acceptsHtml = request.headers.get('accept')?.includes('text/html');

    // Navigations always check the network so a deployed bundle replaces an
    // older browser cache immediately. The shell is only an offline fallback.
    if (request.mode === 'navigate' || acceptsHtml) {
        event.respondWith(fetch(request).catch(() => caches.match('/index.html')));
        return;
    }

    // API, image and media responses keep their own HTTP cache policy. In
    // particular, never let Cache Storage retain a failed publisher image.
    if (
        request.destination === 'image'
        || request.destination === 'audio'
        || request.url.includes('/api/')
        || request.url.includes('/assets/')
    ) {
        return;
    }

    // Hashed application assets can use the browser/Cloudflare HTTP cache.
    // Cache Storage is reserved for the small offline shell above.
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            caches.keys().then((names) => Promise.all(
                names
                    .filter((name) => name.startsWith('boa-cache-') || name.startsWith('boa-shell-'))
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            )),
            self.clients.claim(),
        ])
    );
});
