import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'logo.png'],
      manifest: {
        name: 'MYLIFE',
        short_name: 'MYLIFE',
        description: 'Personal, College, Tasks and Money tracker stored locally on your device.',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        shortcuts: [
          {
            name: 'Add Task',
            short_name: 'Task',
            description: 'Quickly add a new task',
            url: '/#quick-task',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }]
          },
          {
            name: 'Add Expense',
            short_name: 'Expense',
            description: 'Log a new transaction',
            url: '/#quick-expense',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }]
          },
          {
            name: 'Add Note',
            short_name: 'Note',
            description: 'Write a quick note',
            url: '/#quick-note',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }]
          }
        ],
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
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      }
    })
  ]
});
