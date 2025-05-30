/**
 * ChargingStationsIndicator.vue
 * 
 * Compact EV charging stations indicator for MyWaze application.
 * Shows battery symbol with colored circle based on API status and 
 * reloads nearby stations when pressed.
 * 
 * Features:
 * - Battery symbol (🔋) with colored circle (green for API success, orange for fallback, red for failure)
 * - Click to reload nearby charging stations
 * - Hover tooltip with station count and status
 * - Loading animation when fetching data
 * - Compact design for slick UI
 * 
 * @component ChargingStationsIndicator
 * @author MyWaze Team - MSP 2024/2025 FCT Nova
 */

<template>
  <div class="charging-stations-indicator">
    <div 
      class="indicator-circle"
      :class="statusClass"
      @click="reloadStations"
      :title="tooltipText"
      :disabled="isLoading"
    >
      <span class="battery-icon" :class="{ 'loading': isLoading }">🔋</span>
      <div v-if="isLoading" class="loading-spinner"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  stationCount: {
    type: Number,
    default: 0
  },
  availableCount: {
    type: Number,
    default: 0
  },
  apiStatus: {
    type: String,
    default: 'unknown', // 'success', 'fallback', 'error', 'unknown'
    validator: (value) => ['success', 'fallback', 'error', 'unknown'].includes(value)
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  showStations: {
    type: Boolean,
    default: true
  }
})

// Emits
const emit = defineEmits(['reload-stations'])

// Computed properties
const statusClass = computed(() => {
  if (props.isLoading) return 'loading'
  
  switch (props.apiStatus) {
    case 'success':
      return 'success'
    case 'fallback':
      return 'fallback'
    case 'error':
      return 'error'
    default:
      return 'unknown'
  }
})

const tooltipText = computed(() => {
  if (props.isLoading) {
    return 'Loading charging stations...'
  }
  
  let statusText = ''
  switch (props.apiStatus) {
    case 'success':
      statusText = 'API Connected'
      break
    case 'fallback':
      statusText = 'Fallback Data'
      break
    case 'error':
      statusText = 'API Error'
      break
    default:
      statusText = 'Unknown Status'
  }
  
  return `EV Charging: ${props.stationCount} stations (${props.availableCount} available) - ${statusText}`
})

// Methods
const reloadStations = () => {
  if (!props.isLoading) {
    emit('reload-stations')
  }
}
</script>

<style scoped>
.charging-stations-indicator {
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
  position: relative;
}

.indicator-circle:hover:not([disabled]) {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.indicator-circle[disabled] {
  cursor: not-allowed;
  opacity: 0.8;
}

/* Status colors */
.indicator-circle.success {
  background: linear-gradient(135deg, #28a745, #20c997);
}

.indicator-circle.fallback {
  background: linear-gradient(135deg, #fd7e14, #ffc107);
}

.indicator-circle.error {
  background: linear-gradient(135deg, #dc3545, #e74c3c);
}

.indicator-circle.unknown {
  background: linear-gradient(135deg, #6c757d, #adb5bd);
}

.indicator-circle.loading {
  background: linear-gradient(135deg, #007bff, #0056b3);
}

.battery-icon {
  font-size: 20px;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  transition: opacity 0.3s ease;
}

.battery-icon.loading {
  opacity: 0.6;
}

.loading-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: translate(-50%, -50%) rotate(0deg); }
  100% { transform: translate(-50%, -50%) rotate(360deg); }
}
</style>
