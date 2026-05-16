import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// In dev, serve /privacy-policy and /terms as static HTML out of public/,
// matching the Express server's behavior in production.
function legalStaticPagesPlugin(): Plugin {
  const routes: Record<string, string> = {
    '/privacy-policy': 'privacy-policy.html',
    '/terms': 'terms.html',
  }
  return {
    name: 'legal-static-pages',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url || '').split('?')[0]
        const fileName = url ? routes[url] : undefined
        if (!fileName) return next()
        const filePath = path.resolve(__dirname, 'public', fileName)
        if (!fs.existsSync(filePath)) return next()
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        fs.createReadStream(filePath).pipe(res)
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), legalStaticPagesPlugin()],
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
