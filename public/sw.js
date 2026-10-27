// Service worker: abre offline com a última versão e mostra os avisos.
const CACHE = 'challenge-v1';
const SHELL = ['/', '/app.css', '/app.js', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/badge-96.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// Rede primeiro (o app muda com frequência), cache se estiver sem internet. A API nunca é guardada.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/') || url.pathname.startsWith('/i/')) return;
  const key = e.request.mode === 'navigate' ? '/' : e.request;
  e.respondWith(
    fetch(e.request).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(key, copy)); }
      return r;
    }).catch(() => caches.match(key).then(r => r || Response.error())),
  );
});

self.addEventListener('push', e => {
  let m = {};
  try { m = e.data.json(); } catch { m = { title: 'Challenge', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(m.title || 'Challenge', {
    body: m.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-96.png',
    tag: m.tag,
    renotify: !!m.tag,
    data: { url: m.url || '/' },
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || '/';
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const open = all.find(c => new URL(c.url).origin === location.origin);
    if (open) { await open.focus(); open.postMessage({ type: 'open', url }); return; }
    await self.clients.openWindow(url);
  })());
});
