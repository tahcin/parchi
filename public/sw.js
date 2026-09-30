// Parchi service worker. Hand-written, no dependencies.
// Goal: the app opens on a patchy rural connection, and past checks (kept in localStorage)
// stay readable with no data at all. Checks themselves always need the network.
//
// Strategy by request:
//   POST / non-GET (any URL) ........ never touched, never cached
//   /api/audit, /api/speak .......... network only
//   GET /api/v1/reports ............. network first, cached copy when offline
//   other /api/* .................... network only
//   page navigations ................ network first, cached page, then cached "/"
//   /_next/static/* ................. cache first (file names are content hashed)
//   /samples, /icons, states JSON ... stale-while-revalidate (precached on install)
//   Google Fonts CSS ................ stale-while-revalidate
//   Google Fonts files .............. cache first (URLs are versioned)

const VERSION = "v2";
const SHELL = `parchi-shell-${VERSION}`;
const STATIC = `parchi-static-${VERSION}`;
const RUNTIME = `parchi-runtime-${VERSION}`;
const FONTS = `parchi-fonts-${VERSION}`;
const KEEP = [SHELL, STATIC, RUNTIME, FONTS];

const PRECACHE = [
  "/samples/chit-chilli.png",
  "/samples/chit-paddy.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
  "/india-states.json",
  "/manifest.webmanifest",
  "/icon.svg",
];

// Store "/" and every /_next/static file its HTML references, so the shell boots offline even
// though those files were fetched before this worker took control.
async function precacheShell() {
  const res = await fetch("/", { cache: "reload", credentials: "same-origin" });
  if (!res.ok) throw new Error(`shell ${res.status}`);
  const html = await res.clone().text();
  await (await caches.open(SHELL)).put("/", res);
  const assets = new Set(html.match(/\/_next\/static\/[^"'\s)\\<>]+/g) || []);
  const cache = await caches.open(STATIC);
  await Promise.all(
    [...assets].map((u) => cache.add(u.replace(/&amp;/g, "&")).catch(() => undefined)),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL);
      // One missing asset should not block install; the shell itself must succeed.
      await Promise.all(PRECACHE.map((u) => cache.add(u).catch(() => undefined)));
      await precacheShell();
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.filter((n) => n.startsWith("parchi-") && !KEEP.includes(n)).map((n) => caches.delete(n)),
      );
      if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
      await self.clients.claim();
    })(),
  );
});

// Cheap phones have little storage: keep runtime caches bounded (oldest entries go first).
async function trim(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

function cacheable(res) {
  return res && (res.ok || res.type === "opaque") && res.type !== "opaqueredirect";
}

async function cacheFirst(req, name, max) {
  const hit = await caches.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (cacheable(res)) {
    const cache = await caches.open(name);
    await cache.put(req, res.clone());
    if (max) trim(name, max).catch(() => undefined);
  }
  return res;
}

// Live data (the inspector's audit feed): always fresh when online, last copy when offline.
async function networkFirst(event, req, name, max) {
  try {
    const res = await fetch(req);
    if (cacheable(res)) {
      const copy = res.clone();
      event.waitUntil(
        (async () => {
          await (await caches.open(name)).put(req, copy);
          if (max) await trim(name, max);
        })().catch(() => undefined),
      );
    }
    return res;
  } catch {
    return (await caches.match(req)) || Response.error();
  }
}

async function staleWhileRevalidate(event, req, name, max, fetchReq) {
  const cache = await caches.open(name);
  const hit = await cache.match(req);
  const fresh = fetch(fetchReq || req)
    .then(async (res) => {
      if (cacheable(res)) {
        await cache.put(req, res.clone());
        if (max) await trim(name, max);
      }
      return res;
    })
    .catch(() => undefined);
  if (hit) {
    event.waitUntil(fresh);
    return hit;
  }
  return (await fresh) || Response.error();
}

async function navigate(event) {
  const req = event.request;
  try {
    const res = (await event.preloadResponse) || (await fetch(req));
    if (res.ok && res.type === "basic") {
      const copy = res.clone();
      const url = new URL(req.url);
      event.waitUntil(
        (async () => {
          const target = url.pathname === "/" ? SHELL : RUNTIME;
          await (await caches.open(target)).put(url.pathname === "/" ? "/" : req, copy);
          if (target === RUNTIME) await trim(RUNTIME, 40);
        })(),
      );
    }
    return res;
  } catch {
    return (
      (await caches.match(req, { ignoreSearch: true })) ||
      (await caches.match("/")) ||
      new Response("Offline", { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } })
    );
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  // Uploads, audits and anything else that changes state go straight to the network.
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (url.origin === "https://fonts.googleapis.com") {
    // Ask for a CORS copy so the cache holds a readable (not padded, opaque) response.
    const corsReq = new Request(req.url, { mode: "cors", credentials: "omit" });
    event.respondWith(staleWhileRevalidate(event, req.url, FONTS, 20, corsReq));
    return;
  }
  if (url.origin === "https://fonts.gstatic.com") {
    event.respondWith(cacheFirst(req, FONTS, 80));
    return;
  }
  if (url.origin !== self.location.origin) return;

  const path = url.pathname;
  if (path.startsWith("/api/")) {
    if (path === "/api/v1/reports") {
      event.respondWith(networkFirst(event, req, RUNTIME, 40));
    }
    // /api/audit, /api/speak and the rest: network only.
    return;
  }

  // Next.js client navigations fetch RSC payloads; let them fail over to a full page load.
  if (req.headers.get("RSC") || url.searchParams.has("_rsc")) return;

  if (req.mode === "navigate") {
    event.respondWith(navigate(event));
    return;
  }
  if (path.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(req, STATIC, 150));
    return;
  }
  if (
    path.startsWith("/samples/") ||
    path.startsWith("/icons/") ||
    path === "/india-states.json" ||
    path === "/manifest.webmanifest" ||
    path === "/icon.svg" ||
    path.startsWith("/apple-icon")
  ) {
    event.respondWith(staleWhileRevalidate(event, req, SHELL));
  }
});
