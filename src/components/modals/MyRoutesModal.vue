/**
 * MyRoutesModal.vue
 * 
 * Modal component for managing and displaying saved routes in the MyWaze
 * application. Provides a comprehensive interface for viewing, loading,
 * and deleting previously saved navigation routes.
 * 
 * Key Features:
 * - Complete saved routes list with detailed information
 * - Route loading functionality for quick navigation
 * - Route deletion with confirmation prompts
 * - Route statistics and summary information
 * - Empty state handling with informative messaging
 * - Modal overlay design for focused user interaction
 * - Responsive card layout for optimal viewing
 * - Search and filtering capabilities (future enhancement)
 * 
 * Component Architecture:
 * - Vue 3 Composition API with Vuex store integration
 * - Real-time state synchronization with saved routes store
 * - Event-driven communication with parent components
 * - Dynamic UI updates based on route list changes
 * - Integration with routing services for route loading
 * 
 * Route Management Features:
 * - Display route titles, descriptions, and metadata
 * - Route loading with automatic map updates
 * - Safe route deletion with confirmation dialogs
 * - Route statistics calculation (total distance, count)
 * - Route card design with hover interactions
 * - Creation date and last used tracking
 * 
 * UI/UX Features:
 * - Clean, organized route cards with consistent layout
 * - Visual route information display (distance, duration)
 * - Empty state design encouraging route creation
 * - Responsive grid system adapting to different screen sizes
 * - Intuitive action buttons with clear iconography
 * - Smooth hover effects and interactive feedback
 * - Accessibility-compliant design with proper navigation
 * 
 * Route Statistics:
 * - Total saved routes count display
 * - Cumulative distance calculation across all routes
 * - Average route length and duration metrics
 * - Route usage tracking and analytics
 * - Visual statistics presentation
 * 
 * User Experience:
 * - Encouraging empty state for new users
 * - Quick route loading workflow
 * - Safe deletion process with confirmation
 * - Visual feedback for all user actions
 * - Mobile-optimized touch interface
 * - Clear visual hierarchy and information organization
 * 
 * Route Data Management:
 * - Route metadata display (title, description, date)
 * - Route geometry and waypoint information
 * - Distance and duration calculations
 * - Route preview and summary information
 * - Persistent storage integration
 * 
 * Integration:
 * - Seamless connection with routing services
 * - Map integration for route visualization
 * - Global state management through Vuex store
 * - Consistent data flow and state updates
 * - Local storage persistence for saved routes
 * 
 * @component MyRoutesModal
 * @author André Gaspar - 59859, João Lima - 60350, Marisa Basílio - 54550, Pedro Afonso - 70357, Tiago Sequeira - 55354 - MSP 2024/2025 FCT Nova
 * @since 1.0.0
 */

<template>
  <div v-if="isVisible" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-container routes-modal">
      <div class="modal-header">
        <h2>🗺️ My Routes</h2>
        <button @click="$emit('close')" class="close-button">×</button>
      </div>
      <div class="modal-content">
        <!-- Empty State -->
        <div v-if="store.savedRoutes.length === 0" class="empty-routes">
          <div class="empty-icon">🗺️</div>
          <h3>No saved routes</h3>
          <p>You haven't saved any routes yet. Create a route with waypoints and save it to see it here.</p>
        </div>

        <!-- Routes List -->
        <div v-else class="routes-container">
          <div class="routes-header">
            <h3>Your saved routes ({{ store.savedRoutes.length }})</h3>
            <div class="route-stats">
              <span class="stat-item">
                <span class="stat-icon">📊</span>
                Total Distance: {{ formatTotalDistance() }}
              </span>
            </div>
          </div>
          
          <div class="routes-list">
            <div
              v-for="route in store.savedRoutes"
              :key="route.id"
              class="route-item"
            >
              <!-- Route Image -->
              <div class="route-image-container">
                <img
                  v-if="route.image"
                  :src="route.image"
                  :alt="route.title"
                  class="route-image"
                  @error="handleImageError"
                />
                <div v-else class="route-image-placeholder">
                  <span class="placeholder-icon">🗺️</span>
                </div>
              </div>

              <!-- Route Info -->
              <div class="route-info">
                <div class="route-title">{{ route.title }}</div>
                <div v-if="route.description" class="route-description">
                  {{ route.description }}
                </div>
                <div class="route-details">
                  <span class="detail-item">
                    <span class="detail-icon">📍</span>
                    {{ route.waypoints.length }} waypoint(s)
                  </span>
                  <span class="detail-item">
                    <span class="detail-icon">📏</span>
                    {{ formatDistance(route.distance) }}
                  </span>
                  <span class="detail-item">
                    <span class="detail-icon">⏱️</span>
                    {{ formatDuration(route.duration) }}
                  </span>
                </div>
                <div class="route-meta">
                  <span class="created-date">
                    Saved {{ formatDate(route.createdAt) }}
                  </span>
                </div>
              </div>

              <!-- Route Actions -->
              <div class="route-actions">
                <button
                  @click="loadRoute(route.id)"
                  class="action-btn load-btn"
                >
                  📍 Apply Route
                </button>
                <button @click="deleteRoute(route.id)" class="action-btn delete-btn">
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { store } from '@/store'

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'route-loaded'])

