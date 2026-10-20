/// <reference types="vitest/config" />
import { createHash } from 'node:crypto';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Writes dist/sw.js with a precache list of every file in the build, so the
 * installed app works offline without a service-worker dependency.
 */
function serviceWorker(): Plugin {
  return {
    name: 'tempo-service-worker',
    apply: 'build',
    generateBundle(_options, bundle) {
      const publicFiles = [
        '/manifest.webmanifest',
        '/favicon.svg',
        '/icons/icon-192.png',
        '/icons/icon-512.png',
        '/icons/icon-maskable-512.png',
        '/icons/apple-touch-icon.png',
      ];
      const built = Object.keys(bundle)
        .filter((file) => !file.endsWith('.map'))
        .map((file) => `/${file}`);
      const precache = ['/', ...built, ...publicFiles];
      const version = createHash('sha256').update(precache.join('\n')).digest('hex').slice(0, 10);
      const source = `// Generated at build time by vite.config.ts. Do not edit.
const CACHE = 'tempo-${version}';
const PRECACHE = ${JSON.stringify(precache, null, 2)};

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  // Pages: try the network so updates arrive, fall back to the cached app shell offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html').then((r) => r || caches.match('/'))),
    );
    return;
  }

  // Built assets have hashed names, so the cached copy is always correct.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});
`;
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

export default defineConfig({
  plugins: [react(), serviceWorker()],
  css: {
    modules: { localsConvention: 'camelCaseOnly' },
  },
  build: {
    sourcemap: true,
    target: 'es2022',
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
    restoreMocks: true,
    testTimeout: 20000,
  },
});
