/* No Interpreter - offline cache. build: dc5a6c5189 */
const V = "no-interpreter-dc5a6c5189";
const CORE = ["./", "./index.html", "./manifest.webmanifest",
              "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  /* 페이지 이동은 network-first - 새 판본이 바로 반영된다 */
  if (req.mode === "navigate") {
    e.respondWith(fetch(req)
      .then(res => { const c = res.clone(); caches.open(V).then(x => x.put("./index.html", c)); return res; })
      .catch(() => caches.match("./index.html")));
    return;
  }

  /* 나머지(아이콘·웹폰트)는 cache-first */
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    const c = res.clone();
    caches.open(V).then(x => { try { x.put(req, c); } catch (err) {} });
    return res;
  }).catch(() => hit)));
});
