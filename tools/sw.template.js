// Згенеровано tools/build.py — не редагуйте вручну.
// Код і дані — у кеші pdr-ua-<версія>; картинки — у pdr-img-<версія картинок>,
// тож оновлення коду не завантажує заново ~20 МБ ілюстрацій.
const CACHE = 'pdr-ua-__VERSION__';
const IMG_CACHE = 'pdr-img-__IMG_VERSION__';
const FILES = __FILES__;
const IMAGES = __IMAGES__;
const DONE = './__images-complete__';

async function fillImages() {
  const c = await caches.open(IMG_CACHE);
  if (await c.match(DONE)) return;
  // переносимо незмінні картинки зі старих кешів, решту завантажуємо
  const old = (await caches.keys()).filter(k => k.startsWith('pdr-') && k !== IMG_CACHE && k !== CACHE);
  const missing = [];
  for (const f of IMAGES) {
    if (await c.match(f)) continue;
    let hit = null;
    for (const k of old) { hit = await (await caches.open(k)).match(f); if (hit) break; }
    if (hit) await c.put(f, hit); else missing.push(f);
  }
  for (let i = 0; i < missing.length; i += 40) await c.addAll(missing.slice(i, i + 40));
  await c.put(DONE, new Response('1'));
}

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(fillImages).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('pdr-') && k !== CACHE && k !== IMG_CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request)));
});
