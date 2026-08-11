import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const { version } = JSON.parse(readFileSync('./package.json', 'utf8')) as { version: string }

// https://vitejs.dev/config/
export default defineConfig({
  // Shown on the Profile screen, so you can tell which build someone is running.
  define: { __APP_VERSION__: JSON.stringify(version) },
  plugins: [
    react(),
    VitePWA({
      // 'prompt' so a new deploy surfaces an Update button instead of reloading
      // underneath someone who is halfway through marking their attendance.
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: '75 Attendance Tracker',
        short_name: '75',
        description: 'Track your college attendance. Stay above the line.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0a0a0a',
        theme_color: '#0a0a0a',
        categories: ['education', 'productivity'],
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2}'],
        navigateFallback: '/index.html',
        // Let Firebase Auth/Firestore network calls pass through to the network.
        navigateFallbackDenylist: [/^\/__/, /\/[^/?]+\.[^/]+$/],
        // The waiting worker must NOT skip waiting on its own, or it would
        // activate before the student taps Update and the prompt would be
        // pointless. Tapping Update posts SKIP_WAITING and reloads.
        clientsClaim: true,
        skipWaiting: false,
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
})
