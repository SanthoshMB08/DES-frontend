import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// AUTHOR : ANKITH KUMAR [ https://www.ankith.dev  |  https//www.github.com/ankith-00 ]
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), VitePWA({
    registerType: 'prompt',
    injectRegister: false,

    pwaAssets: {
      disabled: false,
      config: true,
    },

    manifest: {
      name: 'onscreen-marking-frontend',
      short_name: 'osm',
      description: 'itz.ankith.sharma',
      theme_color: '#ffffff',
    },

    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      cleanupOutdatedCaches: true,
      clientsClaim: true,
    },

    devOptions: {
      enabled: true,   // true for install pwa-app
      navigateFallback: 'index.html',
      suppressWarnings: true,
      type: 'module',
    },
  })],
})