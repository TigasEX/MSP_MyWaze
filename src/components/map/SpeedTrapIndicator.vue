/**
 * SpeedTrapIndicator.vue
 * 
 * Compact indicator component showing speed trap status and controls
 * for the MyWaze application. Displays speed trap count, allows toggling
 * visibility, and provides access to speed trap management features.
 * 
 * Key Features:
 * - Real-time speed trap count display
 * - Toggle visibility of speed traps on map
 * - Visual indicators for verified vs unverified traps
 * - Add speed trap mode toggle
 * - Compact design for minimal screen space usage
 * 
 * @component SpeedTrapIndicator
 * @author André Gaspar - 59859, João Lima - 60350, Marisa Basílio - 54550, Pedro Afonso - 70357, Tiago Sequeira - 55354 - MSP 2024/2025 FCT Nova
 */

<template>
  <div class="speed-trap-indicator">
    <div class="indicator-content">
      <!-- Speed Trap Icon -->
      <div class="trap-icon" :class="statusClass">
        🚨
      </div>
      
      <!-- Speed Trap Info -->
      <div class="trap-info">
        <div class="trap-count">
          {{ trapCount }}
        </div>
        <div class="trap-label">
          Speed Traps
        </div>
        <div v-if="verifiedCount > 0" class="trap-verified">
          {{ verifiedCount }} verified
        </div>
      </div>
      
      <!-- Controls -->
      <div class="trap-controls">
        <!-- Toggle visibility -->
        <button 
          @click="$emit('toggle-visibility')"
          :class="['control-btn', 'visibility-btn', { active: showSpeedTraps }]"
          :title="showSpeedTraps ? 'Hide speed traps' : 'Show speed traps'"
        >
          {{ showSpeedTraps ? '👁️' : '🙈' }}
        </button>
        
        <!-- Add speed trap at current location -->
        <button 
          @click="$emit('toggle-add-mode')"
          class="control-btn add-btn"
          title="Add speed trap at current location"
        >
          ➕
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  trapCount: {
    type: Number,
    default: 0
  },
  verifiedCount: {
    type: Number,
    default: 0
  },
  showSpeedTraps: {
    type: Boolean,
    default: true
  }
})

// Emits
const emit = defineEmits(['toggle-visibility', 'toggle-add-mode'])

// Computed properties
const statusClass = computed(() => {
  if (props.trapCount === 0) return 'none'
  if (props.verifiedCount > 0) return 'verified'
  return 'unverified'
})
</script>

<style scoped>
.speed-trap-indicator {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: 8px;
  min-width: 120px;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.speed-trap-indicator.adding-mode {
  border-color: #007bff;
  background: rgba(0, 123, 255, 0.1);
}

.indicator-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.trap-icon {
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.trap-icon.none {
  background: rgba(108, 117, 125, 0.1);
  opacity: 0.6;
}

.trap-icon.unverified {
  background: rgba(255, 193, 7, 0.2);
}

.trap-icon.verified {
  background: rgba(220, 53, 69, 0.2);
}

.trap-icon.adding {
  background: rgba(0, 123, 255, 0.2);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.trap-info {
  flex: 1;
  min-width: 60px;
}

.trap-count {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  line-height: 1;
}

.trap-label {
  font-size: 10px;
  color: #666;
  line-height: 1;
  margin-top: 1px;
}

.trap-verified {
  font-size: 9px;
  color: #28a745;
  font-weight: 600;
  line-height: 1;
  margin-top: 1px;
}

.trap-controls {
  display: flex;
  gap: 4px;
}

.control-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: rgba(108, 117, 125, 0.1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.2s ease;
}

.control-btn:hover {
  background: rgba(108, 117, 125, 0.2);
  transform: scale(1.1);
}

.control-btn.active {
  background: #007bff;
  color: white;
}

.visibility-btn.active {
  background: #28a745;
}

.add-btn.active {
  background: #007bff;
  animation: pulse 2s infinite;
}

.add-instructions {
  margin-top: 6px;
  font-size: 10px;
  color: #007bff;
  text-align: center;
  font-weight: 500;
  padding: 4px 8px;
  background: rgba(0, 123, 255, 0.1);
  border-radius: 4px;
  border: 1px dashed #007bff;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .speed-trap-indicator {
    min-width: 100px;
    padding: 6px;
  }
  
  .trap-icon {
    font-size: 18px;
    width: 28px;
    height: 28px;
  }
  
  .trap-count {
    font-size: 14px;
  }
  
  .control-btn {
    width: 20px;
    height: 20px;
    font-size: 10px;
  }
}
</style>
