/* ==========================================================================
   Comissió de Festes d'Ares del Maestrat - Service Worker (Push Notifications)
   ========================================================================== */

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// Listener de recepció de notificacions Push
self.addEventListener('push', (event) => {
    let payload = {
        title: "Comissió de Festes d'Ares",
        body: "Nova publicació disponible!",
        icon: "/img/logo.png",
        badge: "/img/logo.png",
        image: null,
        url: "/noticies"
    };

    if (event.data) {
        try {
            const data = event.data.json();
            payload.title = data.title || payload.title;
            payload.body = data.body || payload.body;
            payload.icon = data.icon || payload.icon;
            payload.badge = data.badge || payload.badge;
            payload.image = data.image || null;
            payload.url = data.url || payload.url;
        } catch (e) {
            payload.body = event.data.text();
        }
    }

    const options = {
        body: payload.body,
        icon: payload.icon,
        badge: payload.badge,
        image: payload.image,
        data: { url: payload.url },
        vibrate: [100, 50, 100],
        actions: [
            { action: 'open', title: 'Llegir notícia' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(payload.title, options)
    );
});

// Listener al fer clic en la notificació
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const targetUrl = (event.notification.data && event.notification.data.url) 
        ? event.notification.data.url 
        : '/noticies';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Si ja hi ha una pestanya oberta amb el lloc web, navegar-hi i enfocar-la
            for (const client of clientList) {
                if (client.url && 'focus' in client) {
                    client.focus();
                    client.navigate(targetUrl);
                    return;
                }
            }
            // En cas contrari, obrir una nova finestra
            if (self.clients.openWindow) {
                return self.clients.openWindow(targetUrl);
            }
        })
    );
});
