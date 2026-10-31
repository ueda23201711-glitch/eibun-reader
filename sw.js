// 英文リーダー用 Service Worker（iOS 9 では使われない。新しい端末でのオフライン起動用）
// ドライブ動画の中継（字幕プレイヤー player.html 用。./__drive__?... を受け持つ）。先に読み込むので、こちらが先に応答する
importScripts("./drive-sw.js");
const CACHE = "eibun-reader-v119";
const ASSETS = ["./", "./index.html", "./player.html", "./lock.js", "./fileshare.js", "./app-v2.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon-180.png", "./icons/favicon-32.png", "./vendor/ejdict/phrases.json", "./vendor/qrcode.js", "./vendor/jsQR.js"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("eibun-reader-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // Firebase・翻訳には関与しない
  if (/\/__drive__$/.test(url.pathname)) return;   // 中継（drive-sw.js）が受け持つ
  if (req.mode === "navigate") {
    const page = /\/player\.html$/.test(url.pathname) ? "./player.html" : "./index.html";   // 字幕プレイヤー（player.html）は別に置く
    event.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(page, copy)); return res; })
        .catch(() => caches.match(page).then((c) => c || caches.match("./index.html")))
    );
    return;
  }
  if (url.pathname.endsWith(".webmanifest")) { event.respondWith(fetch(req, { cache: "no-cache" }).catch(() => caches.match(req))); return; }
  // 辞書などは一度読んだら手元に置く
  event.respondWith(caches.match(req).then((c) => c || fetch(req).then((res) => {
    if (res.ok && url.pathname.indexOf("/vendor/") >= 0) { const copy = res.clone(); caches.open(CACHE).then((cc) => cc.put(req, copy)); }
    return res;
  })));
});
