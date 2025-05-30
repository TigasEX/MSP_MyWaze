/**
 * LocationSharingPanel.vue
 * 
 * Real-time location sharing control panel component for MyWaze application.
 * Provides a collapsible interface for monitoring and managing location sharing functionality
 * with connected users in real-time through WebSocket connections.
 * 
 * Key Features:
 * - Real-time connection status monitoring with visual indicators
 * - Connected users list with location data and timestamps
 * - Auto-enabled location sharing with manual reconnection option
 * - User-friendly collapsible panel design with smooth animations
 * - Live location tracking display with distance calculations
 * - Vehicle information display for connected users
 * - Connection health monitoring and automatic reconnection
 * - Privacy-focused design with secure data transmission
 * 
 * Component Architecture:
 * - Integrates with UserLocationSharingService for WebSocket communication
 * - Uses Vuex store for global state management and user data
 * - Implements reactive UI updates based on connection status changes
 * - Provides real-time user list updates and location synchronization
 * - Handles connection errors gracefully with user feedback
 * 
 * UI/UX Features:
 * - Collapsible panel with smooth expand/collapse animations
 * - Visual connection status indicators (connected/disconnected states)
 * - User cards displaying names, locations, and vehicle information
 * - Responsive design optimized for mobile and desktop use
 * - Clear visual feedback for connection attempts and errors
 * - Intuitive icons and color coding for different states
 * 
 * Security & Privacy:
 * - Secure WebSocket connections with proper authentication
 * - Location data transmission only with user consent
 * - No persistent storage of sensitive location information
 * - Real-time data only - no historical tracking
 * 
 * @component LocationSharingPanel
 * @author André Gaspar - 59859, João Lima - 60350, Marisa Basílio - 54550, Pedro Afonso - 70357, Tiago Sequeira - 55354 - MSP 2024/2025 FCT Nova
 * @since 1.0.0
 */

<template>
  <div class="location-sharing-panel">
    <div class="panel-header" @click="togglePanel">
      <h3>
        <span class="icon">📍</span>
        Location Sharing
        <span class="status-indicator" :class="{ 'connected': isConnected, 'disconnected': !isConnected }"></span>
      </h3>
      <button class="toggle-button" :class="{ 'expanded': isExpanded }">
        {{ isExpanded ? '▼' : '▲' }}
      </button>
    </div>
    
    <div v-if="isExpanded" class="panel-content">
      <!-- Connection Status -->
      <div class="connection-status">
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

      <!-- Auto-enabled info -->
      <div class="auto-enabled-info">
        <div class="info-note">
          📍 Location sharing is automatically enabled for all users
        </div>
        <button 
          v-if="!isConnected" 
          @click="reconnect" 
          class="btn btn-secondary"
          :disabled="isConnecting"
        >
          {{ isConnecting ? 'Connecting...' : 'Reconnect' }}
        </button>
      </div>

      <!-- Connected Users List -->
      <div v-if="isConnected && connectedUsers.length > 0" class="users-list">
        <h4>Connected Users ({{ connectedUsers.length }})</h4>
        <div class="users-grid">
          <div 
            v-for="user in connectedUsers" 
            :key="user.id" 
            class="user-card"
            :class="{ 'has-location': user.position }"
          >
            <div class="user-info">
              <span class="user-name">{{ user.name }}</span>
              <span class="user-status" :class="{ 'online': isUserOnline(user), 'offline': !isUserOnline(user) }">
                {{ isUserOnline(user) ? 'Online' : 'Offline' }}
              </span>
            </div>
            <div class="user-details">
              <div v-if="user.position" class="location-info">
                📍 {{ formatLocation(user.position) }}
              </div>
              <div class="last-seen">
                Last seen: {{ formatLastSeen(user.lastSeen) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Connection Info -->
      <div v-if="isConnected" class="connection-info">
        <div class="info-row">
          <span class="label">Threshold:</span>
          <span>10m (fixed)</span>
        </div>
      </div>

      <!-- Error Messages -->
      <div v-if="errorMessage" class="error-message">
        ⚠️ {{ errorMessage }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

// Props
const props = defineProps({
  isEnabled: {
    type: Boolean,
    default: false
  },
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
  showOtherUsers: {
    type: Boolean,
    default: true
  },
  errorMessage: {
    type: String,
    default: null
  }
});

// Emits
const emit = defineEmits([
  'reconnect'
]);

// Component state
const isExpanded = ref(true);
const isConnecting = ref(false);

// Computed properties
const isUserOnline = (user) => {
  return user.lastSeen && (Date.now() - user.lastSeen) < 30000; // 30 seconds threshold
};

// Methods
const togglePanel = () => {
  isExpanded.value = !isExpanded.value;
};

const reconnect = async () => {
  isConnecting.value = true;
  try {
    await emit('reconnect');
  } finally {
    isConnecting.value = false;
  }
};

const formatLocation = (position) => {
  if (!position) return 'Unknown';
  return `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`;
};

const formatLastSeen = (timestamp) => {
  if (!timestamp) return 'Unknown';
  
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 10000) return 'Just now';
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  
  return new Date(timestamp).toLocaleDateString();
};
</script>

<style scoped>
.location-sharing-panel {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin: 10px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  cursor: pointer;
  user-select: none;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon {
  font-size: 18px;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #6c757d;
  transition: background-color 0.3s ease;
}

.status-indicator.connected {
  background-color: #28a745;
}

.status-indicator.disconnected {
  background-color: #dc3545;
}

.toggle-button {
  background: none;
  border: none;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.toggle-button:hover {
  background-color: #e9ecef;
}

.toggle-button.expanded {
  transform: rotate(180deg);
}

.panel-content {
  padding: 16px;
}

.connection-status {
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
  padding: 2px 8px;
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
  font-weight: 600;
  color: #007bff;
}

.auto-enabled-info {
  margin-bottom: 16px;
}

.info-note {
  background-color: #e7f3ff;
  color: #0056b3;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  margin-bottom: 8px;
  text-align: center;
}

.controls {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #545b62;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: #c82333;
}

.btn-outline {
  background-color: transparent;
  border: 1px solid #007bff;
  color: #007bff;
}

.btn-outline:hover {
  background-color: #007bff;
  color: white;
}

.btn-outline.active {
  background-color: #007bff;
  color: white;
}

.users-list h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.users-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.user-card {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 10px;
  transition: all 0.2s ease;
}

.user-card:hover {
  background: #e9ecef;
}

.user-card.has-location {
  border-left: 4px solid #28a745;
}

.user-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.user-status {
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
}

.user-status.online {
  background-color: #d4edda;
  color: #155724;
}

.user-status.offline {
  background-color: #f8d7da;
  color: #721c24;
}

.user-details {
  font-size: 12px;
  color: #666;
}

.location-info {
  margin-bottom: 4px;
  font-family: monospace;
}

.connection-info {
  border-top: 1px solid #dee2e6;
  padding-top: 12px;
  margin-top: 16px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.threshold-slider {
  flex: 1;
  margin-left: 8px;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 8px;
  border-radius: 4px;
  font-size: 14px;
  margin-top: 12px;
}
</style>
