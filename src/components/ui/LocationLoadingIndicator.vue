/**
 * LocationLoadingIndicator.vue
 * 
 * Loading indicator component specifically designed for location-based operations
 * in the MyWaze application. Provides visual feedback during GPS location
 * acquisition and geolocation processes with an engaging animated interface.
 * 
 * Key Features:
 * - Full-screen overlay design for focused user attention
 * - Animated loading spinner with smooth rotation animation
 * - Location-specific iconography and messaging
 * - Non-blocking UI with semi-transparent background
 * - Responsive design optimized for all screen sizes
 * - Clean, modern aesthetic consistent with app design
 * - Conditional visibility based on loading state
 * 
 * Component Architecture:
 * - Simple prop-based visibility control
 * - Lightweight implementation with minimal dependencies
 * - CSS-based animations for optimal performance
 * - Fixed positioning for consistent overlay behavior
 * - Accessible design with proper contrast and visibility
 * 
 * UI/UX Features:
 * - Engaging spinning animation to indicate active processing
 * - Location pin icon (📍) for contextual relevance
 * - Clear, informative text messaging ("Getting your location...")
 * - Semi-transparent dark overlay to focus attention
 * - Centered layout for optimal visibility across devices
 * - Smooth appearance and animation for professional feel
 * 
 * Use Cases:
 * - GPS location acquisition during app initialization
 * - Geolocation requests for current position
 * - Address geocoding and reverse geocoding operations
 * - Location permission requests and processing
 * - Background location service initialization
 * 
 * Performance:
 * - CSS-only animations for smooth 60fps performance
 * - Minimal DOM impact with conditional rendering
 * - Optimized for mobile devices and touch interfaces
 * - Low memory footprint with efficient styling
 * 
 * @component LocationLoadingIndicator
 * @author André Gaspar - 59859, João Lima - 60350, Marisa Basílio - 54550, Pedro Afonso - 70357, Tiago Sequeira - 55354 - MSP 2024/2025 FCT Nova
 * @since 1.0.0
 */

<template>
  <div v-if="isVisible" class="loading-overlay">
    <div class="loading-container">
      <div class="loading-spinner">
        <div class="spinner"></div>
      </div>
      <div class="loading-text">
        <span class="loading-icon">📍</span>
        <span>Getting your location...</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isVisible: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(3px);
}

.loading-container {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  min-width: 280px;
  text-align: center;
}

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e3e3e3;
  border-top: 4px solid #245DDA;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.loading-icon {
  font-size: 1.5rem;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { 
    opacity: 1;
    transform: scale(1);
  }
  50% { 
    opacity: 0.7;
    transform: scale(1.1);
  }
}

/* Mobile responsiveness */
@media (max-width: 480px) {
  .loading-container {
    margin: 1rem;
    padding: 1.5rem;
    min-width: auto;
    width: calc(100% - 2rem);
  }
  
  .loading-text {
    font-size: 1rem;
  }
}
</style>
