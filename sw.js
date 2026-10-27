// Keeps the tracker working at the field with no signal.
// The page itself is fetched fresh whenever there's a connection (so updates show on the
// next open), falling back to the saved copy offline. Bump VERSION whenever a shell file changes.
const VERSION = "bqpen-v30";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./vendor/supabase-2.117.3.js",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png"];

self.addEventListener("install", e => {
  // bypass the browser's HTTP cache so a new version never installs an old page
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL.map(u => new Request(u, {cache: "reload"})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

function networkFirst(req){
  return caches.open(VERSION).then(async cache => {
    try{
      const res = await Promise.race([
        fetch(req, {cache: "no-cache"}),
        new Promise((_, no) => setTimeout(() => no(new Error("slow")), 5000)),   // weak signal: use the saved copy
      ]);
      if (res.ok) cache.put(req.mode === "navigate" ? "./index.html" : req, res.clone());
      return res;
    }catch(e){
      return (await cache.match(req, {ignoreSearch: true})) || (await cache.match("./index.html")) || Response.error();
    }
  });
}
function cacheFirst(req){
  return caches.open(VERSION).then(async cache => {
    const hit = await cache.match(req);
    const net = fetch(req).then(res => { if (res.ok || res.type === "opaque") cache.put(req, res.clone()); return res; })
      .catch(() => hit || Response.error());
    return hit || net;
  });
}
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const fonts = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (url.origin !== self.location.origin && !fonts) return;   // Supabase calls go straight to the network
  const page = req.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith("/index.html");
  e.respondWith(page ? networkFirst(req) : cacheFirst(req));
});
