import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        // ✅ FIXED: manualChunks as a FUNCTION instead of object
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'react-vendor';
            }
            if (id.includes('lucide-react') || id.includes('react-hot-toast') || id.includes('recharts')) {
              return 'ui-vendor';
            }
            if (id.includes('socket.io-client')) {
              return 'socket-vendor';
            }
          }
        }
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://atm-case-management.onrender.com',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'https://atm-case-management.onrender.com',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  preview: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'https://atm-case-management.onrender.com',
        changeOrigin: true,
      },
    },
  },
})