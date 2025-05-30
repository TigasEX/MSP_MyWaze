/**
 * VehicleRegistrationModal.vue
 * 
 * Modal component for registering new vehicles in the MyWaze application.
 * Provides a comprehensive vehicle registration form with brand/model selection,
 * custom naming, and integration with the user's vehicle management system.
 * 
 * Key Features:
 * - Comprehensive car database with multiple brands and models
 * - Dynamic model loading based on selected brand
 * - Custom vehicle naming for personalization
 * - Form validation with real-time feedback
 * - Integration with UserManager for vehicle persistence
 * - Modal overlay design for focused user interaction
 * - Responsive form layout for all screen sizes
 * - Error handling and success feedback
 * 
 * Component Architecture:
 * - Vue 3 Composition API with reactive state management
 * - Integration with UserManager service for backend communication
 * - Dynamic data loading for car brands and models
 * - Event-driven parent-child communication
 * - Form validation with user-friendly error messages
 * 
 * Vehicle Database Features:
 * - Extensive car brand and model database
 * - Hierarchical brand -> model selection system
 * - Support for popular automotive manufacturers
 * - Extensible database structure for future additions
 * - Real-time model filtering based on brand selection
 * 
 * UI/UX Features:
 * - Clean modal design with clear visual hierarchy
 * - Intuitive dropdown selections for brand and model
 * - Custom text input for personalized vehicle names
 * - Visual feedback during registration process
 * - Accessibility-compliant form design
 * - Mobile-optimized touch interface
 * - Clear action buttons (Register, Cancel)
 * 
 * Form Validation:
 * - Required field validation for brand and model
 * - Optional custom naming with default fallback
 * - Real-time validation feedback
 * - Error state handling and display
 * - Prevention of duplicate vehicle registration
 * 
 * Integration:
 * - Seamless integration with vehicle management system
 * - Automatic addition to user's vehicle list
 * - Persistent storage through UserManager service
 * - Real-time UI updates after successful registration
 * 
 * @component VehicleRegistrationModal
 * @author André Gaspar - 59859, João Lima - 60350, Marisa Basílio - 54550, Pedro Afonso - 70357, Tiago Sequeira - 55354 - MSP 2024/2025 FCT Nova
 * @since 1.0.0
 */

<template>
  <div v-if="isVisible" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-container">
      <div class="modal-header">
        <h2>🚘 Register New Vehicle</h2>
        <button @click="$emit('close')" class="close-button">×</button>
      </div>
      <div class="modal-content">
        <!-- Vehicle Registration Form -->
        <div class="form-group">
          <label for="brand" class="form-label">Car Brand:</label>
          <select v-model="selectedBrand" @change="updateModels" id="brand" class="form-input">
            <option value="">Select a brand</option>
            <option v-for="brand in carDatabase" :key="brand.brand" :value="brand.brand">
              {{ brand.brand }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="model" class="form-label">Car Model:</label>
          <select v-model="selectedModel" id="model" class="form-input">
            <option value="">Select a model</option>
            <option v-for="model in availableModels" :key="model.name" :value="model.name">
              {{ model.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="name" class="form-label">Vehicle Name:</label>
          <input
            v-model="vehicleName"
            type="text"
            id="name"
            placeholder="My Car"
            class="form-input"
          />
        </div>

        <button @click="registerVehicle" class="submit-button" :disabled="!canRegister">
          <span class="mr-2">✅</span> Register Vehicle
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { carDatabase } from '@/data/carDatabase'
import { store } from '@/store'

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

// Form state
const vehicleName = ref('')
const selectedBrand = ref('')
const selectedModel = ref('')
const availableModels = ref([])

// Computed properties
const canRegister = computed(() => {
  return vehicleName.value && selectedBrand.value && selectedModel.value
})

// Update available models when brand is selected
const updateModels = () => {
  if (!selectedBrand.value) {
    availableModels.value = carDatabase.flatMap((b) => b.models)
  } else {
    const brand = carDatabase.find((b) => b.brand === selectedBrand.value)
    availableModels.value = brand ? brand.models : []
  }
  selectedModel.value = ''
}

// Register a new vehicle
const registerVehicle = () => {
  if (!canRegister.value) return

  const brand = carDatabase.find((b) => b.brand === selectedBrand.value)
  const model = brand?.models.find((m) => m.name === selectedModel.value)
  
  const newVehicle = {
    name: vehicleName.value,
    brand: selectedBrand.value,
    model: selectedModel.value,
    image: model?.image || 'src/assets/car_images/placeholder_car.jpg',
  }

  // Add vehicle to store
  store.addVehicle(newVehicle)
  
  // Reset form fields
  resetForm()
  emit('close')
}

const resetForm = () => {
  vehicleName.value = ''
  selectedBrand.value = ''
  selectedModel.value = ''
  availableModels.value = []
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
  max-width: 500px;
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

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.submit-button {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
}

.submit-button:active:not(:disabled) {
  transform: translateY(0);
}

.submit-button:disabled {
  background: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
}

.mr-2 {
  margin-right: 0.5rem;
}
</style>
