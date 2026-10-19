// sw.js — オフライン用の小さな補助ファイル（motion-analysis.html と同じ場所に置く）
// 役割：電波がないとき、端末に保存したツール本体（画面）を表示する。
// 電波があるときは、いつも最新の画面を取りに行き、保存分も更新する。
const SHELL = 'motion-shell-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || req.mode !== 'navigate') return;   // 画面を開く操作だけを扱う
  e.respondWith((async () => {
    const cache = await caches.open(SHELL);
    try {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 4000);          // 電波が弱くて待たされるときは、4秒で保存分に切り替える
      const res = await fetch(req, { signal: ctl.signal });
      clearTimeout(timer);
      if (res && res.ok) cache.put(req.url.split('#')[0], res.clone()).catch(() => {});
      return res;
    } catch (err) {
      const hit = await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;
      const keys = await cache.keys();
      if (keys.length) return cache.match(keys[0]);
      throw err;
    }
  })());
});
