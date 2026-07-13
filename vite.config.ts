import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/P5R-Fusion-Planner/',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor';
          // Large static data files rarely change — split for cache efficiency
          if (id.includes('/src/data/')) return 'data';
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'P5R Fusion Planner',
        short_name: 'P5R Fusion',
        description: 'Persona 5 Royal fusion calculator and chain planner',
        theme_color: '#e60012',
        background_color: '#0d0d0d',
        display: 'standalone',
        start_url: '/P5R-Fusion-Planner/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
})
