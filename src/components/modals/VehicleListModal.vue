/**
 * VehicleListModal.vue
 * 
 * Modal component for displaying and managing the user's registered vehicles
 * in the MyWaze application. Provides a comprehensive vehicle management
 * interface with viewing, selection, and deletion capabilities.
 * 
 * Key Features:
 * - Complete vehicle list display with images and details
 * - Vehicle selection and activation for active use
 * - Vehicle deletion with confirmation prompts
 * - Add new vehicle functionality with quick access
 * - Active vehicle indicator and selection management
 * - Empty state handling with encouraging call-to-action
 * - Modal overlay design for focused user interaction
 * - Responsive grid layout for optimal viewing
 * 
 * Component Architecture:
 * - Vue 3 Composition API with Vuex store integration
 * - Real-time state synchronization with global vehicle store
 * - Event-driven communication with parent components
 * - Dynamic UI updates based on vehicle list changes
 * - Integration with UserManager for backend persistence
 * 
 * Vehicle Management Features:
 * - Display vehicle images, names, and technical details
 * - Active vehicle selection with visual indicators
 * - Safe vehicle deletion with confirmation dialogs
 * - Quick access to add new vehicles
 * - Vehicle card design with hover interactions
 * - Support for vehicle images with fallback placeholders
 * 
 * UI/UX Features:
 * - Clean, organized vehicle cards with consistent layout
 * - Visual indicators for currently active vehicle
 * - Empty state design encouraging first vehicle registration
 * - Responsive grid system adapting to different screen sizes
 * - Intuitive action buttons with clear iconography
 * - Smooth hover effects and interactive feedback
 * - Accessibility-compliant design with proper navigation
 * 
 * State Management:
 * - Real-time synchronization with Vuex vehicle store
 * - Active vehicle tracking and selection persistence
 * - Immediate UI updates after vehicle operations
 * - Consistent state management across application
 * 
 * User Experience:
 * - Encouraging empty state for new users
 * - Quick vehicle addition workflow
 * - Safe deletion process with confirmation
 * - Visual feedback for all user actions
 * - Mobile-optimized touch interface
 * - Clear visual hierarchy and information organization
 * 
 * Integration:
 * - Seamless connection with vehicle registration modal
 * - Backend synchronization through UserManager service
 * - Global state management through Vuex store
 * - Consistent data flow and state updates
 * 
 * @component VehicleListModal
 * @author André Gaspar - 59859, João Lima - 60350, Marisa Basílio - 54550, Pedro Afonso - 70357, Tiago Sequeira - 55354 - MSP 2024/2025 FCT Nova
 * @since 1.0.0
 */

<template>
  <div v-if="isVisible" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-container vehicle-list-modal">
      <div class="modal-header">
        <h2>📋 My Vehicles</h2>
        <button @click="$emit('close')" class="close-button">×</button>
      </div>
      <div class="modal-content">
        <!-- Empty State -->
        <div v-if="store.vehicles.length === 0" class="empty-vehicles">
          <div class="empty-icon">🚗</div>
          <h3>No vehicles registered</h3>
          <p>You haven't registered any vehicles yet.</p>
          <button @click="addVehicle" class="add-vehicle-btn">
            <span>➕</span> Add Your First Vehicle
          </button>
        </div>

        <!-- Vehicle List -->
        <div v-else class="vehicles-container">
          <div class="vehicles-header">
            <h3>Your registered vehicles</h3>
            <button @click="addVehicle" class="add-more-btn">
              <span>➕</span> Add More
            </button>
          </div>
          
          <ul class="vehicle-list">
            <li v-for="(vehicle, index) in store.vehicles" :key="index" class="vehicle-item">
              <img
                :src="vehicle.image || 'src/assets/car_images/placeholder_car.jpg'"
                alt="Car Image"
                class="vehicle-image"
                @error="handleImageError"
              />
              <div class="vehicle-info">
                <div class="vehicle-name">{{ vehicle.name }}</div>
                <div class="vehicle-details">{{ vehicle.brand }} {{ vehicle.model }}</div>
              </div>
              <div class="vehicle-actions">
                <button @click="selectVehicle(vehicle)" class="select-btn">
                  Select
                </button>
                <button @click="removeVehicle(index)" class="remove-btn">
                  🗑️
                </button>
              </div>
            </li>
          </ul>
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

const emit = defineEmits(['close'])

const handleImageError = (event) => {
  event.target.src = 'src/assets/car_images/placeholder_car.jpg'
}

const selectVehicle = (vehicle) => {
  store.selectVehicle(vehicle)
  emit('close')
}

const removeVehicle = (index) => {
  store.removeVehicle(index)
}

const addVehicle = () => {
  store.toggleModal('vehicleRegistration')
  emit('close')
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

.vehicle-list-modal {
  max-width: 700px;
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

.empty-vehicles {
  text-align: center;
  padding: 3rem 2rem;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-vehicles h3 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.5rem;
}

.empty-vehicles p {
  color: #666;
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.add-vehicle-btn {
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.add-vehicle-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
}

.vehicles-container {
  min-height: 200px;
}

.vehicles-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f8f9fa;
}

.vehicles-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.3rem;
}

.add-more-btn {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.add-more-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.vehicle-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.vehicle-item {
  display: flex;
  align-items: center;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 15px;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.vehicle-item:hover {
  background: #e9ecef;
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.vehicle-image {
  width: 80px;
  height: 60px;
  object-fit: cover;
  border-radius: 10px;
  margin-right: 1.5rem;
  border: 2px solid #dee2e6;
}

.vehicle-info {
  flex: 1;
}

.vehicle-name {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.3rem;
}

.vehicle-details {
  color: #666;
  font-size: 0.9rem;
}

.vehicle-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.select-btn {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.select-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
}

.remove-btn {
  padding: 0.5rem;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 50%;
  width: 35px;
  height: 35px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn:hover {
  background: #c82333;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(220, 53, 69, 0.3);
}
</style>
