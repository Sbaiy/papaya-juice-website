/* ═══════════════════════════════════════
   SERVICE WORKER — Papaya Juice
   Gère les notifications push background
═══════════════════════════════════════ */

const CACHE_NAME = 'papaya-v1';

/* ── Install ── */
self.addEventListener('install', e => {
  self.skipWaiting();
});

/* ── Activate ── */
self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});

/* ── Push event (reçu depuis le serveur) ── */
self.addEventListener('push', e => {
  if (!e.data) return;
  const data = e.data.json();
  e.waitUntil(
    self.registration.showNotification(data.title || 'Papaya Juice', {
      body:    data.body  || '',
      icon:    '/logo.png',
      badge:   '/logo.png',
      vibrate: [200, 100, 200],
      data:    data.url ? { url: data.url } : {}
    })
  );
});

/* ── Notification click ── */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes(url) && 'focus' in client) return client.focus();
      }
      return clients.openWindow(url);
    })
  );
});

/* ══════════════════════════════════════════
   MESSAGE depuis la page (polling fallback)
   La page envoie { type:'NOTIFY', title, body }
   quand le statut change — le SW affiche la notif
   même si la page est en background
══════════════════════════════════════════ */
self.addEventListener('message', e => {
  if (!e.data || e.data.type !== 'NOTIFY') return;
  self.registration.showNotification(e.data.title || 'Papaya Juice', {
    body:    e.data.body || '',
    icon:    '/logo.png',
    badge:   '/logo.png',
    vibrate: [200, 100, 200],
    tag:     e.data.tag || 'order-update',   // remplace la notif précédente si même tag
    renotify: true,
    data:    e.data.url ? { url: e.data.url } : {}
  });
});
