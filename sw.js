const CACHE_NAME = "deep-sea-v1";

const FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./sketch.js",
  "./p5.js",
  "./p5.sound.min.js",
  "./manifest.webmanifest"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});