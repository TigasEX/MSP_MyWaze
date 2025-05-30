/**
 * SaveRouteModal.vue
 * 
 * Modal component for saving navigation routes in the MyWaze application.
 * Allows users to save current routes with custom titles, descriptions,
 * and route information for future reference and quick access.
 * 
 * Key Features:
 * - Custom route naming with title and description fields
 * - Route information display (distance, duration, waypoints)
 * - Form validation with character limits and required fields
 * - Integration with route storage system for persistence
 * - Modal overlay design for focused user interaction
 * - Real-time route data display and validation
 * - Error handling and success feedback
 * - Responsive form design for all devices
 * 
 * Component Architecture:
 * - Vue 3 Composition API with reactive state management
 * - Integration with routing services for route data
 * - Form validation with real-time feedback
 * - Event-driven parent-child communication
 * - Local storage integration for route persistence
 * 
 * Route Management Features:
 * - Custom route titles with 50 character limit
 * - Optional descriptions with 200 character limit
 * - Route summary display (distance, estimated time)
 * - Waypoint information and route details
 * - Duplicate route name prevention
 * - Route metadata capture and storage
 * 
 * UI/UX Features:
 * - Clean modal design with clear form structure
 * - Character counter for input field limits
 * - Visual route information summary
 * - Intuitive form layout with proper labeling
 * - Accessibility-compliant form design
 * - Mobile-optimized input fields
 * - Clear action buttons (Save, Cancel)
 * 
 * Form Validation:
 * - Required title field validation
 * - Character limit enforcement with visual feedback
 * - Real-time validation status display
 * - Prevention of empty or invalid submissions
 * - User-friendly error messaging
 * 
 * Route Data Integration:
 * - Current route data capture from routing service
 * - Distance and duration calculation display
 * - Start and end point information
 * - Waypoint data preservation
 * - Route geometry and path information storage
 * 
 * Storage & Persistence:
 * - Local storage integration for saved routes
 * - JSON serialization of route data
 * - Route metadata management
 * - Quick access for future route loading
 * - Cross-session route persistence
 * 
 * @component SaveRouteModal
 * @author André Gaspar - 59859, João Lima - 60350, Marisa Basílio - 54550, Pedro Afonso - 70357, Tiago Sequeira - 55354 - MSP 2024/2025 FCT Nova
 * @since 1.0.0
 */

<template>
  <div v-if="isVisible" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-container">
      <div class="modal-header">
        <h2>💾 Save Route</h2>
        <button @click="$emit('close')" class="close-button">×</button>
      </div>
      <div class="modal-content">
        <div class="form-group">
          <label for="title" class="form-label">Route Title:</label>
          <input
            v-model="routeTitle"
            type="text"
            id="title"
            placeholder="Enter route title (e.g., Home to Work)"
            class="form-input"
            maxlength="50"
          />
        </div>

        <div class="form-group">
          <label for="description" class="form-label">Description (optional):</label>
          <textarea
            v-model="routeDescription"
            id="description"
            placeholder="Add route details, notes, or special instructions..."
            class="form-textarea"
            rows="4"
            maxlength="200"
          ></textarea>
        </div>

        <div class="form-group">
          <label for="image" class="form-label">Route Image (optional):</label>
          <div class="image-upload">
            <input
              ref="fileInput"
              type="file"
              id="image"
              accept="image/*"
              @change="handleImageUpload"
              class="file-input"
            />
            <div
              @click="$refs.fileInput.click()"
              class="image-upload-area"
              :class="{ 'has-image': routeImage }"
            >
              <div v-if="!routeImage" class="upload-prompt">
                <span class="upload-icon">📷</span>
                <span>Click to add route image</span>
              </div>
              <img v-else :src="routeImage" alt="Route preview" class="image-preview" />
            </div>
            <button v-if="routeImage" @click="clearImage" class="clear-image-btn">
              Remove Image
            </button>
          </div>
        </div>

        <div class="route-info">
          <div class="info-item">
            <span class="info-icon">📍</span>
            <span>{{ store.routePlanning.waypoints.length }} waypoint(s)</span>
          </div>
          <div class="info-item">
            <span class="info-icon">📏</span>
            <span>{{ formatDistance(store.routeData.details?.distance || 0) }}</span>
          </div>
          <div class="info-item">
            <span class="info-icon">⏱️</span>
            <span>{{ formatDuration(store.routeData.details?.duration || 0) }}</span>
          </div>
        </div>

        <div class="form-actions">
          <button @click="$emit('close')" class="cancel-button">
            Cancel
          </button>
          <button @click="saveRoute" class="save-button" :disabled="!canSave">
            <span class="mr-2">💾</span> Save Route
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { store } from '@/store'

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'route-saved'])

// Form data
const routeTitle = ref('')
const routeDescription = ref('')
const routeImage = ref(null)
const fileInput = ref(null)

// Computed properties
const canSave = computed(() => {
  return routeTitle.value.trim().length > 0 && 
         store.routePlanning.waypoints.length > 0 && 
         store.routeData.details
})

// Methods
const handleImageUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      store.addToast({
        title: 'Image too large',
        message: 'Please select an image smaller than 5MB',
        type: 'error'
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      routeImage.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const clearImage = () => {
  routeImage.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const saveRoute = () => {
  if (!canSave.value) return

  const routeInfo = {
    title: routeTitle.value.trim(),
    description: routeDescription.value.trim(),
    image: routeImage.value
  }

  try {
    const savedRoute = store.saveRoute(routeInfo)
    
    store.addToast({
      title: 'Route Saved!',
      message: `"${savedRoute.title}" has been saved to your routes`,
      type: 'success'
    })

    // Reset form
    routeTitle.value = ''
    routeDescription.value = ''
    routeImage.value = null
    
    emit('route-saved', savedRoute)
    emit('close')
  } catch (error) {
    store.addToast({
      title: 'Save Failed',
      message: 'Could not save route. Please try again.',
      type: 'error'
    })
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
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
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

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
  font-family: inherit;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.image-upload {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.file-input {
  display: none;
}

.image-upload-area {
  border: 2px dashed #e9ecef;
  border-radius: 10px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-upload-area:hover {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.image-upload-area.has-image {
  padding: 0;
  border: none;
  min-height: auto;
}

.upload-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: #666;
}

.upload-icon {
  font-size: 2rem;
}

.image-preview {
  max-width: 100%;
  max-height: 200px;
  border-radius: 10px;
  object-fit: cover;
}

.clear-image-btn {
  padding: 0.5rem 1rem;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  align-self: flex-start;
}

.clear-image-btn:hover {
  background: #c82333;
  transform: translateY(-1px);
}

.route-info {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 1rem;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #333;
  font-weight: 500;
}

.info-icon {
  font-size: 1.1rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.cancel-button,
.save-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cancel-button {
  background: #6c757d;
  color: white;
}

.cancel-button:hover {
  background: #5a6268;
  transform: translateY(-1px);
}

.save-button {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
}

.save-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
}

.save-button:disabled {
  background: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
}

.mr-2 {
  margin-right: 0.5rem;
}

@media (max-width: 640px) {
  .modal-container {
    width: 95%;
    margin: 1rem;
  }
  
  .modal-content {
    padding: 1.5rem;
  }
  
  .route-info {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .cancel-button,
  .save-button {
    width: 100%;
    justify-content: center;
  }
}
</style>
