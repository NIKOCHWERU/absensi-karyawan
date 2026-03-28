const CACHE_NAME = 'absensi-eja-v5';

self.addEventListener('install', function (event) {
    self.skipWaiting();
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.filter(function (cacheName) {
                    return cacheName !== CACHE_NAME;
                }).map(function (cacheName) {
                    return caches.delete(cacheName);
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', function (event) {
    // Only intercept navigation (HTML) for offline message
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                return new Response(
                    "<html><body style='font-family:sans-serif;text-align:center;padding:50px;'><h2>Koneksi Terputus</h2><p>Mohon periksa internet Anda.</p><button onclick='window.location.reload()'>Segarkan Halaman</button></body></html>",
                    { headers: { 'Content-Type': 'text/html' } }
                );
            })
        );
        return;
    }

    // For other assets, just network-first
    event.respondWith(fetch(event.request));
});

self.addEventListener('push', function (event) {
    let data = { title: 'Pengumuman Baru!', body: 'Papan Informasi telah diperbarui.', url: '/' };
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: '/logo_elok_buah.jpg',
        badge: '/logo_elok_buah.jpg',
        vibrate: [200, 100, 200, 100, 200, 100, 200],
        data: { url: data.url || '/' }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    // This looks to see if the current is already open and focuses if it is
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(windowClients => {
            const urlToOpen = event.notification.data?.url || '/';
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
