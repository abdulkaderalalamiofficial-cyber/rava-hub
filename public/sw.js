/* RAVA service worker — keeps role apps alive in the background. */
const CACHE = "rava-v1";
const SHELL = ["/", "/icon-512.png", "/manifest.webmanifest"];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match("/")))
  );
});

/* Background sync / periodic checks for captain, merchant, provider & control room. */
self.addEventListener("periodicsync", (e) => {
  if (e.tag === "rava-role-sync") e.waitUntil(notifyClients("periodic-sync"));
});

self.addEventListener("sync", (e) => {
  if (e.tag === "rava-role-sync") e.waitUntil(notifyClients("background-sync"));
});

async function notifyClients(kind) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: "window" });
  clients.forEach((c) => c.postMessage({ type: "rava-sync", kind }));
}

self.addEventListener("push", (e) => {
  let data = { title: "RAVA", body: "لديك تحديث جديد" };
  try { if (e.data) data = { ...data, ...e.data.json() }; } catch { /* ignore */ }
  e.waitUntil(self.registration.showNotification(data.title, { body: data.body, icon: "/icon-512.png", badge: "/icon-512.png" }));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window" }).then((cs) => (cs[0] ? cs[0].focus() : self.clients.openWindow("/"))));
});
