/* ═══════════════════════════════════════════════════════
   SERVICE WORKER — Papaya Juice  (v4 — Cache + Notifs)
   ✓ Cache images produits (Supabase CDN)
   ✓ Cache fonts Google
   ✓ Cache assets statiques (logo, icons)
   ✓ Network-first pour l'API backend
   ✓ Network-first pour les pages HTML (produits toujours à jour)
   ✓ Notifications push
═══════════════════════════════════════════════════════ */

const CACHE_STATIC  = 'papaya-static-v4';
const CACHE_IMAGES  = 'papaya-images-v4';
const CACHE_FONTS   = 'papaya-fonts-v4';

const STATIC_ASSETS = [
  '/logo.png',
  '/sw.js',
];

/* ── Install ── */
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_STATIC).then(cache =>
      cache.addAll(STATIC_ASSETS).catch(() => {})
    )
  );
});

/* ── Activate : vider les anciens caches ── */
self.addEventListener('activate', e => {
  const KEEP = [CACHE_STATIC, CACHE_IMAGES, CACHE_FONTS];
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => !KEEP.includes(k)).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* ── Fetch ── */
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // ── 1. API backend → Network-first ──
  if (url.hostname.includes('railway.app') || url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // ── 2. Supabase API (données produits, commandes) → Network-first ──
  if (url.hostname.includes('supabase.co') && url.pathname.includes('/rest/')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // ── 3. Images produits Supabase / CDN → Cache-first ──
  const isImage = /\.(png|jpg|jpeg|webp|svg|gif|avif)(\?.*)?$/i.test(url.pathname);
  if (isImage || (url.hostname.includes('supabase.co') && url.pathname.includes('/storage/')) || url.hostname.includes('storage.googleapis.com')) {
    e.respondWith(
      caches.open(CACHE_IMAGES).then(async cache => {
        const cached = await cache.match(e.request);
        if (cached) return cached;
        try {
          const fresh = await fetch(e.request);
          if (fresh && fresh.status === 200) cache.put(e.request, fresh.clone());
          return fresh;
        } catch {
          return cached || new Response('', { status: 404 });
        }
      })
    );
    return;
  }

  // ── 4. Google Fonts → Cache-first ──
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    e.respondWith(
      caches.open(CACHE_FONTS).then(async cache => {
        const cached = await cache.match(e.request);
        if (cached) return cached;
        const fresh = await fetch(e.request);
        if (fresh && fresh.status === 200) cache.put(e.request, fresh.clone());
        return fresh;
      })
    );
    return;
  }

  // ── 5. Pages HTML → Network-first (produits/menu toujours à jour) ──
  const accept = e.request.headers.get('accept') || '';
  const isHTML = accept.includes('text/html') || url.pathname.endsWith('.html')
    || url.pathname === '/' || !url.pathname.includes('.');
  if (url.origin === self.location.origin && isHTML) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // ── 6. Autres assets statiques (js, css, icons) → Cache-first ──
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    );
    return;
  }
});

/* ══════════════════════════════════════════
   Notifications Push
══════════════════════════════════════════ */
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
   MESSAGE depuis la page
══════════════════════════════════════════ */
self.addEventListener('message', e => {
  if (!e.data) return;

  if (e.data.type === 'NOTIFY') {
    self.registration.showNotification(e.data.title || 'Papaya Juice', {
      body:     e.data.body || '',
      icon:     '/logo.png',
      badge:    '/logo.png',
      vibrate:  [200, 100, 200],
      tag:      e.data.tag || 'order-update',
      renotify: true,
      data:     e.data.url ? { url: e.data.url } : {}
    });
    return;
  }

  if (e.data.type === 'CACHE_IMAGE' && e.data.url) {
    caches.open(CACHE_IMAGES).then(async cache => {
      const already = await cache.match(e.data.url);
      if (!already) {
        fetch(e.data.url).then(r => { if (r && r.status === 200) cache.put(e.data.url, r); }).catch(() => {});
      }
    });
    return;
  }
});
