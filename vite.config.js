import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables or use defaults
  const env = loadEnv(mode, process.cwd(), '')
  
  // Default API keys if not defined in .env file
  const OPENROUTE_API_KEY = env.VITE_OPENROUTE_API_KEY || '5b3ce3597851110001cf6248367b86bb45f4468cb4c2fa4ebb0dfc05'
  
  return {
    plugins: [vue(), vueDevTools()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      cors: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      proxy: {
        '/osrm-api': {
          target: 'https://router.project-osrm.org',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/osrm-api/, ''),
          secure: true,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('OSRM Proxy error:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('OSRM Proxy request:', req.method, req.url);
              proxyReq.setHeader('User-Agent', 'MyWazeApp/1.0');
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('OSRM Proxy response:', proxyRes.statusCode, req.url);
            });
          }
        },
        '/ors-api': {
          target: 'https://api.openrouteservice.org',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ors-api/, ''),
          secure: true,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('Proxy error:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Proxy request:', req.method, req.url);
              
              // Make sure the Content-Type header is properly set for all requests
              if (!proxyReq.getHeader('Content-Type') && req.method !== 'GET') {
                proxyReq.setHeader('Content-Type', 'application/json; charset=utf-8');
              }
              
              // Make sure the Accept header is properly set for all requests
              if (!proxyReq.getHeader('Accept')) {
                proxyReq.setHeader('Accept', 'application/json, application/geo+json, application/gpx+xml');
              }
              
              // If we have the Authorization header from client, pass it through
              if (req.headers.authorization) {
                proxyReq.setHeader('Authorization', req.headers.authorization);
              } else if (OPENROUTE_API_KEY) {
                // Set API key if not set from client
                proxyReq.setHeader('Authorization', `Bearer ${OPENROUTE_API_KEY}`);
              }
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Proxy response:', proxyRes.statusCode, req.url);
            });
          }
        }
      },
    },
    define: {
      // Make API keys available throughout the app
      'import.meta.env.VITE_OPENROUTE_API_KEY': JSON.stringify(OPENROUTE_API_KEY),
    },
  }
})
