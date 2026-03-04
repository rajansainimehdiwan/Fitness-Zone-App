import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use a relative base path to ensure Vercel and other hosts 
  // can resolve your /src/main.jsx and assets correctly.
  base: './', 
  build: {
    // This ensures your production build matches the 
    // expected folder structure for deployment.
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    // Optional: ensures the local dev server remains stable
    port: 5173,
    strictPort: true,
  }
})