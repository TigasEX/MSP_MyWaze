/**
 * main.js
 * 
 * Application entry point for the MyWaze navigation application.
 * Initializes Vue 3 application instance with router configuration
 * and mounts the application to the DOM.
 * 
 * Key Features:
 * - Vue 3 application initialization with Composition API
 * - Vue Router integration for client-side navigation
 * - Clean application bootstrapping and configuration
 * - DOM mounting to #app element for single-page application
 * 
 * Application Structure:
 * - Creates Vue application instance from root App component
 * - Configures Vue Router for navigation management
 * - Mounts application to HTML element with id="app"
 * - Provides foundation for reactive state management and routing
 * 
 * Dependencies:
 * - Vue 3 framework with Composition API
 * - Vue Router 4 for client-side routing
 * - App.vue as root application component
 * - Router configuration from ./router/index.js
 * 
 * @module main
 * @author André Gaspar - 59859, João Lima - 60350, Marisa Basílio - 54550, Pedro Afonso - 70357, Tiago Sequeira - 55354 - MSP 2024/2025 FCT Nova
 * @since 1.0.0
 */

import { createApp } from 'vue'
import router from './router'
import App from './App.vue'

// Create the app
const app = createApp(App)

// Use the router
app.use(router)

// Mount the app
app.mount('#app')
