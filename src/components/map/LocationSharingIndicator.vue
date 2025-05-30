/**
 * LocationSharingIndicator.vue
 * 
 * Compact location sharing status indicator for MyWaze application.
 * Shows connection status with a network symbol in a colored circle and 
 * expands to show connected users when clicked.
 * 
 * Features:
 * - Network symbol (📶) with green/red circle based on connection status
 * - Click to expand and show connected users list
 * - Hover tooltip with quick status info
 * - Compact design for slick UI
 * 
 * @component LocationSharingIndicator
 * @author MyWaze Team - MSP 2024/2025 FCT Nova
 */

<template>
  <div class="location-sharing-indicator" :class="{ 'expanded': isExpanded }">
    <!-- Compact Indicator -->
    <div 
      class="indicator-circle"
      :class="{ 'connected': isConnected, 'disconnected': !isConnected }"
      @click="toggleExpanded"
      :title="tooltipText"
    >
      <span class="network-icon">📶</span>
    </div>

    <!-- Expanded Panel -->
    <div v-if="isExpanded" class="expanded-panel">
      <div class="panel-header">
        <h4>Location Sharing</h4>
        <button class="close-btn" @click="toggleExpanded">×</button>
      </div>
      
      <div class="panel-content">
        <!-- Connection Status -->
        <div class="status-section">
          <div class="status-row">
            <span class="label">Status:</span>
            <span class="status" :class="{ 'connected': isConnected, 'disconnected': !isConnected }">
              {{ isConnected ? 'Connected' : 'Disconnected' }}
            </span>
          </div>
          <div v-if="currentUser.name" class="status-row">
            <span class="label">You:</span>
            <span class="user-name">{{ currentUser.name }}</span>
          </div>
        </div>

        <!-- Connected Users -->
        <div v-if="isConnected && connectedUsers.length > 0" class="users-section">
          <h5>Connected Users ({{ connectedUsers.length }})</h5>
          <div class="users-list">
            <div 
              v-for="user in connectedUsers" 
              :key="user.id" 
              class="user-item"
            >
              <div class="user-info">
                <span class="user-name">{{ user.name }}</span>
                <span class="user-status" :class="{ 'online': isUserOnline(user) }">
                  {{ isUserOnline(user) ? '🟢' : '🔴' }}
                </span>
              </div>
              <div v-if="user.position" class="user-location">
                📍 {{ formatLocation(user.position) }}
              </div>
            </div>
          </div>
        </div>

        <!-- No Users Connected -->
        <div v-else-if="isConnected && connectedUsers.length === 0" class="no-users">
          <p>No other users currently sharing location</p>
        </div>

        <!-- Disconnected State -->
        <div v-if="!isConnected" class="disconnected-section">
          <p>Location sharing is disconnected</p>
          <button 
            @click="reconnect" 
            class="reconnect-btn"
            :disabled="isConnecting"
          >
            {{ isConnecting ? 'Connecting...' : 'Reconnect' }}
          </button>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="error-message">
          ⚠️ {{ errorMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// Props
const props = defineProps({
  isConnected: {
    type: Boolean,
    default: false
  },
  currentUser: {
    type: Object,
    default: () => ({ id: null, name: null })
  },
  connectedUsers: {
    type: Array,
    default: () => []
  },
  errorMessage: {
    type: String,
    default: null
  }
})

// Emits
const emit = defineEmits(['reconnect'])

// Component state
const isExpanded = ref(false)
const isConnecting = ref(false)

// Computed properties
const tooltipText = computed(() => {
  if (props.isConnected) {
    return `Location Sharing: Connected (${props.connectedUsers.length} users)`
  } else {
    return 'Location Sharing: Disconnected'
  }
})

// Methods
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

const isUserOnline = (user) => {
  return user.lastSeen && (Date.now() - user.lastSeen) < 30000 // 30 seconds threshold
}

const formatLocation = (position) => {
  if (!position) return 'Unknown'
  return `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`
}

const reconnect = async () => {
  isConnecting.value = true
  try {
    await emit('reconnect')
  } finally {
    isConnecting.value = false
  }
}

// Close expanded panel when clicking outside
const handleOutsideClick = (event) => {
  if (!event.target.closest('.location-sharing-indicator')) {
    isExpanded.value = false
  }
}

// Add event listener when expanded
import { onMounted, onUnmounted, watch } from 'vue'

let outsideClickHandler = null

watch(isExpanded, (newValue) => {
  if (newValue) {
    setTimeout(() => {
      outsideClickHandler = handleOutsideClick
      document.addEventListener('click', outsideClickHandler)
    }, 100)
  } else {
    if (outsideClickHandler) {
      document.removeEventListener('click', outsideClickHandler)
      outsideClickHandler = null
    }
  }
})

onUnmounted(() => {
  if (outsideClickHandler) {
    document.removeEventListener('click', outsideClickHandler)
  }
})
</script>

<style scoped>
.location-sharing-indicator {
  position: relative;
  z-index: 1000;
}

.indicator-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  user-select: none;
}

.indicator-circle.connected {
  background: linear-gradient(135deg, #28a745, #20c997);
}

.indicator-circle.disconnected {
  background: linear-gradient(135deg, #dc3545, #e74c3c);
}

.indicator-circle:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.network-icon {
  font-size: 20px;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.expanded-panel {
  position: absolute;
  top: 50px;
  right: 0;
  width: 300px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.panel-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #e9ecef;
  color: #333;
}

.panel-content {
  padding: 16px;
  max-height: 400px;
  overflow-y: auto;
}

.status-section {
  margin-bottom: 16px;
}

.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.label {
  font-weight: 600;
  color: #666;
  font-size: 14px;
}

.status {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.status.connected {
  background-color: #d4edda;
  color: #155724;
}

.status.disconnected {
  background-color: #f8d7da;
  color: #721c24;
}

.user-name {
  font-weight: 500;
  color: #333;
}

.users-section h5 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.user-item {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 10px;
}

.user-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.user-status {
  font-size: 12px;
}

.user-location {
  font-size: 12px;
  color: #666;
}

.no-users {
  text-align: center;
  color: #666;
  font-style: italic;
  padding: 16px 0;
}

.disconnected-section {
  text-align: center;
  padding: 16px 0;
}

.disconnected-section p {
  margin: 0 0 12px 0;
  color: #666;
}

.reconnect-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.reconnect-btn:hover:not(:disabled) {
  background: #0056b3;
}

.reconnect-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  margin-top: 12px;
}
</style>
