import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: false, filename: 'dist/stats.html' }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['avatar.svg', 'robots.txt', 'sitemap.xml', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'Pixel Normal Edit',
        short_name: 'PixelEdit',
        description: 'Professional and free online Pixel Art editor and drawing tool.',
        theme_color: '#1e1e24',
        background_color: '#1e1e24',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Không precache HTML và không dùng navigateFallback: mọi điều hướng
        // (kể cả click từ Google, bookmark) luôn lấy index.html mới nhất từ
        // network. HTML được server trả với Cache-Control: no-cache, còn
        // JS/CSS có hash vẫn được precache nên không ảnh hưởng tốc độ.
        globPatterns: ['**/*.{js,css,ico,png,svg,wasm}'],
        navigateFallback: null,
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 20000000 // 20MB for WebAssembly or large files
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'unsafe-none',
      'Cross-Origin-Embedder-Policy': 'unsafe-none'
    }
  }
})