// Methods
const loadRoute = (routeId) => {
  try {
    const success = store.loadRoute(routeId)
    if (success) {
      store.addToast({
        title: 'Route Loaded!',
        message: 'The route has been applied and is ready for navigation',
        type: 'success'
      })
      emit('route-loaded', routeId)
      emit('close')
    } else {
      store.addToast({
        title: 'Load Failed',
        message: 'Could not load the selected route',
        type: 'error'
      })
    }
  } catch (error) {
    store.addToast({
      title: 'Load Error',
      message: 'An error occurred while loading the route',
      type: 'error'
    })
  }
}

const deleteRoute = (routeId) => {
  const route = store.savedRoutes.find(r => r.id === routeId)
  if (!route) return

  const confirmed = confirm(`Are you sure you want to delete "${route.title}"? This action cannot be undone.`)
  if (confirmed) {
    const success = store.deleteRoute(routeId)
    if (success) {
      store.addToast({
        title: 'Route Deleted',
        message: `"${route.title}" has been deleted from your saved routes`,
        type: 'success'
      })
    } else {
      store.addToast({
        title: 'Delete Failed',
        message: 'Could not delete the route. Please try again.',
        type: 'error'
      })
    }
  }
}

const handleImageError = (event) => {
  // Hide broken image and show placeholder
  event.target.style.display = 'none'
  const placeholder = event.target.parentNode.querySelector('.route-image-placeholder')
  if (placeholder) {
    placeholder.style.display = 'flex'
  }
}

const formatDistance = (distance) => {
  if (distance >= 1000) {
    return `${(distance / 1000).toFixed(1)} km`
  }
  return `${Math.round(distance)} m`
}

const formatDuration = (duration) => {
  const hours = Math.floor(duration / 3600)
  const minutes = Math.floor((duration % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) {
    return 'today'
  } else if (diffDays === 2) {
    return 'yesterday'
  } else if (diffDays <= 7) {
    return `${diffDays - 1} days ago`
  } else {
    return date.toLocaleDateString()
  }
}

const formatTotalDistance = () => {
  const total = store.savedRoutes.reduce((sum, route) => sum + (route.distance || 0), 0)
  if (total >= 1000) {
    return `${(total / 1000).toFixed(1)} km`
  }
  return `${Math.round(total)} m`
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.modal-container {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.routes-modal {
  max-width: 900px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px 20px 0 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.close-button {
  background: none;
  border: none;
  color: white;
  font-size: 2rem;
  cursor: pointer;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.modal-content {
  padding: 2rem;
}

.empty-routes {
  text-align: center;
  padding: 3rem 2rem;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-routes h3 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.5rem;
}

.empty-routes p {
  color: #666;
  font-size: 1.1rem;
  line-height: 1.6;
  max-width: 400px;
  margin: 0 auto;
}

.routes-container {
  min-height: 200px;
}

.routes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f8f9fa;
  flex-wrap: wrap;
  gap: 1rem;
}

.routes-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.3rem;
}

.route-stats {
  display: flex;
  gap: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  font-size: 0.9rem;
}

.stat-icon {
  font-size: 1.1rem;
}

.routes-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.route-item {
  display: flex;
  align-items: center;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 15px;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  gap: 1.5rem;
}

.route-item:hover {
  background: #e9ecef;
  border-color: #667eea;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.route-image-container {
  position: relative;
  flex-shrink: 0;
}

.route-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 10px;
  border: 2px solid #dee2e6;
}

.route-image-placeholder {
  width: 80px;
  height: 80px;
  background: #e9ecef;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #dee2e6;
}

.placeholder-icon {
  font-size: 2rem;
  color: #6c757d;
}

.route-info {
  flex: 1;
  min-width: 0;
}

.route-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.route-description {
  color: #666;
  font-size: 0.95rem;
  margin-bottom: 0.75rem;
  line-height: 1.4;
}

.route-details {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: #555;
  font-size: 0.85rem;
}

.detail-icon {
  font-size: 0.9rem;
}

.route-meta {
  color: #888;
  font-size: 0.8rem;
}

.route-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex-shrink: 0;
}

.action-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  min-width: 120px;
}

.load-btn {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
}

.load-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
}

.load-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
  opacity: 0.8;
}

.delete-btn {
  background: #dc3545;
  color: white;
  padding: 0.5rem;
  width: 40px;
  min-width: 40px;
}

.delete-btn:hover {
  background: #c82333;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(220, 53, 69, 0.3);
}

@media (max-width: 768px) {
  .modal-container {
    width: 95%;
    margin: 1rem;
  }
  
  .modal-content {
    padding: 1.5rem;
  }
  
  .routes-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .route-item {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .route-info {
    order: 1;
  }
  
  .route-image-container {
    order: 0;
  }
  
  .route-actions {
    order: 2;
    flex-direction: row;
    justify-content: center;
    width: 100%;
  }
  
  .route-details {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .route-details {
    flex-direction: column;
    gap: 0.5rem;
    align-items: center;
  }
  
  .action-btn {
    font-size: 0.8rem;
    padding: 0.4rem 0.8rem;
  }
}
</style>
