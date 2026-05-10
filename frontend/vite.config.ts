import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    host: true,
    
  },
  build: {
    outDir: process.env.VITE_BUILD_TARGET === 'static' ? 'dist' : '../public',
    emptyOutDir: true,
    sourcemap: false,
  },
})
