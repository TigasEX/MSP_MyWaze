/**
 * router/index.js
 * 
 * Vue Router configuration for the MyWaze application.
 * Defines application routes and navigation structure with client-side routing
 * for single-page application functionality.
 * 
 * Key Features:
 * - Vue Router 4 integration with Vue 3 Composition API
 * - HTML5 History API for clean URLs without hash fragments
 * - Lazy loading for non-critical routes to optimize initial bundle size
 * - Home page as primary application interface
 * - Test API page for development and debugging purposes
 * 
 * Route Structure:
 * - '/' (Home): Main application interface with map and navigation
 * - '/test-api' (TestApi): Development interface for API testing
 * 
 * Router Configuration:
 * - History mode for SEO-friendly URLs
 * - Automatic code splitting for lazy-loaded components
 * - Clean navigation structure for maintainable routing
 * 
 * Future Enhancements:
 * - Route guards for authentication protection
 * - Dynamic route parameters for deep linking
 * - Navigation guards for unsaved changes
 * - Route-based meta information for page titles
 * 
 * @module router
 * @author André Gaspar - 59859, João Lima - 60350, Marisa Basílio - 54550, Pedro Afonso - 70357, Tiago Sequeira - 55354 - MSP 2024/2025 FCT Nova
 * @since 1.0.0
 */

import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/views/HomePage.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomePage
  },
  {
    path: '/test-api',
    name: 'TestApi',
    component: () => import('@/TestApiPage.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
