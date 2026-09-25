import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icon.svg'],
      devOptions: {
        enabled: true,
        navigateFallback: '/index.html',
      },
      manifest: {
        name: 'Gabayan',
        short_name: 'Gabayan',
        description: 'Your guide to better fish farming.',
        theme_color: '#075985',
        background_color: '#f5fafb',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        lang: 'en-PH',
        categories: ['education', 'productivity'],
        icons: [
          {
            src: '/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern:
              /^https?:\/\/[^/]+\/api\/v1\/(?:species|culture-environments|compatibility)(?:\/[^?]*)?(?:\?.*)?$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'gabayan-reference-data',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          {
            urlPattern:
              /^https?:\/\/[^/]+\/api\/v1\/(?:dashboard|cultivations|tasks|notifications|weather-alerts|products|product-categories|orders)(?:\/[^?]*)?(?:\?.*)?$/,
            method: 'GET',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'gabayan-operational-data',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 12 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@core': fileURLToPath(new URL('./src/core', import.meta.url)),
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@stores': fileURLToPath(new URL('./src/stores', import.meta.url)),
      '@layouts': fileURLToPath(new URL('./src/layouts', import.meta.url)),
      '@router': fileURLToPath(new URL('./src/router', import.meta.url)),
      '@pages': fileURLToPath(new URL('./src/pages', import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
})
