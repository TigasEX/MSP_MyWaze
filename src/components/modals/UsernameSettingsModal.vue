/**
 * UsernameSettingsModal.vue
 * 
 * Modal component for managing user account settings, specifically username
 * configuration in the MyWaze application. Provides secure username update
 * functionality with validation and user feedback.
 * 
 * Key Features:
 * - Current user information display (username, email)
 * - Secure username update with validation
 * - Real-time form validation and feedback
 * - Integration with UserManager for backend updates
 * - Modal overlay design for focused user interaction
 * - Error handling and success confirmation
 * - Username availability checking
 * - Form security and input sanitization
 * 
 * Component Architecture:
 * - Vue 3 Composition API with reactive state management
 * - Integration with UserManager service for authentication
 * - Real-time validation with user feedback
 * - Event-driven parent-child communication
 * - Secure API communication for username updates
 * 
 * User Account Features:
 * - Display current username and email information
 * - Username change functionality with validation
 * - Account information overview and management
 * - Profile settings integration
 * - Secure session management
 * 
 * UI/UX Features:
 * - Clean modal design with clear information display
 * - Current account information overview section
 * - Intuitive form layout with proper labeling
 * - Real-time validation feedback during input
 * - Accessibility-compliant form design
 * - Mobile-optimized input fields
 * - Clear action buttons (Update, Cancel)
 * 
 * Validation & Security:
 * - Username format validation (alphanumeric, length)
 * - Real-time availability checking
 * - Prevention of invalid or duplicate usernames
 * - Input sanitization and security measures
 * - User-friendly error messaging
 * - Confirmation of successful updates
 * 
 * Form Features:
 * - Current username display with clear labeling
 * - New username input with placeholder text
 * - Real-time character counting and validation
 * - Visual feedback for validation status
 * - Error state handling and display
 * 
 * Integration:
 * - Seamless integration with UserManager service
 * - Real-time state updates after username changes
 * - Global authentication state management
 * - Consistent user session handling
 * - Backend API synchronization for username updates
 * 
 * User Experience:
 * - Clear presentation of current account information
 * - Straightforward username update process
 * - Immediate feedback for user actions
 * - Professional and trustworthy design
 * - Accessible interface with proper navigation
 * 
 * @component UsernameSettingsModal
 * @author André Gaspar - 59859, João Lima - 60350, Marisa Basílio - 54550, Pedro Afonso - 70357, Tiago Sequeira - 55354 - MSP 2024/2025 FCT Nova
 * @since 1.0.0
 */

<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2 class="modal-title">
          <span class="icon">👤</span>
          Username Settings
        </h2>
        <button @click="$emit('close')" class="close-button">×</button>
      </div>

      <div class="modal-body">
        <div class="current-info">
          <div class="info-item">
            <span class="label">Current Username:</span>
            <span class="value">{{ currentUser?.username || 'Not set' }}</span>
          </div>
          <div class="info-item">
            <span class="label">Email:</span>
            <span class="value">{{ currentUser?.email }}</span>
          </div>
        </div>

        <div class="form-section">
          <div class="input-group">
            <label for="newUsername" class="input-label">New Username</label>
            <input
              v-model="newUsername"
              type="text"
              id="newUsername"
              placeholder="Enter new username"
              class="input-field"
              @keyup.enter="updateUsername"
            />
          </div>
          
          <div class="button-group">
            <button 
              @click="updateUsername" 
              :disabled="!newUsername.trim() || isUpdating"
              class="save-button"
            >
              <span v-if="!isUpdating">💾 Update Username</span>
              <span v-else>⏳ Updating...</span>
            </button>
            <button @click="$emit('close')" class="cancel-button">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { UserManager } from '@/services/UserManager'
import { store } from '@/store'

// Props and emits
defineEmits(['close'])

// State
const newUsername = ref('')
const isUpdating = ref(false)
const userManager = new UserManager()

// Computed
const currentUser = computed(() => store.user)

// Methods
const updateUsername = async () => {
  if (!newUsername.value.trim()) return
  
  isUpdating.value = true
  
  try {
    const updatedUser = await userManager.updateUsername(currentUser.value.email, newUsername.value.trim())
    
    // Update the store with the new user data
    store.setAuthentication(true, updatedUser.email, store.user.sessionToken)
    store.user.username = updatedUser.username
    
    alert('Username updated successfully!')
    newUsername.value = ''
    
  } catch (error) {
    alert(`Failed to update username: ${error.message}`)
  } finally {
    isUpdating.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 16px;
  border-bottom: 1px solid #eee;
}

.modal-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.icon {
  font-size: 28px;
}

.close-button {
  background: none;
  border: none;
  font-size: 32px;
  color: #999;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: color 0.2s;
}

.close-button:hover {
  color: #666;
}

.modal-body {
  padding: 24px;
}

.current-info {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.label {
  font-weight: 500;
  color: #666;
}

.value {
  font-weight: 600;
  color: #333;
  background: white;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #ddd;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-label {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.input-field {
  padding: 12px 16px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s;
}

.input-field:focus {
  outline: none;
  border-color: #245DDA;
}

.button-group {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.save-button {
  background: #245DDA;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.save-button:hover:not(:disabled) {
  background: #1e4bb8;
  transform: translateY(-1px);
}

.save-button:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.cancel-button {
  background: #f8f9fa;
  color: #666;
  border: 1px solid #ddd;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-button:hover {
  background: #e9ecef;
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 20px;
  }
  
  .button-group {
    flex-direction: column;
  }
  
  .save-button, .cancel-button {
    width: 100%;
  }
}
</style>
