/**
 * ToastNotification.vue
 * 
 * Reusable toast notification component for displaying temporary messages
 * to users in the MyWaze application. Provides different notification types
 * with smooth animations and auto-dismiss functionality.
 * 
 * Key Features:
 * - Multiple notification types (success, warning, error, info)
 * - Auto-dismiss functionality with configurable duration
 * - Smooth entrance and exit animations using Vue transitions
 * - Manual close option with close button
 * - Customizable title and message content
 * - Responsive design for different screen sizes
 * - Distinctive icons and color coding for each notification type
 * - Non-intrusive positioning and behavior
 * 
 * Component Architecture:
 * - Vue 3 Composition API with reactive state management
 * - Props-based configuration for flexible usage
 * - Event-driven architecture with close callbacks
 * - CSS transitions for smooth visual effects
 * - Accessible design with proper ARIA attributes
 * 
 * Notification Types:
 * - Success (✅): Green styling for successful operations
 * - Warning (⚠️): Orange styling for cautionary messages
 * - Error (❌): Red styling for error conditions
 * - Info (ℹ️): Blue styling for informational messages
 * 
 * UI/UX Features:
 * - Clean, modern design with rounded corners and shadows
 * - Color-coded backgrounds and borders for quick recognition
 * - Descriptive icons for visual reinforcement of message type
 * - Smooth slide-in animation from top for natural user experience
 * - Auto-dismiss timing prevents UI clutter
 * - Manual close button for user control
 * 
 * Usage:
 * - Display operation feedback (save success, error messages)
 * - Show system status updates (connection status, sync status)
 * - Provide user guidance and warnings
 * - Confirm user actions and provide feedback
 * 
 * @component ToastNotification
 * @author André Gaspar - 59859, João Lima - 60350, Marisa Basílio - 54550, Pedro Afonso - 70357, Tiago Sequeira - 55354 - MSP 2024/2025 FCT Nova
 * @since 1.0.0
 */

<template>
  <Transition name="toast" appear>
    <div v-if="isVisible" :class="['toast', `toast-${type}`]">
      <div class="toast-icon">
        <span v-if="type === 'success'">✅</span>
        <span v-else-if="type === 'warning'">⚠️</span>
        <span v-else-if="type === 'error'">❌</span>
        <span v-else>ℹ️</span>
      </div>
      <div class="toast-content">
        <div class="toast-title">{{ title }}</div>
        <div v-if="message" class="toast-message">{{ message }}</div>
      </div>
      <button @click="close" class="toast-close">×</button>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'info', // success, warning, error, info
    validator: (value) => ['success', 'warning', 'error', 'info'].includes(value)
  },
  duration: {
    type: Number,
    default: 5000 // 5 seconds
  },
  autoClose: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['close'])

const isVisible = ref(false)

const close = () => {
  isVisible.value = false
  setTimeout(() => {
    emit('close')
  }, 300) // Wait for transition to complete
}

onMounted(() => {
  isVisible.value = true
  
  if (props.autoClose && props.duration > 0) {
    setTimeout(() => {
      close()
    }, props.duration)
  }
})
</script>

<style scoped>
.toast {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 10000;
  max-width: 400px;
  min-width: 300px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border-left: 4px solid #3b82f6;
}

.toast-success {
  border-left-color: #10b981;
}

.toast-warning {
  border-left-color: #f59e0b;
}

.toast-error {
  border-left-color: #ef4444;
}

.toast-info {
  border-left-color: #3b82f6;
}

.toast-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.toast-message {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.4;
}

.toast-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #9ca3af;
  cursor: pointer;
  flex-shrink: 0;
  padding: 0;
  margin: -0.25rem -0.25rem 0 0;
  transition: color 0.2s ease;
}

.toast-close:hover {
  color: #6b7280;
}

/* Transitions */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(-100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(-100%);
}

/* Mobile responsiveness */
@media (max-width: 480px) {
  .toast {
    left: 20px;
    right: 20px;
    max-width: none;
    min-width: auto;
  }
}
</style>
