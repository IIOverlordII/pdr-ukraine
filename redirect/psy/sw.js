// Psychoprofile moved to https://iioverlordii.github.io/The-connection-between-us/.
// Replaces the old offline worker at /pdr-ukraine/psy/: drops its cache, unregisters itself
// and sends open tabs to the new address. Only "psy-" caches are touched — PDR uses "pdr-ua-",
// the new app uses "connection-".
const TARGET = 'https://iioverlordii.github.io/The-connection-between-us/';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('psy-')).map(k => caches.delete(k)));
    await self.registration.unregister();
    const tabs = await self.clients.matchAll({ type: 'window' });
    await Promise.all(tabs.map(c => c.navigate(TARGET + new URL(c.url).hash).catch(() => null)));
  })());
});
