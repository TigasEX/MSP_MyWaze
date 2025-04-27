import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables or use defaults
  const env = loadEnv(mode, process.cwd(), '')
  
  // Default API keys if not defined in .env file
  const GOOGLE_MAPS_API_KEY = env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyCnEGAMvieNpzlk641s6HsbIsfVkydLOvI'
  const HERE_API_KEY = env.VITE_HERE_API_KEY || 'E8BluGNf-3wGQ2h_JF5OL2IPga_QKsaj4nmdrzLyhgg'
  
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
    },
    define: {
      // Make API keys available throughout the app
      'import.meta.env.VITE_GOOGLE_MAPS_API_KEY': JSON.stringify(GOOGLE_MAPS_API_KEY),
      'import.meta.env.VITE_HERE_API_KEY': JSON.stringify(HERE_API_KEY),
    },
  }
})
