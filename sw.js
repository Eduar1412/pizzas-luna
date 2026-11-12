// Guarda la app en el teléfono para que abra sin internet.
const CACHE = "pizzas-luna-v10";
const ARCHIVOS = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable.png", "apple-touch-icon.png", "logo.jpg"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // La página: intenta traer la versión nueva, y sin internet usa la guardada.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req, { cache: "no-store" })
        .then((r) => { const copia = r.clone(); caches.open(CACHE).then((c) => c.put("index.html", copia)); return r; })
        .catch(() => caches.match("index.html"))
    );
    return;
  }

  // Íconos, fuentes y demás: primero lo guardado, luego la red.
  if (url.origin === location.origin || url.host.endsWith("fonts.googleapis.com") || url.host.endsWith("fonts.gstatic.com")) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((r) => {
        if (r && (r.ok || r.type === "opaque")) { const copia = r.clone(); caches.open(CACHE).then((c) => c.put(req, copia)); }
        return r;
      }))
    );
  }
});
