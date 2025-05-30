/**
 * App.vue
 * 
 * Root Vue component for the MyWaze navigation application.
 * Provides the main application layout with navigation structure
 * and router view for dynamic component rendering.
 * 
 * Key Features:
 * - Root application component serving as layout foundation
 * - Top-level navigation with router links for main sections
 * - Router view for dynamic page component rendering
 * - Global styling foundation for consistent application appearance
 * - Responsive design structure for cross-device compatibility
 * 
 * Component Structure:
 * - Navigation bar with links to Home and API Test pages
 * - Router view for dynamic content based on current route
 * - Clean, minimal layout focusing on content areas
 * - Global CSS reset and typography configuration
 * 
 * Navigation:
 * - Home link: Primary application interface with map and features
 * - API Test link: Development interface for backend testing
 * - Router-based navigation with Vue Router integration
 * 
 * Styling:
 * - Global CSS reset for consistent cross-browser rendering
 * - Modern font stack with Arial fallback
 * - Dark navigation bar with professional appearance
 * - Flexible layout structure for responsive design
 * 
 * @component App
 * @author André Gaspar - 59859, João Lima - 60350, Marisa Basílio - 54550, Pedro Afonso - 70357, Tiago Sequeira - 55354 - MSP 2024/2025 FCT Nova
 * @since 1.0.0
 */

<template>
  <div id="app">
    <nav class="app-nav">
      <router-link to="/" class="nav-link">Home</router-link>
      <router-link to="/test-api" class="nav-link">API Test</router-link>
    </nav>
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App',
}
</script>

<style>
/* Add global styles here if needed */
body {
  margin: 0;
  padding: 0;
  font-family: Arial, sans-serif;
}

.app-nav {
  background: #333;
  padding: 15px;
  display: flex;
  gap: 15px;
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 5px 10px;
  border-radius: 4px;
}

.nav-link:hover, .router-link-active {
  background: rgba(255, 255, 255, 0.2);
}
</style>
