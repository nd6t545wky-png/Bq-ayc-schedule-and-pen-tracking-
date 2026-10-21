// App shell cache so the tracker opens at the field with no signal.
// Bump VERSION whenever a shell file changes.
const VERSION = "bqpen-v8";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./vendor/supabase-2.117.3.js",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const fonts = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (url.origin !== self.location.origin && !fonts) return;   // Supabase calls go straight to the network
  // Serve from cache, refresh in the background.
  e.respondWith(caches.open(VERSION).then(async cache => {
    const hit = await cache.match(req, {ignoreSearch: req.mode === "navigate"});
    const net = fetch(req).then(res => { if (res.ok || res.type === "opaque") cache.put(req, res.clone()); return res; })
      .catch(() => hit || (req.mode === "navigate" ? cache.match("./index.html") : Response.error()));
    return hit || net;
  }));
});
