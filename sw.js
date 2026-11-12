// 英文リーダー用 Service Worker（iOS 9 では使われない。新しい端末でのオフライン起動用）
// ドライブ動画の中継（字幕プレイヤー player.html 用。./__drive__?... を受け持つ）。先に読み込むので、こちらが先に応答する
importScripts("./drive-sw.js");
// この端末に取り込んだ動画を、少しずつ <video> に渡す（./__local__）。メモリの少ない iPhone で落ちないように
importScripts("./local-sw.js");
const CACHE = "eibun-reader-v208";
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
  if (/\/__drive__$/.test(url.pathname) || /\/__local__$/.test(url.pathname)) return;   // 中継（drive-sw.js）が受け持つ
  if (req.mode === "navigate") {
    const page = /\/player\.html$/.test(url.pathname) ? "./player.html" : "./index.html";   // 字幕プレイヤー（player.html）は別に置く
    // ネットが遅い・つながりにくいとき（電波の弱い所など）、2.5 秒待っても返事がなければ手元の版ですぐ開く。
    // （字幕プレイヤー ⇄ 英文リーダーの切り替えで「押しても戻らない」ことがないように。新しい版はその後で手元に入る）
    const net = fetch(req, { cache: "no-cache" })   // GitHub Pages の10分キャッシュで古い版が出ないように
      .then((res) => { if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(page, copy)); } return res; });
    const cached = () => caches.match(page).then((c) => c || caches.match("./index.html"));
    event.respondWith(new Promise((resolve) => {
      let done = false;
      const fin = (r) => { if (!done && r) { done = true; resolve(r); } };
      const t = setTimeout(() => { cached().then((c) => { if (c) fin(c); }); }, 2500);
      net.then((r) => { clearTimeout(t); fin(r); }).catch(() => { clearTimeout(t); cached().then((c) => fin(c || Response.error())); });
    }));
    event.waitUntil(net.catch(() => {}));
    return;
  }
  if (url.pathname.endsWith(".webmanifest")) { event.respondWith(fetch(req, { cache: "no-cache" }).catch(() => caches.match(req))); return; }
  // 辞書などは一度読んだら手元に置く
  event.respondWith(caches.match(req).then((c) => c || fetch(req).then((res) => {
    if (res.ok && url.pathname.indexOf("/vendor/") >= 0) { const copy = res.clone(); caches.open(CACHE).then((cc) => cc.put(req, copy)); }
    return res;
  })));
});
