/* TCS Study service worker: makes the app work offline.
 * - pages: network first, cached copy when offline
 * - hashed build assets, fonts, icons: cache first
 * - /api and other origins (Clerk): never cached
 */
const VERSION = "tcs-study-v2";
const PAGES = `${VERSION}-pages`;
const ASSETS = `${VERSION}-assets`;
const CORE = ["/", "/practice/daily", "/practice/extra", "/practice/mistakes", "/data"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGES)
      .then((c) => Promise.all(CORE.map((u) => fetch(u, { credentials: "same-origin" }).then((r) => okToCache(r) && c.put(u, r)).catch(() => {}))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

/** The page sends the list of module URLs so they work offline before first visit. */
self.addEventListener("message", (event) => {
  if (event.data?.type !== "warm" || !Array.isArray(event.data.urls)) return;
  event.waitUntil(
    caches.open(PAGES).then(async (c) => {
      for (const u of event.data.urls.slice(0, 50)) {
        if (typeof u !== "string" || !u.startsWith("/")) continue;
        if (await c.match(u)) continue;
        try {
          const r = await fetch(u, { credentials: "same-origin" });
          if (okToCache(r)) await c.put(u, r);
        } catch {
          /* offline: try again next time */
        }
      }
    }),
  );
});

function okToCache(res) {
  return res && res.ok && res.type === "basic" && !res.redirected;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  // React Server Component payloads for client navigation: let Next handle failures (it falls back to a full page load)
  if (req.headers.get("RSC") === "1" || url.searchParams.has("_rsc")) return;

  if (req.mode === "navigate") {
    event.respondWith(networkFirstPage(req, url));
    return;
  }
  if (
    url.pathname.startsWith("/_next/static/") ||
    /\.(?:woff2?|png|svg|ico|webmanifest)$/.test(url.pathname) ||
    url.pathname === "/manifest.webmanifest"
  ) {
    event.respondWith(cacheFirst(req));
  }
});

async function networkFirstPage(req, url) {
  const cache = await caches.open(PAGES);
  const key = url.pathname;
  try {
    const res = await fetch(req);
    if (okToCache(res)) cache.put(key, res.clone());
    return res;
  } catch {
    return (
      (await cache.match(key)) ||
      (await cache.match("/")) ||
      new Response("<h1>Offline</h1><p>Open TCS Study once while online.</p>", {
        headers: { "content-type": "text/html; charset=utf-8" },
      })
    );
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(ASSETS);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (okToCache(res)) cache.put(req, res.clone());
  return res;
}
